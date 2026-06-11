package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/dzkchen/grad-26/api/internal/auth"
	"github.com/dzkchen/grad-26/api/internal/db"
	"github.com/dzkchen/grad-26/api/internal/handlers"
	"github.com/dzkchen/grad-26/api/internal/r2"
	"github.com/dzkchen/grad-26/api/internal/ratelimit"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
	slog.SetDefault(logger)

	secret := os.Getenv("INTERNAL_API_SECRET")
	if secret == "" {
		logger.Warn("INTERNAL_API_SECRET is empty; HMAC verification will reject all signed requests")
	}

	adminEmails := os.Getenv("ADMIN_EMAILS")
	if adminEmails == "" {
		logger.Warn("ADMIN_EMAILS is empty; /admin/* endpoints will 403 every caller")
	}
	isAdmin := auth.NewIsAdmin(adminEmails)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	r2Client, err := r2.New(r2.Config{
		Endpoint:        os.Getenv("R2_ENDPOINT"),
		AccessKeyID:     os.Getenv("R2_ACCESS_KEY_ID"),
		SecretAccessKey: os.Getenv("R2_SECRET_ACCESS_KEY"),
		Bucket:          os.Getenv("R2_BUCKET"),
	})
	if err != nil {
		logger.Error("r2 client init failed", "err", err)
		os.Exit(1)
	}

	dbpool, err := db.NewPool(context.Background(), db.DatabaseURL())
	if err != nil {
		logger.Error("database init failed", "err", err)
		os.Exit(1)
	}
	defer dbpool.Close()

	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.Recoverer)
	limiter := ratelimit.New()
	// Cheap per-instance guard before HMAC verification so bad auth cannot
	// force body reads and signature checks without any backpressure.
	r.Use(limiter.IPMiddleware("pre-auth", ratelimit.Config{Limit: 600, Window: time.Minute}))
	r.Use(auth.Verify(secret, map[string]bool{"/health": true}))

	publicHost := os.Getenv("R2_PUBLIC_HOSTNAME")
	if publicHost == "" {
		logger.Warn("R2_PUBLIC_HOSTNAME is empty; /directory will return raw object keys instead of public URLs")
	}

	r.Get("/health", handlers.Health)
	r.Get("/me/survey", handlers.MeSurvey(dbpool))
	r.With(limiter.Middleware("directory", ratelimit.Config{Limit: 240, Window: time.Minute})).
		Get("/directory", handlers.Directory(dbpool, publicHost))
	r.With(limiter.Middleware("stats-aggregates", ratelimit.Config{Limit: 60, Window: time.Minute})).
		Get("/stats/aggregates", handlers.StatsAggregates(dbpool))
	r.With(limiter.Middleware("upload-url", ratelimit.Config{Limit: 8, Window: time.Minute})).
		Post("/upload/url", handlers.UploadURL(r2Client))
	r.With(limiter.Middleware("survey", ratelimit.Config{Limit: 5, Window: 10 * time.Minute})).
		Post("/survey", handlers.CreateSurvey(dbpool, r2Client))
	r.Get("/admin/surveys", handlers.AdminListSurveys(dbpool, publicHost, isAdmin))
	r.With(limiter.Middleware("admin-mutation", ratelimit.Config{Limit: 60, Window: time.Minute})).
		Post("/admin/surveys/{id}/approve", handlers.AdminApproveSurvey(dbpool, isAdmin))
	r.With(limiter.Middleware("admin-mutation", ratelimit.Config{Limit: 60, Window: time.Minute})).
		Post("/admin/surveys/{id}/unapprove", handlers.AdminUnapproveSurvey(dbpool, isAdmin))
	r.With(limiter.Middleware("admin-mutation", ratelimit.Config{Limit: 60, Window: time.Minute})).
		Delete("/admin/surveys/{id}", handlers.AdminDeleteSurvey(dbpool, r2Client, isAdmin))

	srv := &http.Server{
		Addr:              ":" + port,
		Handler:           r,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       30 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       120 * time.Second,
	}

	serverErr := make(chan error, 1)
	go func() {
		logger.Info("server starting", "addr", srv.Addr)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			serverErr <- err
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)

	select {
	case err := <-serverErr:
		logger.Error("server failed", "err", err)
		os.Exit(1)
	case sig := <-stop:
		logger.Info("shutdown signal received", "signal", sig.String())
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		logger.Error("graceful shutdown failed", "err", err)
		os.Exit(1)
	}
	logger.Info("server stopped")
}
