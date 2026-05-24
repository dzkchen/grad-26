package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"regexp"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/dzkchen/grad-26/api/internal/auth"
	"github.com/dzkchen/grad-26/api/internal/questions"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"
)

type surveyStore interface {
	QueryRow(ctx context.Context, sql string, args ...any) pgx.Row
}

type objectHeader interface {
	HeadObject(ctx context.Context, key string) (int64, error)
}

type createSurveyRequest struct {
	UserID          string         `json:"user_id"`
	DisplayName     string         `json:"display_name"`
	PhotoKey        string         `json:"photo_key"`
	InstagramHandle *string        `json:"instagram_handle"`
	HideSocials     bool           `json:"hide_socials"`
	Answers         map[string]any `json:"answers"`
}

type createSurveyResponse struct {
	ID          string    `json:"id"`
	SubmittedAt time.Time `json:"submitted_at"`
}

type meSurveyResponse struct {
	Submitted bool           `json:"submitted"`
	ID        string         `json:"id,omitempty"`
	Entry     *meSurveyEntry `json:"entry,omitempty"`
}

type meSurveyEntry struct {
	DisplayName     string          `json:"display_name"`
	PhotoKey        string          `json:"photo_key"`
	InstagramHandle *string         `json:"instagram_handle"`
	HideSocials     bool            `json:"hide_socials"`
	Answers         json.RawMessage `json:"answers"`
	SubmittedAt     time.Time       `json:"submitted_at"`
}

var surveyPhotoKeyRE = regexp.MustCompile(`^surveys/([0-9a-f-]+)\.(jpg|jpeg|png|webp)$`)

func CreateSurvey(store surveyStore, objects objectHeader) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		callerEmail := callerEmail(r)
		if callerEmail == "" {
			writeError(w, http.StatusUnauthorized, "unauthorized", "missing caller email")
			return
		}

		var req createSurveyRequest
		dec := json.NewDecoder(r.Body)
		dec.DisallowUnknownFields()
		if err := dec.Decode(&req); err != nil {
			writeError(w, http.StatusBadRequest, "invalid_request", "malformed JSON body")
			return
		}

		validated, ok := validateCreateSurveyRequest(w, req)
		if !ok {
			return
		}

		matches := surveyPhotoKeyRE.FindStringSubmatch(validated.photoKey)
		if matches == nil {
			writeError(w, http.StatusBadRequest, "invalid_photo", "photo_key must be surveys/<uuid>.<jpg|jpeg|png|webp>")
			return
		}

		surveyID, err := uuid.Parse(matches[1])
		if err != nil {
			writeError(w, http.StatusBadRequest, "invalid_photo", "photo_key must contain a valid uuid")
			return
		}

		userID, err := uuid.Parse(validated.userID)
		if err != nil {
			writeError(w, http.StatusBadRequest, "invalid_request", "user_id must be a uuid")
			return
		}

		allowed, err := userEmailMatches(r.Context(), store, userID.String(), callerEmail)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "internal_error", "could not verify user")
			return
		}
		if !allowed {
			writeError(w, http.StatusForbidden, "forbidden", "caller email does not match user_id")
			return
		}

		size, err := objects.HeadObject(r.Context(), validated.photoKey)
		if err != nil {
			writeError(w, http.StatusBadRequest, "invalid_photo", "uploaded photo was not found")
			return
		}
		if size < 1 || size > maxUploadBytes {
			writeError(w, http.StatusBadRequest, "invalid_photo", "uploaded photo must be between 1 byte and 5 MB")
			return
		}

		if err := questions.ValidateAnswers(validated.answers); err != nil {
			writeError(w, http.StatusBadRequest, "invalid_request", "answers: "+err.Error())
			return
		}

		answersJSON, err := json.Marshal(validated.answers)
		if err != nil {
			writeError(w, http.StatusBadRequest, "invalid_request", "answers must be JSON")
			return
		}

		resp, err := insertSurvey(
			r.Context(),
			store,
			surveyID.String(),
			userID.String(),
			validated,
			string(answersJSON),
		)
		if err != nil {
			var pgErr *pgconn.PgError
			if errors.As(err, &pgErr) && pgErr.Code == "23505" {
				writeError(w, http.StatusConflict, "conflict", "Survey already submitted for this user.")
				return
			}
			writeError(w, http.StatusInternalServerError, "internal_error", "could not insert survey")
			return
		}

		writeJSON(w, http.StatusCreated, resp)
	}
}

func insertSurvey(ctx context.Context, store surveyStore, surveyID string, userID string, req validatedSurveyRequest, answersJSON string) (createSurveyResponse, error) {
	var resp createSurveyResponse
	err := store.QueryRow(
		ctx,
		`insert into surveys (
			id,
			user_id,
			display_name,
			photo_object_key,
			instagram_handle,
			hide_socials,
			answers
		) values ($1, $2, $3, $4, $5, $6, $7::jsonb)
		returning id::text, submitted_at`,
		surveyID,
		userID,
		req.displayName,
		req.photoKey,
		nullableString(req.instagramHandle),
		req.hideSocials,
		answersJSON,
	).Scan(&resp.ID, &resp.SubmittedAt)
	if err == nil {
		return resp, nil
	}

	var pgErr *pgconn.PgError
	if !errors.As(err, &pgErr) || pgErr.Code != "23502" || pgErr.ColumnName != "post_secondary" {
		return createSurveyResponse{}, err
	}

	// Compatibility while production DBs apply 0002_simplify_survey_profile.sql.
	// Old schemas still require post_secondary even though the field has been
	// removed from the survey UI and API payload.
	err = store.QueryRow(
		ctx,
		`insert into surveys (
			id,
			user_id,
			display_name,
			photo_object_key,
			instagram_handle,
			post_secondary,
			hide_socials,
			hide_post_secondary,
			answers
		) values ($1, $2, $3, $4, $5, $6, $7, true, $8::jsonb)
		returning id::text, submitted_at`,
		surveyID,
		userID,
		req.displayName,
		req.photoKey,
		nullableString(req.instagramHandle),
		"Not provided",
		req.hideSocials,
		answersJSON,
	).Scan(&resp.ID, &resp.SubmittedAt)
	if err != nil {
		return createSurveyResponse{}, err
	}

	return resp, nil
}

