package handlers

import (
	"context"
	"encoding/json"
	"math"
	"net/http"
	"sort"
	"strconv"
	"strings"

	"github.com/dzkchen/grad-26/api/internal/questions"
	"github.com/jackc/pgx/v5"
)

// statsStore is the pgx surface the stats handler needs. Lets tests substitute
// a fake without spinning up a real pool.
type statsStore interface {
	Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error)
	QueryRow(ctx context.Context, sql string, args ...any) pgx.Row
}

const defaultStatsMin = 5

type statsResponse struct {
	TotalSubmissions int            `json:"total_submissions"`
	Aggregates       map[string]any `json:"aggregates"`
}

type numericAggregate struct {
	Type      string  `json:"type"`
	BucketMin int     `json:"bucket_min"`
	Histogram []int   `json:"histogram"`
	Mean      float64 `json:"mean"`
	Median    float64 `json:"median"`
	Count     int     `json:"count"`
}

type choiceAggregate struct {
	Type    string         `json:"type"`
	Choices map[string]int `json:"choices"`
	Order   []string       `json:"order"`
}

type textEntry struct {
	Value string `json:"value"`
	Count int    `json:"count"`
}

type textAggregate struct {
	Type   string      `json:"type"`
	Values []textEntry `json:"values"`
	Count  int         `json:"count"`
}

// StatsAggregates implements GET /stats/aggregates per planning/API_SPEC.md §4.5.
//
// The de-anonymization floor (default 5) suppresses per-row reads when the
// class hasn't crossed it. The `?min=` override is used by the Next.js
// /dev/stats preview to render charts off a single test submission; do not
// call with a lowered min from production paths.
func StatsAggregates(store statsStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		min, err := parseStatsMin(r.URL.Query().Get("min"))
		if err != nil {
			writeError(w, http.StatusBadRequest, "invalid_request", err.Error())
			return
		}

		var total int
		if err := store.QueryRow(r.Context(), `select count(*) from surveys where approved_at is not null`).Scan(&total); err != nil {
			writeError(w, http.StatusInternalServerError, "internal_error", "could not count surveys")
			return
		}

		if total < min {
			writeJSON(w, http.StatusOK, statsResponse{
				TotalSubmissions: total,
				Aggregates:       map[string]any{},
			})
			return
		}

		rows, err := store.Query(r.Context(), `select answers from surveys where approved_at is not null`)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "internal_error", "could not read surveys")
			return
		}
		defer rows.Close()

		var allAnswers []map[string]any
		for rows.Next() {
			var raw []byte
			if err := rows.Scan(&raw); err != nil {
				writeError(w, http.StatusInternalServerError, "internal_error", "could not scan survey row")
				return
			}
			parsed := map[string]any{}
			if len(raw) > 0 {
				if err := json.Unmarshal(raw, &parsed); err != nil {
					// Treat unparseable rows as having no answers rather than 500ing
					// the whole endpoint — a single bad row shouldn't black out stats.
					parsed = map[string]any{}
				}
			}
			allAnswers = append(allAnswers, parsed)
		}
		if err := rows.Err(); err != nil {
			writeError(w, http.StatusInternalServerError, "internal_error", "could not iterate surveys")
			return
		}

		aggregates := computeAggregates(questions.Questions, allAnswers)

		writeJSON(w, http.StatusOK, statsResponse{
			TotalSubmissions: total,
			Aggregates:       aggregates,
		})
	}
}

func parseStatsMin(raw string) (int, error) {
	if raw == "" {
		return defaultStatsMin, nil
	}
	min, err := strconv.Atoi(raw)
	if err != nil {
		return 0, errInvalidMin
	}
	if min < 1 {
		return 0, errInvalidMin
	}
	return min, nil
}

var errInvalidMin = &statsParamError{msg: "min must be an integer >= 1"}

type statsParamError struct{ msg string }

func (e *statsParamError) Error() string { return e.msg }

// computeAggregates is the pure aggregation function — given the canonical
// question schema and a slice of parsed answers (one map per row), produce
// the per-question aggregate map.
func computeAggregates(qs []questions.Question, answers []map[string]any) map[string]any {
	out := map[string]any{}
	for _, q := range qs {
		switch q.Type {
		case "short_text", "long_text":
			out[q.Id] = freeTextAggregate(q, answers)
		case "scale_1_10":
			out[q.Id] = scaleAggregate(q, answers)
		case "number":
			out[q.Id] = numberAggregate(q, answers)
		case "single_choice":
			out[q.Id] = singleChoiceAggregate(q, answers)
		case "multi_choice":
			out[q.Id] = multiChoiceAggregate(q, answers)
		}
	}
	return out
}

