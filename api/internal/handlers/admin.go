package handlers

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"strconv"
	"time"

	"github.com/dzkchen/grad-26/api/internal/auth"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

// adminStore is the pgx surface the admin handlers need.
type adminStore interface {
	Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error)
	QueryRow(ctx context.Context, sql string, args ...any) pgx.Row
}

// objectDeleter is the R2 surface the admin delete handler needs.
type objectDeleter interface {
	DeleteObject(ctx context.Context, key string) error
}

type adminSurvey struct {
	ID              string          `json:"id"`
	UserEmail       string          `json:"user_email"`
	DisplayName     string          `json:"display_name"`
	PhotoURL        string          `json:"photo_url"`
	InstagramHandle string          `json:"instagram_handle,omitempty"`
	Linkedin        string          `json:"linkedin,omitempty"`
	HideSocials     bool            `json:"hide_socials"`
	Answers         json.RawMessage `json:"answers"`
	SubmittedAt     time.Time       `json:"submitted_at"`
	ApprovedAt      *time.Time      `json:"approved_at"`
}

type adminListResponse struct {
	Surveys []adminSurvey `json:"surveys"`
	Total   int           `json:"total"`
}

const adminDefaultLimit = 25
const adminMaxLimit = 100

// AdminListSurveys implements GET /admin/surveys per planning/API_SPEC.md §4.6.
// Accepts optional ?limit=N&offset=N query params for pagination (default 25 per page).
func AdminListSurveys(store adminStore, publicHost string, isAdmin auth.IsAdmin) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !requireAdminEmail(w, r, isAdmin) {
			return
		}

		limit := adminDefaultLimit
		if l, err := strconv.Atoi(r.URL.Query().Get("limit")); err == nil && l > 0 {
			if l > adminMaxLimit {
				l = adminMaxLimit
			}
			limit = l
		}
		offset := 0
		if o, err := strconv.Atoi(r.URL.Query().Get("offset")); err == nil && o >= 0 {
			offset = o
		}

		var total int
		if err := store.QueryRow(r.Context(), `select count(*) from surveys`).Scan(&total); err != nil {
			writeError(w, http.StatusInternalServerError, "internal_error", "could not count surveys")
			return
		}

		rows, err := store.Query(
			r.Context(),
			`select
				s.id::text,
				u.email,
				s.display_name,
				s.photo_object_key,
				s.instagram_handle,
				s.linkedin,
				s.hide_socials,
				s.answers,
				s.submitted_at,
				s.approved_at
			from surveys s
			join users u on u.id = s.user_id
			order by (s.approved_at is not null), s.submitted_at desc, s.id desc
			limit $1 offset $2`,
			limit, offset,
		)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "internal_error", "could not list surveys")
			return
		}
		defer rows.Close()

		surveys := make([]adminSurvey, 0)
		for rows.Next() {
			var (
				row       adminSurvey
				photoKey  string
				instagram pgtype.Text
				linkedin  sql.NullString
				answers   []byte
				approved  pgtype.Timestamptz
			)
			if err := rows.Scan(
				&row.ID,
				&row.UserEmail,
				&row.DisplayName,
				&photoKey,
				&instagram,
				&linkedin,
				&row.HideSocials,
				&answers,
				&row.SubmittedAt,
				&approved,
			); err != nil {
				writeError(w, http.StatusInternalServerError, "internal_error", "could not scan survey row")
				return
			}
			row.PhotoURL = photoURL(publicHost, photoKey)
			if instagram.Valid {
				row.InstagramHandle = instagram.String
			}
			if linkedin.Valid {
				row.Linkedin = linkedin.String
			}
			if len(answers) == 0 {
				answers = []byte(`{}`)
			}
			row.Answers = json.RawMessage(answers)
			if approved.Valid {
				t := approved.Time
				row.ApprovedAt = &t
			}
			surveys = append(surveys, row)
		}
		if err := rows.Err(); err != nil {
			writeError(w, http.StatusInternalServerError, "internal_error", "could not iterate surveys")
			return
		}

		writeJSON(w, http.StatusOK, adminListResponse{Surveys: surveys, Total: total})
	}
}

