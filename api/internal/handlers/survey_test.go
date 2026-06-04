package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/dzkchen/grad-26/api/internal/auth"
	"github.com/jackc/pgx/v5"
)

const (
	testUserID   = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
	testPhotoKey = "surveys/11111111-2222-3333-4444-555555555555.jpg"
)

type fakeSurveyStore struct {
	insertCalled bool
}

func (s *fakeSurveyStore) QueryRow(_ context.Context, sql string, _ ...any) pgx.Row {
	if strings.Contains(sql, "select email from users") {
		return fakeSurveyRow{values: []any{"student@example.com"}}
	}
	if strings.Contains(sql, "insert into surveys") {
		s.insertCalled = true
	}
	return fakeSurveyRow{err: fmt.Errorf("unexpected QueryRow: %s", sql)}
}

type fakeSurveyRow struct {
	values []any
	err    error
}

func (r fakeSurveyRow) Scan(dest ...any) error {
	if r.err != nil {
		return r.err
	}
	if len(dest) != len(r.values) {
		return fmt.Errorf("scan got %d dests, want %d", len(dest), len(r.values))
	}
	for i, value := range r.values {
		switch d := dest[i].(type) {
		case *string:
			v, ok := value.(string)
			if !ok {
				return fmt.Errorf("value %d is %T, want string", i, value)
			}
			*d = v
		default:
			return fmt.Errorf("unsupported scan dest %T", dest[i])
		}
	}
	return nil
}

type fakeSurveyObjects struct {
	size       int64
	headErr    error
	deleteErr  error
	deletedKey string
}

func (o *fakeSurveyObjects) HeadObject(_ context.Context, _ string) (int64, error) {
	if o.headErr != nil {
		return 0, o.headErr
	}
	return o.size, nil
}

func (o *fakeSurveyObjects) DeleteObject(_ context.Context, key string) error {
	o.deletedKey = key
	return o.deleteErr
}

func TestCreateSurveyDeletesOversizedUpload(t *testing.T) {
	store := &fakeSurveyStore{}
	objects := &fakeSurveyObjects{size: maxUploadBytes + 1}
	handler := CreateSurvey(store, objects)

	rec := httptest.NewRecorder()
	handler(rec, newCreateSurveyRequest(t))

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400 (body: %s)", rec.Code, rec.Body.String())
	}
	if objects.deletedKey != testPhotoKey {
		t.Fatalf("deleted key = %q, want %q", objects.deletedKey, testPhotoKey)
	}
	if store.insertCalled {
		t.Fatal("insert should not be called for an oversized upload")
	}
	assertErrorCode(t, rec, "invalid_photo")
}

func TestCreateSurveyReportsCleanupFailureForOversizedUpload(t *testing.T) {
	store := &fakeSurveyStore{}
	objects := &fakeSurveyObjects{
		size:      maxUploadBytes + 1,
		deleteErr: fmt.Errorf("delete failed"),
	}
	handler := CreateSurvey(store, objects)

	rec := httptest.NewRecorder()
	handler(rec, newCreateSurveyRequest(t))

	if rec.Code != http.StatusInternalServerError {
		t.Fatalf("status = %d, want 500 (body: %s)", rec.Code, rec.Body.String())
	}
	if objects.deletedKey != testPhotoKey {
		t.Fatalf("deleted key = %q, want %q", objects.deletedKey, testPhotoKey)
	}
	if store.insertCalled {
		t.Fatal("insert should not be called when oversized cleanup fails")
	}
	assertErrorCode(t, rec, "internal_error")
}

func newCreateSurveyRequest(t *testing.T) *http.Request {
	t.Helper()
	body := fmt.Sprintf(`{
		"user_id": %q,
		"display_name": "Test Student",
		"photo_key": %q,
		"linkedin": "",
		"answers": {}
	}`, testUserID, testPhotoKey)
	req := httptest.NewRequest(http.MethodPost, "/survey", strings.NewReader(body))
	return req.WithContext(context.WithValue(req.Context(), auth.CallerEmailKey, "student@example.com"))
}

func assertErrorCode(t *testing.T, rec *httptest.ResponseRecorder, want string) {
	t.Helper()
	var env struct {
		Error struct {
			Code string `json:"code"`
		} `json:"error"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &env); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if env.Error.Code != want {
		t.Fatalf("error code = %s, want %s", env.Error.Code, want)
	}
}
