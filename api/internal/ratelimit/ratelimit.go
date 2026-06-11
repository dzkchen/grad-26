package ratelimit

import (
	"encoding/json"
	"net"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/dzkchen/grad-26/api/internal/auth"
)

type Config struct {
	Limit  int
	Window time.Duration
}

type Limiter struct {
	mu          sync.Mutex
	entries     map[string]entry
	now         func() time.Time
	nextPruneAt time.Time
}

type entry struct {
	count   int
	resetAt time.Time
}

const pruneInterval = time.Minute

func New() *Limiter {
	now := time.Now
	return &Limiter{
		entries:     make(map[string]entry),
		now:         now,
		nextPruneAt: now().Add(pruneInterval),
	}
}

func (l *Limiter) Middleware(name string, cfg Config) func(http.Handler) http.Handler {
	return l.middleware(name, cfg, callerKey)
}

func (l *Limiter) IPMiddleware(name string, cfg Config) func(http.Handler) http.Handler {
	return l.middleware(name, cfg, ipKey)
}

func (l *Limiter) middleware(name string, cfg Config, key func(*http.Request) string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			allowed, retryAfter := l.Allow(name, key(r), cfg)
			if allowed {
				next.ServeHTTP(w, r)
				return
			}

			w.Header().Set("Content-Type", "application/json")
			w.Header().Set("Retry-After", strconv.Itoa(retryAfterSeconds(retryAfter)))
			w.WriteHeader(http.StatusTooManyRequests)
			_ = json.NewEncoder(w).Encode(map[string]any{
				"error": map[string]string{
					"code":    "rate_limited",
					"message": "too many requests",
				},
			})
		})
	}
}

func (l *Limiter) Allow(name, key string, cfg Config) (allowed bool, retryAfter time.Duration) {
	if cfg.Limit < 1 {
		return false, time.Second
	}
	if cfg.Window <= 0 {
		return false, time.Second
	}

	current := l.now()

	l.mu.Lock()
	defer l.mu.Unlock()

	l.pruneExpired(current)

	compositeKey := normalizePart(name) + "\x00" + normalizePart(key)
	e, ok := l.entries[compositeKey]
	if !ok || !current.Before(e.resetAt) {
		l.entries[compositeKey] = entry{
			count:   1,
			resetAt: current.Add(cfg.Window),
		}
		return true, 0
	}

	if e.count >= cfg.Limit {
		return false, e.resetAt.Sub(current)
	}

	e.count++
	l.entries[compositeKey] = e
	return true, 0
}

func (l *Limiter) pruneExpired(current time.Time) {
	if current.Before(l.nextPruneAt) {
		return
	}
	for key, e := range l.entries {
		if !current.Before(e.resetAt) {
			delete(l.entries, key)
		}
	}
	l.nextPruneAt = current.Add(pruneInterval)
}

func callerKey(r *http.Request) string {
	if email, _ := r.Context().Value(auth.CallerEmailKey).(string); strings.TrimSpace(email) != "" {
		return email
	}
	return ipKey(r)
}

func ipKey(r *http.Request) string {
	if forwardedFor := firstForwardedFor(r.Header.Get("X-Forwarded-For")); forwardedFor != "" {
		return forwardedFor
	}
	if realIP := strings.TrimSpace(r.Header.Get("X-Real-IP")); realIP != "" {
		return remoteIP(realIP)
	}
	return remoteIP(r.RemoteAddr)
}

func firstForwardedFor(value string) string {
	for part := range strings.SplitSeq(value, ",") {
		if ip := strings.TrimSpace(part); ip != "" {
			return remoteIP(ip)
		}
	}
	return ""
}

func remoteIP(remoteAddr string) string {
	remoteAddr = strings.TrimSpace(remoteAddr)
	if remoteAddr == "" {
		return "unknown"
	}

	host, _, err := net.SplitHostPort(remoteAddr)
	if err == nil && strings.TrimSpace(host) != "" {
		return host
	}
	return remoteAddr
}

func normalizePart(value string) string {
	normalized := strings.ToLower(strings.TrimSpace(value))
	if normalized == "" {
		return "unknown"
	}
	return normalized
}

func retryAfterSeconds(d time.Duration) int {
	if d <= 0 {
		return 1
	}
	return max(1, int((d+time.Second-1)/time.Second))
}