// AdminApproveSurvey implements POST /admin/surveys/{id}/approve per
// planning/API_SPEC.md §4.8. It preserves an existing approved_at timestamp
// when the row is already approved.
func AdminApproveSurvey(store adminStore, isAdmin auth.IsAdmin) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !requireAdminEmail(w, r, isAdmin) {
			return
		}

		id, err := uuid.Parse(chi.URLParam(r, "id"))
		if err != nil {
			writeError(w, http.StatusBadRequest, "invalid_request", "id must be a uuid")
			return
		}

		var updatedID string
		err = store.QueryRow(
			r.Context(),
			`update surveys
			set approved_at = now()
			where id=$1 and approved_at is null
			returning id::text`,
			id.String(),
		).Scan(&updatedID)
		if err == nil {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		if !errors.Is(err, pgx.ErrNoRows) {
			writeError(w, http.StatusInternalServerError, "internal_error", "could not approve survey")
			return
		}

		exists, err := surveyExists(r.Context(), store, id.String())
		if err != nil {
			writeError(w, http.StatusInternalServerError, "internal_error", "could not check survey")
			return
		}
		if !exists {
			writeError(w, http.StatusNotFound, "not_found", "survey not found")
			return
		}

		w.WriteHeader(http.StatusNoContent)
	}
}

// AdminUnapproveSurvey implements POST /admin/surveys/{id}/unapprove per
// planning/API_SPEC.md §4.9.
func AdminUnapproveSurvey(store adminStore, isAdmin auth.IsAdmin) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !requireAdminEmail(w, r, isAdmin) {
			return
		}

		id, err := uuid.Parse(chi.URLParam(r, "id"))
		if err != nil {
			writeError(w, http.StatusBadRequest, "invalid_request", "id must be a uuid")
			return
		}

		var updatedID string
		err = store.QueryRow(
			r.Context(),
			`update surveys
			set approved_at = null
			where id=$1
			returning id::text`,
			id.String(),
		).Scan(&updatedID)
		if errors.Is(err, pgx.ErrNoRows) {
			writeError(w, http.StatusNotFound, "not_found", "survey not found")
			return
		}
		if err != nil {
			writeError(w, http.StatusInternalServerError, "internal_error", "could not unapprove survey")
			return
		}

		w.WriteHeader(http.StatusNoContent)
	}
}

func surveyExists(ctx context.Context, store adminStore, id string) (bool, error) {
	var exists bool
	err := store.QueryRow(ctx, `select exists(select 1 from surveys where id=$1)`, id).Scan(&exists)
	return exists, err
}

// AdminDeleteSurvey implements DELETE /admin/surveys/{id} per planning/API_SPEC.md §4.7.
// DB is the source of truth: if the R2 delete fails we log and still return 204
// — orphaned R2 objects can be reaped later.
func AdminDeleteSurvey(store adminStore, objects objectDeleter, isAdmin auth.IsAdmin) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !requireAdminEmail(w, r, isAdmin) {
			return
		}

		id, err := uuid.Parse(chi.URLParam(r, "id"))
		if err != nil {
			writeError(w, http.StatusBadRequest, "invalid_request", "id must be a uuid")
			return
		}

		var photoKey string
		err = store.QueryRow(
			r.Context(),
			`delete from surveys where id=$1 returning photo_object_key`,
			id.String(),
		).Scan(&photoKey)
		if errors.Is(err, pgx.ErrNoRows) {
			writeError(w, http.StatusNotFound, "not_found", "survey not found")
			return
		}
		if err != nil {
			writeError(w, http.StatusInternalServerError, "internal_error", "could not delete survey")
			return
		}

		if photoKey != "" {
			if err := objects.DeleteObject(r.Context(), photoKey); err != nil {
				slog.Warn("admin delete: r2 delete failed; db row already removed",
					"survey_id", id.String(),
					"photo_key", photoKey,
					"err", err,
				)
			}
		}

		w.WriteHeader(http.StatusNoContent)
	}
}

// requireAdminEmail enforces the §9 defense-in-depth check: even with a valid
// HMAC, only allowlisted admin emails reach /admin/*.
func requireAdminEmail(w http.ResponseWriter, r *http.Request, isAdmin auth.IsAdmin) bool {
	email := callerEmail(r)
	if email == "" {
		writeError(w, http.StatusUnauthorized, "unauthorized", "missing caller email")
		return false
	}
	if !isAdmin(email) {
		writeError(w, http.StatusForbidden, "forbidden", "admin access required")
		return false
	}
	return true
}