func MeSurvey(store surveyStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		callerEmail := callerEmail(r)
		if callerEmail == "" {
			writeError(w, http.StatusUnauthorized, "unauthorized", "missing caller email")
			return
		}

		userID, err := uuid.Parse(r.URL.Query().Get("user_id"))
		if err != nil {
			writeError(w, http.StatusBadRequest, "invalid_request", "user_id must be a uuid")
			return
		}

		allowed, err := userEmailMatches(r.Context(), store, userID.String(), callerEmail)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "internal_error", "could not verify user")
			return
		}
		if !allowed {
			writeError(w, http.StatusForbidden, "forbidden", "caller email does not match user_id")
			return
		}

		entry, id, err := surveyByUserID(r.Context(), store, userID.String())
		if errors.Is(err, pgx.ErrNoRows) {
			writeJSON(w, http.StatusOK, meSurveyResponse{Submitted: false})
			return
		}
		if err != nil {
			writeError(w, http.StatusInternalServerError, "internal_error", "could not fetch survey")
			return
		}

		writeJSON(w, http.StatusOK, meSurveyResponse{
			Submitted: true,
			ID:        id,
			Entry:     entry,
		})
	}
}

type validatedSurveyRequest struct {
	userID          string
	displayName     string
	photoKey        string
	instagramHandle *string
	hideSocials     bool
	answers         map[string]any
}

func validateCreateSurveyRequest(w http.ResponseWriter, req createSurveyRequest) (validatedSurveyRequest, bool) {
	displayName := strings.TrimSpace(req.DisplayName)
	if runeLen(displayName) < 1 || runeLen(displayName) > 80 {
		writeError(w, http.StatusBadRequest, "invalid_request", "display_name must be 1..80 characters")
		return validatedSurveyRequest{}, false
	}

	instagram, ok := normalizeHandle(w, req.InstagramHandle, "instagram_handle")
	if !ok {
		return validatedSurveyRequest{}, false
	}

	if req.Answers == nil {
		writeError(w, http.StatusBadRequest, "invalid_request", "answers is required")
		return validatedSurveyRequest{}, false
	}

	return validatedSurveyRequest{
		userID:          strings.TrimSpace(req.UserID),
		displayName:     displayName,
		photoKey:        strings.TrimSpace(req.PhotoKey),
		instagramHandle: instagram,
		hideSocials:     req.HideSocials,
		answers:         req.Answers,
	}, true
}

func normalizeHandle(w http.ResponseWriter, value *string, field string) (*string, bool) {
	if value == nil {
		return nil, true
	}
	trimmed := strings.TrimSpace(*value)
	if trimmed == "" {
		return nil, true
	}
	if strings.HasPrefix(trimmed, "@") {
		writeError(w, http.StatusBadRequest, "invalid_request", field+" must not start with @")
		return nil, false
	}
	if runeLen(trimmed) > 60 {
		writeError(w, http.StatusBadRequest, "invalid_request", field+" must be 60 characters or fewer")
		return nil, false
	}
	return &trimmed, true
}

func userEmailMatches(ctx context.Context, store surveyStore, userID string, callerEmail string) (bool, error) {
	var email string
	err := store.QueryRow(ctx, `select email from users where id=$1`, userID).Scan(&email)
	if errors.Is(err, pgx.ErrNoRows) {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	return strings.EqualFold(email, callerEmail), nil
}

func surveyByUserID(ctx context.Context, store surveyStore, userID string) (*meSurveyEntry, string, error) {
	var (
		id          string
		instagram   pgtype.Text
		answers     []byte
		entry       meSurveyEntry
		hideSocials bool
	)

	err := store.QueryRow(
		ctx,
		`select
			id::text,
			display_name,
			photo_object_key,
			instagram_handle,
			hide_socials,
			answers,
			submitted_at
		from surveys
		where user_id=$1`,
		userID,
	).Scan(
		&id,
		&entry.DisplayName,
		&entry.PhotoKey,
		&instagram,
		&hideSocials,
		&answers,
		&entry.SubmittedAt,
	)
	if err != nil {
		return nil, "", err
	}

	entry.InstagramHandle = textPtr(instagram)
	entry.HideSocials = hideSocials
	if len(answers) == 0 {
		answers = []byte(`{}`)
	}
	entry.Answers = json.RawMessage(answers)

	return &entry, id, nil
}

func callerEmail(r *http.Request) string {
	value, _ := r.Context().Value(auth.CallerEmailKey).(string)
	return strings.ToLower(strings.TrimSpace(value))
}

func nullableString(value *string) any {
	if value == nil {
		return nil
	}
	return *value
}

func textPtr(value pgtype.Text) *string {
	if !value.Valid {
		return nil
	}
	return &value.String
}

func runeLen(value string) int {
	return utf8.RuneCountInString(value)
}
