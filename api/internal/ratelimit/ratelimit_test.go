package ratelimit

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/dzkchen/grad-26/api/internal/auth"
)

func testLimiter(current *time.Time) *Limiter {
	l := New()
	l.now = func() time.Time { return *current }
	l.nextPruneAt = current.Add(pruneInterval)
	return l
}

func TestAllowDenyAndReset(t *testing.T) {
	now := time.Date(2026, 6, 7, 12, 0, 0, 0, time.UTC)
	l := testLimiter(&now)
	cfg := Config{Limit: 2, Window: time.Minute}

	if ok, _ := l.Allow("upload-url", "Alex@PDSB.NET", cfg); !ok {
		t.Fatal("first request denied")
	}
	if ok, _ := l.Allow("upload-url", "alex@pdsb.net", cfg); !ok {
		t.Fatal("second request denied")
	}
	if ok, retryAfter := l.Allow("upload-url", "alex@pdsb.net", cfg); ok || retryAfter != time.Minute {
		t.Fatalf("third request = (%v, %s), want denied with 1m retry", ok, retryAfter)
	}

	now = now.Add(time.Minute)
	if ok, _ := l.Allow("upload-url", "alex@pdsb.net", cfg); !ok {
		t.Fatal("request after reset denied")
	}
}

func TestSeparateNamesAndCallersDoNotCollide(t *testing.T) {
	now := time.Date(2026, 6, 7, 12, 0, 0, 0, time.UTC)
	l := testLimiter(&now)
	cfg := Config{Limit: 1, Window: time.Minute}

	if ok, _ := l.Allow("upload-url", "alex@pdsb.net", cfg); !ok {
		t.Fatal("first upload request denied")
	}
	if ok, _ := l.Allow("survey", "alex@pdsb.net", cfg); !ok {
		t.Fatal("separate name was denied")
	}
	if ok, _ := l.Allow("upload-url", "jamie@pdsb.net", cfg); !ok {
		t.Fatal("separate caller was denied")
	}
	if ok, _ := l.Allow("upload-url", "alex@pdsb.net", cfg); ok {
		t.Fatal("same name and caller should be denied")
	}
}

func TestMiddlewareReturns429WithRetryAfter(t *testing.T) {
	now := time.Date(2026, 6, 7, 12, 0, 0, 0, time.UTC)
	l := testLimiter(&now)
	cfg := Config{Limit: 1, Window: time.Minute}

	hitCount := 0
	handler := l.Middleware("directory", cfg)(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		hitCount++
		w.WriteHeader(http.StatusNoContent)
	}))

	req := httptest.NewRequest(http.MethodGet, "/directory", nil)
	req.RemoteAddr = "203.0.113.10:5555"
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)
	if rec.Code != http.StatusNoContent {
		t.Fatalf("first status = %d, want 204", rec.Code)
	}

	rec = httptest.NewRecorder()
	handler.ServeHTTP(rec, req)
	if rec.Code != http.StatusTooManyRequests {
		t.Fatalf("second status = %d, want 429 (body: %s)", rec.Code, rec.Body.String())
	}
	if rec.Header().Get("Retry-After") != "60" {
		t.Fatalf("Retry-After = %q, want 60", rec.Header().Get("Retry-After"))
	}
	if hitCount != 1 {
		t.Fatalf("handler hit count = %d, want 1", hitCount)
	}

	var body struct {
		Error struct {
			Code string `json:"code"`
		} `json:"error"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode 429 body: %v", err)
	}
	if body.Error.Code != "rate_limited" {
		t.Fatalf("error code = %s, want rate_limited", body.Error.Code)
	}
}

func TestMiddlewarePrefersCallerEmailOverRemoteIP(t *testing.T) {
	now := time.Date(2026, 6, 7, 12, 0, 0, 0, time.UTC)
	l := testLimiter(&now)
	cfg := Config{Limit: 1, Window: time.Minute}

	handler := l.Middleware("survey", cfg)(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	}))

	reqA := requestWithCaller("alex@pdsb.net", "203.0.113.10:5555")
	reqB := requestWithCaller("jamie@pdsb.net", "203.0.113.10:5555")
	reqADifferentIP := requestWithCaller("alex@pdsb.net", "198.51.100.20:5555")

	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, reqA)
	if rec.Code != http.StatusNoContent {
		t.Fatalf("first status = %d, want 204", rec.Code)
	}

	rec = httptest.NewRecorder()
	handler.ServeHTTP(rec, reqB)
	if rec.Code != http.StatusNoContent {
		t.Fatalf("different caller same IP status = %d, want 204", rec.Code)
	}

	rec = httptest.NewRecorder()
	handler.ServeHTTP(rec, reqADifferentIP)
	if rec.Code != http.StatusTooManyRequests {
		t.Fatalf("same caller different IP status = %d, want 429", rec.Code)
	}
}

func TestIPMiddlewareLimitsByForwardedClientIP(t *testing.T) {
	now := time.Date(2026, 6, 7, 12, 0, 0, 0, time.UTC)
	l := testLimiter(&now)
	cfg := Config{Limit: 1, Window: time.Minute}

	hitCount := 0
	handler := l.IPMiddleware("pre-auth", cfg)(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		hitCount++
		w.WriteHeader(http.StatusNoContent)
	}))

	reqA := requestWithCaller("alex@pdsb.net", "35.191.0.1:5555")
	reqA.Header.Set("X-Forwarded-For", "203.0.113.10, 35.191.0.1")
	reqB := requestWithCaller("jamie@pdsb.net", "35.191.0.1:5555")
	reqB.Header.Set("X-Forwarded-For", "203.0.113.10, 35.191.0.1")
	reqDifferentIP := requestWithCaller("alex@pdsb.net", "35.191.0.1:5555")
	reqDifferentIP.Header.Set("X-Forwarded-For", "198.51.100.20, 35.191.0.1")

	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, reqA)
	if rec.Code != http.StatusNoContent {
		t.Fatalf("first status = %d, want 204", rec.Code)
	}

	rec = httptest.NewRecorder()
	handler.ServeHTTP(rec, reqB)
	if rec.Code != http.StatusTooManyRequests {
		t.Fatalf("same forwarded IP different caller status = %d, want 429", rec.Code)
	}

	rec = httptest.NewRecorder()
	handler.ServeHTTP(rec, reqDifferentIP)
	if rec.Code != http.StatusNoContent {
		t.Fatalf("different forwarded IP behind same RemoteAddr status = %d, want 204", rec.Code)
	}

	if hitCount != 2 {
		t.Fatalf("handler hit count = %d, want 2", hitCount)
	}
}

func requestWithCaller(email, remoteAddr string) *http.Request {
	req := httptest.NewRequest(http.MethodPost, "/survey", nil)
	req.RemoteAddr = remoteAddr
	return req.WithContext(context.WithValue(req.Context(), auth.CallerEmailKey, email))
}
