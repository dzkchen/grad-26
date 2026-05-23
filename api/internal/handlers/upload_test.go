package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

type fakePresigner struct {
	gotKey         string
	gotContentType string
	gotLength      int64
	gotTTL         time.Duration
	url            string
	err            error
}

func (f *fakePresigner) PresignPut(_ context.Context, key, contentType string, length int64, ttl time.Duration) (string, error) {
	f.gotKey = key
	f.gotContentType = contentType
	f.gotLength = length
	f.gotTTL = ttl
	if f.err != nil {
		return "", f.err
	}
	return f.url, nil
}

func TestUploadURL_HappyPath(t *testing.T) {
	fp := &fakePresigner{url: "https://example.r2.cloudflarestorage.com/grad26-photos/surveys/abc.jpg?signed=1"}
	h := uploadURLHandler(fp)

	body := `{"content_type":"image/jpeg","content_length":2048576}`
	req := httptest.NewRequest("POST", "/upload/url", strings.NewReader(body))
	rec := httptest.NewRecorder()
	h(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d (body: %s)", rec.Code, rec.Body.String())
	}

	var resp uploadURLResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if resp.URL != fp.url {
		t.Fatalf("url = %s, want %s", resp.URL, fp.url)
	}
	if !strings.HasPrefix(resp.Key, "surveys/") || !strings.HasSuffix(resp.Key, ".jpg") {
		t.Fatalf("key = %s; want surveys/<uuid>.jpg", resp.Key)
	}
	if fp.gotKey != resp.Key {
		t.Fatalf("presigner saw key %s, response had %s", fp.gotKey, resp.Key)
	}
	if fp.gotContentType != "image/jpeg" {
		t.Fatalf("presigner content-type = %s", fp.gotContentType)
	}
	if fp.gotLength != 2048576 {
		t.Fatalf("presigner length = %d", fp.gotLength)
	}
	if fp.gotTTL != signedURLTTL {
		t.Fatalf("ttl = %s, want %s", fp.gotTTL, signedURLTTL)
	}
	if _, err := time.Parse(time.RFC3339, resp.ExpiresAt); err != nil {
		t.Fatalf("expires_at not RFC3339: %v", err)
	}
}

func TestUploadURL_KeyExtensionMatchesContentType(t *testing.T) {
	cases := map[string]string{
		"image/jpeg": ".jpg",
		"image/png":  ".png",
		"image/webp": ".webp",
	}
	for ct, ext := range cases {
		t.Run(ct, func(t *testing.T) {
			fp := &fakePresigner{url: "https://x/y"}
			h := uploadURLHandler(fp)
			body, _ := json.Marshal(map[string]any{"content_type": ct, "content_length": 1024})
			req := httptest.NewRequest("POST", "/upload/url", strings.NewReader(string(body)))
			rec := httptest.NewRecorder()
			h(rec, req)
			if rec.Code != http.StatusOK {
				t.Fatalf("status = %d (body: %s)", rec.Code, rec.Body.String())
			}
			var resp uploadURLResponse
			_ = json.Unmarshal(rec.Body.Bytes(), &resp)
			if !strings.HasSuffix(resp.Key, ext) {
				t.Fatalf("key %s does not end in %s", resp.Key, ext)
			}
		})
	}
}

func TestUploadURL_Validation(t *testing.T) {
	tests := []struct {
		name     string
		body     string
		wantCode string
	}{
		{"bad content type", `{"content_type":"image/gif","content_length":1024}`, "invalid_content_type"},
		{"zero length", `{"content_type":"image/jpeg","content_length":0}`, "invalid_size"},
		{"negative length", `{"content_type":"image/jpeg","content_length":-5}`, "invalid_size"},
		{"too large", `{"content_type":"image/jpeg","content_length":5242881}`, "invalid_size"},
		{"malformed json", `{"content_type":`, "invalid_request"},
		{"unknown field", `{"content_type":"image/jpeg","content_length":1024,"extra":true}`, "invalid_request"},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			fp := &fakePresigner{url: "unused"}
			h := uploadURLHandler(fp)
			req := httptest.NewRequest("POST", "/upload/url", strings.NewReader(tc.body))
			rec := httptest.NewRecorder()
			h(rec, req)
			if rec.Code != http.StatusBadRequest {
				t.Fatalf("status = %d, want 400 (body: %s)", rec.Code, rec.Body.String())
			}
			var env struct {
				Error struct {
					Code string `json:"code"`
				} `json:"error"`
			}
			_ = json.Unmarshal(rec.Body.Bytes(), &env)
			if env.Error.Code != tc.wantCode {
				t.Fatalf("error code = %s, want %s", env.Error.Code, tc.wantCode)
			}
		})
	}
}
