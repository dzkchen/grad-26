package handlers

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/dzkchen/grad-26/api/internal/auth"
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
)

const testSurveyID = "11111111-2222-3333-4444-555555555555"

type fakeAdminStore struct {
	queryRow func(sql string, args ...any) pgx.Row
}

func (s fakeAdminStore) Query(_ context.Context, _ string, _ ...any) (pgx.Rows, error) {
	return nil, fmt.Errorf("unexpected Query")
}

func (s fakeAdminStore) QueryRow(_ context.Context, sql string, args ...any) pgx.Row {
	if s.queryRow == nil {
		return fakeAdminRow{err: fmt.Errorf("unexpected QueryRow: %s", sql)}
	}
	return s.queryRow(sql, args...)
}

type fakeAdminRow struct {
	values []any
	err    error
}

func (r fakeAdminRow) Scan(dest ...any) error {
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
		case *bool:
			v, ok := value.(bool)
			if !ok {
				return fmt.Errorf("value %d is %T, want bool", i, value)
			}
			*d = v
		default:
			return fmt.Errorf("unsupported scan dest %T", dest[i])
		}
	}
	return nil
}

func requestWithSurveyID(method, target string) *http.Request {
	req := httptest.NewRequest(method, target, nil)
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("id", testSurveyID)
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))
	req = req.WithContext(context.WithValue(req.Context(), auth.CallerEmailKey, "admin@example.com"))
	return req
}

func TestAdminApproveSurveyAlreadyApprovedIsNoop(t *testing.T) {
	store := fakeAdminStore{
		queryRow: func(sql string, _ ...any) pgx.Row {
			if strings.Contains(sql, "update surveys") {
				return fakeAdminRow{err: pgx.ErrNoRows}
			}
			if strings.Contains(sql, "select exists") {
				return fakeAdminRow{values: []any{true}}
			}
			return fakeAdminRow{err: fmt.Errorf("unexpected sql: %s", sql)}
		},
	}
	handler := AdminApproveSurvey(store, func(string) bool { return true })

	rec := httptest.NewRecorder()
	handler(rec, requestWithSurveyID(http.MethodPost, "/admin/surveys/"+testSurveyID+"/approve"))

	if rec.Code != http.StatusNoContent {
		t.Fatalf("status = %d, want 204 (body: %s)", rec.Code, rec.Body.String())
	}
}

func TestAdminApproveSurveyMissingRowReturns404(t *testing.T) {
	store := fakeAdminStore{
		queryRow: func(sql string, _ ...any) pgx.Row {
			if strings.Contains(sql, "update surveys") {
				return fakeAdminRow{err: pgx.ErrNoRows}
			}
			if strings.Contains(sql, "select exists") {
				return fakeAdminRow{values: []any{false}}
			}
			return fakeAdminRow{err: fmt.Errorf("unexpected sql: %s", sql)}
		},
	}
	handler := AdminApproveSurvey(store, func(string) bool { return true })

	rec := httptest.NewRecorder()
	handler(rec, requestWithSurveyID(http.MethodPost, "/admin/surveys/"+testSurveyID+"/approve"))

	if rec.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want 404 (body: %s)", rec.Code, rec.Body.String())
	}
}

func TestAdminUnapproveSurveyReturns204(t *testing.T) {
	store := fakeAdminStore{
		queryRow: func(sql string, _ ...any) pgx.Row {
			if strings.Contains(sql, "update surveys") {
				return fakeAdminRow{values: []any{testSurveyID}}
			}
			return fakeAdminRow{err: fmt.Errorf("unexpected sql: %s", sql)}
		},
	}
	handler := AdminUnapproveSurvey(store, func(string) bool { return true })

	rec := httptest.NewRecorder()
	handler(rec, requestWithSurveyID(http.MethodPost, "/admin/surveys/"+testSurveyID+"/unapprove"))

	if rec.Code != http.StatusNoContent {
		t.Fatalf("status = %d, want 204 (body: %s)", rec.Code, rec.Body.String())
	}
}

func TestAdminApproveRejectsNonAdminWithValidHMAC(t *testing.T) {
	const secret = "test-secret"
	path := "/admin/surveys/" + testSurveyID + "/approve"

	r := chi.NewRouter()
	r.Use(auth.Verify(secret, map[string]bool{}))
	r.Post("/admin/surveys/{id}/approve", AdminApproveSurvey(fakeAdminStore{}, func(string) bool {
		return false
	}))

	req := httptest.NewRequest(http.MethodPost, path, nil)
	req.Header.Set("X-Caller-Email", "student@pdsb.net")
	signTestRequest(req, secret)
	rec := httptest.NewRecorder()

	r.ServeHTTP(rec, req)

	if rec.Code != http.StatusForbidden {
		t.Fatalf("status = %d, want 403 (body: %s)", rec.Code, rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), "forbidden") {
		t.Fatalf("body should mention forbidden: %s", rec.Body.String())
	}
}

func signTestRequest(req *http.Request, secret string) {
	ts := fmt.Sprintf("%d", time.Now().Unix())
	canonical := ts + "\n" + req.Method + "\n" + req.URL.RequestURI() + "\n" +
		"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(canonical))
	req.Header.Set("X-Internal-Timestamp", ts)
	req.Header.Set("X-Internal-Signature", hex.EncodeToString(mac.Sum(nil)))
}
