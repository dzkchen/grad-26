package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/dzkchen/grad-26/api/internal/r2"
	"github.com/google/uuid"
)

// presigner is the subset of *r2.Client that this handler needs. Lets the test
// substitute a fake without spinning up a real S3 client.
type presigner interface {
	PresignPut(ctx context.Context, key, contentType string, contentLength int64, ttl time.Duration) (string, error)
}

const (
	maxUploadBytes = 5 * 1024 * 1024
	signedURLTTL   = 15 * time.Minute
)

var allowedContentTypes = map[string]string{
	"image/jpeg": "jpg",
	"image/png":  "png",
	"image/webp": "webp",
}

type uploadURLRequest struct {
	ContentType   string `json:"content_type"`
	ContentLength int64  `json:"content_length"`
}

type uploadURLResponse struct {
	URL       string `json:"url"`
	Key       string `json:"key"`
	ExpiresAt string `json:"expires_at"`
}

// UploadURL implements POST /upload/url per planning/API_SPEC.md §4.2.
// HMAC + X-Caller-Email enforcement is handled by the auth.Verify middleware.
func UploadURL(client *r2.Client) http.HandlerFunc {
	return uploadURLHandler(client)
}

func uploadURLHandler(p presigner) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req uploadURLRequest
		dec := json.NewDecoder(r.Body)
		dec.DisallowUnknownFields()
		if err := dec.Decode(&req); err != nil {
			writeError(w, http.StatusBadRequest, "invalid_request", "malformed JSON body")
			return
		}

		ext, ok := allowedContentTypes[req.ContentType]
		if !ok {
			writeError(w, http.StatusBadRequest, "invalid_content_type", "content_type must be image/jpeg, image/png, or image/webp")
			return
		}
		if req.ContentLength < 1 || req.ContentLength > maxUploadBytes {
			writeError(w, http.StatusBadRequest, "invalid_size", "content_length must be between 1 and 5242880 bytes")
			return
		}

		id, err := newSurveyID()
		if err != nil {
			writeError(w, http.StatusInternalServerError, "internal_error", "could not generate id")
			return
		}
		key := "surveys/" + id + "." + ext

		expiresAt := time.Now().Add(signedURLTTL).UTC()
		url, err := p.PresignPut(r.Context(), key, req.ContentType, req.ContentLength, signedURLTTL)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "internal_error", "could not sign upload url")
			return
		}

		writeJSON(w, http.StatusOK, uploadURLResponse{
			URL:       url,
			Key:       key,
			ExpiresAt: expiresAt.Format(time.RFC3339),
		})
	}
}

// newSurveyID prefers UUID v7 (time-ordered, better DB index locality) and falls
// back to v4 if the v7 source fails.
func newSurveyID() (string, error) {
	if id, err := uuid.NewV7(); err == nil {
		return id.String(), nil
	}
	id, err := uuid.NewRandom()
	if err != nil {
		return "", err
	}
	return id.String(), nil
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}

func writeError(w http.ResponseWriter, status int, code, message string) {
	writeJSON(w, status, map[string]any{
		"error": map[string]string{"code": code, "message": message},
	})
}
