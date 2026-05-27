package handlers

import (
	"context"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

const (
	defaultDirectoryLimit = 24
	maxDirectoryLimit     = 100
)

// directoryStore is the pgx surface this handler needs. Lets the test substitute
// a fake without spinning up a real pool.
type directoryStore interface {
	Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error)
}

type directoryEntry struct {
	ID          string           `json:"id"`
	DisplayName string           `json:"display_name"`
	PhotoURL    string           `json:"photo_url"`
	Socials     *directorySocial `json:"socials"`
	Details     directoryDetails `json:"details"`
}

type directorySocial struct {
	Instagram string `json:"instagram,omitempty"`
	Linkedin  string `json:"linkedin,omitempty"`
}

// directoryDetails carries the answer subset shown when a card is expanded.
// Pulled from the answers JSONB column. Anything missing or non-string gets
// the zero value and is omitted from the JSON payload.
type directoryDetails struct {
	WhatsNext       string `json:"whats_next,omitempty"`
	ProgramMajor    string `json:"program_major,omitempty"`
	SchoolWorkplace string `json:"school_workplace,omitempty"`
	SeniorQuote     string `json:"senior_quote,omitempty"`
}

type directoryResponse struct {
	Entries    []directoryEntry `json:"entries"`
	NextCursor *string          `json:"next_cursor"`
}

// Directory implements GET /directory per planning/API_SPEC.md §4.4.
//
// publicHost is the bare R2 public hostname (e.g. "pub-xxxxx.r2.dev"); the
// handler builds `https://<host>/<key>` URLs from it. Sort order is
// `submitted_at DESC, id DESC` and the cursor encodes both so ties paginate
// without dups or skips.
func Directory(store directoryStore, publicHost string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		limit, err := parseDirectoryLimit(r.URL.Query().Get("limit"))
		if err != nil {
			writeError(w, http.StatusBadRequest, "invalid_request", err.Error())
			return
		}

		cursorTS, cursorID, hasCursor, err := decodeDirectoryCursor(r.URL.Query().Get("cursor"))
		if err != nil {
			writeError(w, http.StatusBadRequest, "invalid_request", "cursor is malformed")
			return
		}

		entries, nextCursor, err := queryDirectory(r.Context(), store, publicHost, limit, hasCursor, cursorTS, cursorID)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "internal_error", "could not fetch directory")
			return
		}

		writeJSON(w, http.StatusOK, directoryResponse{Entries: entries, NextCursor: nextCursor})
	}
}

func parseDirectoryLimit(raw string) (int, error) {
	if raw == "" {
		return defaultDirectoryLimit, nil
	}
	limit, err := strconv.Atoi(raw)
	if err != nil || limit < 1 {
		return 0, errors.New("limit must be a positive integer")
	}
	if limit > maxDirectoryLimit {
		limit = maxDirectoryLimit
	}
	return limit, nil
}

// Cursor format: base64url("<RFC3339Nano submitted_at>|<uuid>"). The pair is
// the last row of the previous page; the next page reads everything strictly
// after it under the (submitted_at DESC, id DESC) ordering.
func encodeDirectoryCursor(ts time.Time, id string) string {
	raw := ts.UTC().Format(time.RFC3339Nano) + "|" + id
	return base64.RawURLEncoding.EncodeToString([]byte(raw))
}

func decodeDirectoryCursor(raw string) (time.Time, string, bool, error) {
	if raw == "" {
		return time.Time{}, "", false, nil
	}
	decoded, err := base64.RawURLEncoding.DecodeString(raw)
	if err != nil {
		// Allow padded base64 too so callers don't trip on URL-encoded `=`.
		decoded, err = base64.URLEncoding.DecodeString(raw)
		if err != nil {
			return time.Time{}, "", false, err
		}
	}
	parts := strings.SplitN(string(decoded), "|", 2)
	if len(parts) != 2 {
		return time.Time{}, "", false, errors.New("cursor missing separator")
	}
	ts, err := time.Parse(time.RFC3339Nano, parts[0])
	if err != nil {
		return time.Time{}, "", false, err
	}
	return ts, parts[1], true, nil
}