func freeTextAggregate(q questions.Question, answers []map[string]any) textAggregate {
	counts := map[string]textEntry{}
	for _, row := range answers {
		s, ok := textAnswer(row[q.Id])
		if !ok {
			continue
		}
		key := strings.ToLower(s)
		entry := counts[key]
		if entry.Value == "" {
			entry.Value = s
		}
		entry.Count++
		counts[key] = entry
	}

	values := make([]textEntry, 0, len(counts))
	total := 0
	for _, entry := range counts {
		values = append(values, entry)
		total += entry.Count
	}
	sort.Slice(values, func(i, j int) bool {
		if values[i].Count != values[j].Count {
			return values[i].Count > values[j].Count
		}
		return strings.ToLower(values[i].Value) < strings.ToLower(values[j].Value)
	})

	return textAggregate{
		Type:   q.Type,
		Values: values,
		Count:  total,
	}
}

func scaleAggregate(q questions.Question, answers []map[string]any) numericAggregate {
	hist := make([]int, 10)
	values := make([]float64, 0, len(answers))
	for _, row := range answers {
		v, ok := numericAnswer(row[q.Id])
		if !ok {
			continue
		}
		n := int(math.Round(v))
		if n < 1 || n > 10 {
			continue
		}
		hist[n-1]++
		values = append(values, v)
	}
	mean, median := meanMedian(values)
	return numericAggregate{
		Type:      "scale_1_10",
		BucketMin: 1,
		Histogram: hist,
		Mean:      mean,
		Median:    median,
		Count:     len(values),
	}
}

func numberAggregate(q questions.Question, answers []map[string]any) numericAggregate {
	minV := 0
	maxV := 0
	if q.Min != nil {
		minV = *q.Min
	}
	if q.Max != nil {
		maxV = *q.Max
	}
	if maxV < minV {
		maxV = minV
	}
	hist := make([]int, maxV-minV+1)
	values := make([]float64, 0, len(answers))
	for _, row := range answers {
		v, ok := numericAnswer(row[q.Id])
		if !ok {
			continue
		}
		n := int(math.Round(v))
		n = max(n, minV)
		n = min(n, maxV)
		hist[n-minV]++
		values = append(values, v)
	}
	mean, median := meanMedian(values)
	return numericAggregate{
		Type:      "number",
		BucketMin: minV,
		Histogram: hist,
		Mean:      mean,
		Median:    median,
		Count:     len(values),
	}
}

func singleChoiceAggregate(q questions.Question, answers []map[string]any) choiceAggregate {
	counts := zeroChoiceCounts(q.Choices)
	for _, row := range answers {
		s, ok := row[q.Id].(string)
		if !ok {
			continue
		}
		if _, allowed := counts[s]; !allowed {
			continue
		}
		counts[s]++
	}
	return choiceAggregate{
		Type:    "single_choice",
		Choices: counts,
		Order:   append([]string(nil), q.Choices...),
	}
}

func multiChoiceAggregate(q questions.Question, answers []map[string]any) choiceAggregate {
	counts := zeroChoiceCounts(q.Choices)
	for _, row := range answers {
		arr, ok := row[q.Id].([]any)
		if !ok {
			continue
		}
		// A respondent can mark a choice multiple times in the raw JSON, but
		// per spec each selection counts once per respondent — dedupe within
		// the row.
		seen := map[string]bool{}
		for _, item := range arr {
			s, ok := item.(string)
			if !ok {
				continue
			}
			if _, allowed := counts[s]; !allowed {
				continue
			}
			if seen[s] {
				continue
			}
			seen[s] = true
			counts[s]++
		}
	}
	return choiceAggregate{
		Type:    "multi_choice",
		Choices: counts,
		Order:   append([]string(nil), q.Choices...),
	}
}

func zeroChoiceCounts(choices []string) map[string]int {
	m := make(map[string]int, len(choices))
	for _, c := range choices {
		m[c] = 0
	}
	return m
}

func textAnswer(v any) (string, bool) {
	s, ok := v.(string)
	if !ok {
		return "", false
	}
	s = strings.Join(strings.Fields(s), " ")
	if s == "" {
		return "", false
	}
	return s, true
}

func numericAnswer(v any) (float64, bool) {
	switch n := v.(type) {
	case float64:
		return n, true
	case float32:
		return float64(n), true
	case int:
		return float64(n), true
	case int32:
		return float64(n), true
	case int64:
		return float64(n), true
	case json.Number:
		f, err := n.Float64()
		if err != nil {
			return 0, false
		}
		return f, true
	default:
		return 0, false
	}
}

func meanMedian(values []float64) (float64, float64) {
	if len(values) == 0 {
		return 0, 0
	}
	sum := 0.0
	for _, v := range values {
		sum += v
	}
	mean := sum / float64(len(values))

	sorted := append([]float64(nil), values...)
	sort.Float64s(sorted)
	n := len(sorted)
	var median float64
	if n%2 == 1 {
		median = sorted[n/2]
	} else {
		median = (sorted[n/2-1] + sorted[n/2]) / 2
	}

	return round2(mean), round2(median)
}

func round2(x float64) float64 {
	return math.Round(x*100) / 100
}
