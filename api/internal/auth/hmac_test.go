package auth

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"io"
	"net/http"
	"net/http/httptest"
	"strconv"
	"strings"
	"testing"
	"time"
)

const testSecret = "test-secret-do-not-use-in-prod"

func sign(t *testing.T, secret, ts, method, pathWithQuery, body string) string {
	t.Helper()
	bodyHash := emptyBodySHA256
	if body != "" {
		sum := sha256.Sum256([]byte(body))
		bodyHash = hex.EncodeToString(sum[:])
	}
	canonical := ts + "\n" + method + "\n" + pathWithQuery + "\n" + bodyHash
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(canonical))
	return hex.EncodeToString(mac.Sum(nil))
}

func TestVerify(t *testing.T) {
	now := strconv.FormatInt(time.Now().Unix(), 10)
	old := strconv.FormatInt(time.Now().Add(-10*time.Minute).Unix(), 10)
	validBody := `{"hello":"world"}`
	validSig := sign(t, testSecret, now, "POST", "/survey", validBody)

	tests := []struct {
		name       string
		method     string
		path       string
		body       string
		headers    map[string]string
		wantStatus int
		wantEmail  string
	}{
		{
			name:       "valid signature passes",
			method:     "POST",
			path:       "/survey",
			body:       validBody,
			headers:    map[string]string{headerTimestamp: now, headerSignature: validSig, headerEmail: "alex@pdsb.net"},
			wantStatus: http.StatusOK,
			wantEmail:  "alex@pdsb.net",
		},
		{
			name:       "missing both headers returns 401",
			method:     "GET",
			path:       "/directory",
			headers:    map[string]string{},
			wantStatus: http.StatusUnauthorized,
		},
		{
			name:       "missing signature returns 401",
			method:     "GET",
			path:       "/directory",
			headers:    map[string]string{headerTimestamp: now},
			wantStatus: http.StatusUnauthorized,
		},
		{
			name:       "expired timestamp returns 401",
			method:     "POST",
			path:       "/survey",
			body:       validBody,
			headers:    map[string]string{headerTimestamp: old, headerSignature: sign(t, testSecret, old, "POST", "/survey", validBody)},
			wantStatus: http.StatusUnauthorized,
		},
		{
			name:       "malformed timestamp returns 401",
			method:     "GET",
			path:       "/directory",
			headers:    map[string]string{headerTimestamp: "not-a-number", headerSignature: "deadbeef"},
			wantStatus: http.StatusUnauthorized,
		},
		{
			name:       "wrong signature returns 401",
			method:     "POST",
			path:       "/survey",
			body:       validBody,
			headers:    map[string]string{headerTimestamp: now, headerSignature: strings.Repeat("0", 64)},
			wantStatus: http.StatusUnauthorized,
		},
		{
			name:       "health skips check even without headers",
			method:     "GET",
			path:       "/health",
			headers:    map[string]string{},
			wantStatus: http.StatusOK,
		},
	}

	gotEmail := ""
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if v, ok := r.Context().Value(CallerEmailKey).(string); ok {
			gotEmail = v
		}
		w.WriteHeader(http.StatusOK)
	})
	mw := Verify(testSecret, map[string]bool{"/health": true})(handler)

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			gotEmail = ""
			var body io.Reader
			if tc.body != "" {
				body = strings.NewReader(tc.body)
			}
			req := httptest.NewRequest(tc.method, tc.path, body)
			for k, v := range tc.headers {
				req.Header.Set(k, v)
			}
			rec := httptest.NewRecorder()
			mw.ServeHTTP(rec, req)
			if rec.Code != tc.wantStatus {
				t.Fatalf("status = %d, want %d (body: %s)", rec.Code, tc.wantStatus, rec.Body.String())
			}
			if tc.wantEmail != "" && gotEmail != tc.wantEmail {
				t.Fatalf("caller email = %q, want %q", gotEmail, tc.wantEmail)
			}
		})
	}
}
