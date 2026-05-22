package auth

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"io"
	"net/http"
	"strconv"
	"time"
)

type contextKey string

const CallerEmailKey contextKey = "caller_email"

const (
	headerTimestamp = "X-Internal-Timestamp"
	headerSignature = "X-Internal-Signature"
	headerEmail     = "X-Caller-Email"

	maxClockSkew = 5 * time.Minute
)

// emptyBodySHA256 is sha256("") — used in the canonical string for GETs and
// other empty-body requests so the signer and verifier agree without hashing nil.
const emptyBodySHA256 = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"

// Verify returns a chi-compatible middleware that enforces the HMAC contract
// described in planning/API_SPEC.md §2. The skip set lists paths that bypass
// the check entirely (e.g. /health).
func Verify(secret string, skip map[string]bool) func(http.Handler) http.Handler {
	secretBytes := []byte(secret)
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if skip[r.URL.Path] {
				next.ServeHTTP(w, r)
				return
			}

			ts := r.Header.Get(headerTimestamp)
			sig := r.Header.Get(headerSignature)
			if ts == "" || sig == "" {
				writeUnauthorized(w, "missing auth headers")
				return
			}

			tsInt, err := strconv.ParseInt(ts, 10, 64)
			if err != nil {
				writeUnauthorized(w, "malformed timestamp")
				return
			}
			if drift := time.Since(time.Unix(tsInt, 0)); drift > maxClockSkew || drift < -maxClockSkew {
				writeUnauthorized(w, "timestamp out of range")
				return
			}

			body, err := io.ReadAll(r.Body)
			if err != nil {
				writeUnauthorized(w, "could not read body")
				return
			}
			r.Body = io.NopCloser(bytes.NewReader(body))

			bodyHash := emptyBodySHA256
			if len(body) > 0 {
				sum := sha256.Sum256(body)
				bodyHash = hex.EncodeToString(sum[:])
			}

			pathWithQuery := r.URL.Path
			if r.URL.RawQuery != "" {
				pathWithQuery += "?" + r.URL.RawQuery
			}
			canonical := ts + "\n" + r.Method + "\n" + pathWithQuery + "\n" + bodyHash

			mac := hmac.New(sha256.New, secretBytes)
			mac.Write([]byte(canonical))
			expected := hex.EncodeToString(mac.Sum(nil))

			if !hmac.Equal([]byte(expected), []byte(sig)) {
				writeUnauthorized(w, "signature mismatch")
				return
			}

			ctx := r.Context()
			if email := r.Header.Get(headerEmail); email != "" {
				ctx = context.WithValue(ctx, CallerEmailKey, email)
			}
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func writeUnauthorized(w http.ResponseWriter, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusUnauthorized)
	_ = json.NewEncoder(w).Encode(map[string]any{
		"error": map[string]string{
			"code":    "unauthorized",
			"message": msg,
		},
	})
}