func queryDirectory(ctx context.Context, store directoryStore, publicHost string, limit int, hasCursor bool, cursorTS time.Time, cursorID string) ([]directoryEntry, *string, error) {
	// Fetch limit+1 so we can tell whether another page exists without a
	// second round-trip.
	fetch := limit + 1

	var (
		rows pgx.Rows
		err  error
	)
	if hasCursor {
		rows, err = store.Query(
			ctx,
			`select id::text, display_name, photo_object_key, instagram_handle, linkedin, answers, submitted_at
			from surveys
			where approved_at is not null
			and (submitted_at, id) < ($1, $2)
			order by submitted_at desc, id desc
			limit $3`,
			cursorTS, cursorID, fetch,
		)
	} else {
		rows, err = store.Query(
			ctx,
			`select id::text, display_name, photo_object_key, instagram_handle, linkedin, answers, submitted_at
			from surveys
			where approved_at is not null
			order by submitted_at desc, id desc
			limit $1`,
			fetch,
		)
	}
	if err != nil {
		return nil, nil, err
	}
	defer rows.Close()

	type rawRow struct {
		id          string
		displayName string
		photoKey    string
		instagram   pgtype.Text
		linkedin    sql.NullString
		answers     []byte
		submittedAt time.Time
	}

	collected := make([]rawRow, 0, fetch)
	for rows.Next() {
		var rr rawRow
		if err := rows.Scan(&rr.id, &rr.displayName, &rr.photoKey, &rr.instagram, &rr.linkedin, &rr.answers, &rr.submittedAt); err != nil {
			return nil, nil, err
		}
		collected = append(collected, rr)
	}
	if err := rows.Err(); err != nil {
		return nil, nil, err
	}

	var nextCursor *string
	if len(collected) > limit {
		last := collected[limit-1]
		token := encodeDirectoryCursor(last.submittedAt, last.id)
		nextCursor = &token
		collected = collected[:limit]
	}

	entries := make([]directoryEntry, 0, len(collected))
	for _, rr := range collected {
		entry := directoryEntry{
			ID:          rr.id,
			DisplayName: rr.displayName,
			PhotoURL:    photoURL(publicHost, rr.photoKey),
			Details:     extractDetails(rr.answers),
		}
		socials := directorySocial{}
		if rr.instagram.Valid && rr.instagram.String != "" {
			socials.Instagram = rr.instagram.String
		}
		if rr.linkedin.Valid && rr.linkedin.String != "" {
			socials.Linkedin = rr.linkedin.String
		}
		if socials.Instagram != "" || socials.Linkedin != "" {
			entry.Socials = &socials
		}
		entries = append(entries, entry)
	}

	return entries, nextCursor, nil
}

// extractDetails pulls a fixed set of string-valued answers out of the
// surveys.answers JSONB blob. Unknown shapes (missing keys, non-string values,
// invalid JSON) silently degrade to empty strings — directory cards should
// render even if a student skipped a question.
func extractDetails(raw []byte) directoryDetails {
	if len(raw) == 0 {
		return directoryDetails{}
	}
	var parsed map[string]any
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return directoryDetails{}
	}
	return directoryDetails{
		WhatsNext:       answerString(parsed, "whats_next"),
		ProgramMajor:    answerString(parsed, "program_major"),
		SchoolWorkplace: answerString(parsed, "school_workplace"),
		SeniorQuote:     answerString(parsed, "senior_quote"),
	}
}

func answerString(answers map[string]any, key string) string {
	value, ok := answers[key]
	if !ok {
		return ""
	}
	s, ok := value.(string)
	if !ok {
		return ""
	}
	return strings.TrimSpace(s)
}

// photoURL prefixes the R2 public hostname; if the env var is unset we return
// the raw key as a best-effort fallback so the page can still render something
// in local dev.
func photoURL(publicHost, key string) string {
	host := strings.TrimSpace(publicHost)
	if host == "" {
		return key
	}
	host = strings.TrimPrefix(host, "https://")
	host = strings.TrimPrefix(host, "http://")
	host = strings.TrimSuffix(host, "/")
	return fmt.Sprintf("https://%s/%s", host, strings.TrimPrefix(key, "/"))
}
