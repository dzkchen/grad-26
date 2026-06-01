package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/dzkchen/grad-26/api/internal/questions"
	"github.com/jackc/pgx/v5"
)

// --- Pure aggregator tests ----------------------------------------------------

func TestComputeAggregates_Scale1_10(t *testing.T) {
	q := questions.Question{Id: "stress", Type: "scale_1_10", Label: "Stress"}
	answers := answersFor("stress", 1, 5, 5, 5, 7, 10)

	got := computeAggregates([]questions.Question{q}, answers)

	agg, ok := got["stress"].(numericAggregate)
	if !ok {
		t.Fatalf("aggregate type = %T, want numericAggregate", got["stress"])
	}
	if agg.Type != "scale_1_10" || agg.BucketMin != 1 {
		t.Fatalf("scale meta wrong: type=%s bucket_min=%d", agg.Type, agg.BucketMin)
	}
	if len(agg.Histogram) != 10 {
		t.Fatalf("histogram len = %d, want 10", len(agg.Histogram))
	}
	wantHist := []int{1, 0, 0, 0, 3, 0, 1, 0, 0, 1}
	for i, want := range wantHist {
		if agg.Histogram[i] != want {
			t.Errorf("histogram[%d] = %d, want %d", i, agg.Histogram[i], want)
		}
	}
	if agg.Count != 6 {
		t.Errorf("count = %d, want 6", agg.Count)
	}
	// values: 1,5,5,5,7,10; sum=33; mean=5.5; sorted=[1,5,5,5,7,10]; median=(5+5)/2=5
	if agg.Mean != 5.5 {
		t.Errorf("mean = %v, want 5.5", agg.Mean)
	}
	if agg.Median != 5 {
		t.Errorf("median = %v, want 5", agg.Median)
	}
}

func TestComputeAggregates_ScaleDropsOutOfRange(t *testing.T) {
	q := questions.Question{Id: "stress", Type: "scale_1_10"}
	answers := answersFor("stress", 5, 5, 11, 0, -1)

	agg := computeAggregates([]questions.Question{q}, answers)["stress"].(numericAggregate)
	if agg.Count != 2 {
		t.Fatalf("count = %d, want 2 (out-of-range dropped)", agg.Count)
	}
	if agg.Histogram[4] != 2 {
		t.Fatalf("histogram[4] = %d, want 2", agg.Histogram[4])
	}
}

func TestComputeAggregates_Number(t *testing.T) {
	minV, maxV := 3, 12
	q := questions.Question{Id: "avg_sleep", Type: "number", Min: &minV, Max: &maxV}
	answers := answersFor("avg_sleep", 6, 6, 7, 7, 8, 8, 8)

	agg := computeAggregates([]questions.Question{q}, answers)["avg_sleep"].(numericAggregate)
	if agg.Type != "number" || agg.BucketMin != 3 {
		t.Fatalf("number meta wrong: %+v", agg)
	}
	// histogram has 12-3+1 = 10 slots, indexed by value-3
	if len(agg.Histogram) != 10 {
		t.Fatalf("histogram len = %d, want 10", len(agg.Histogram))
	}
	if agg.Histogram[6-3] != 2 || agg.Histogram[7-3] != 2 || agg.Histogram[8-3] != 3 {
		t.Fatalf("histogram = %v", agg.Histogram)
	}
	if agg.Count != 7 {
		t.Fatalf("count = %d, want 7", agg.Count)
	}
	// median of sorted [6,6,7,7,8,8,8] = 7
	if agg.Median != 7 {
		t.Fatalf("median = %v, want 7", agg.Median)
	}
	// mean = 50/7 ≈ 7.14
	if agg.Mean != 7.14 {
		t.Fatalf("mean = %v, want 7.14", agg.Mean)
	}
}

func TestComputeAggregates_NumberClampsOutOfRange(t *testing.T) {
	minV, maxV := 1, 5
	q := questions.Question{Id: "rating", Type: "number", Min: &minV, Max: &maxV}
	answers := answersFor("rating", -3, 99)

	agg := computeAggregates([]questions.Question{q}, answers)["rating"].(numericAggregate)
	if agg.Histogram[0] != 1 {
		t.Errorf("histogram[0] (clamped to min) = %d, want 1", agg.Histogram[0])
	}
	if agg.Histogram[4] != 1 {
		t.Errorf("histogram[4] (clamped to max) = %d, want 1", agg.Histogram[4])
	}
}

func TestComputeAggregates_SingleChoice(t *testing.T) {
	q := questions.Question{
		Id:      "final_grade_bucket",
		Type:    "single_choice",
		Choices: []string{"<70", "70-79", "80-89", "90-99", "100"},
	}
	answers := []map[string]any{
		{"final_grade_bucket": "80-89"},
		{"final_grade_bucket": "80-89"},
		{"final_grade_bucket": "90-99"},
		{"final_grade_bucket": "not-a-real-choice"}, // ignored
		{}, // skipped (no answer)
	}

	agg := computeAggregates([]questions.Question{q}, answers)["final_grade_bucket"].(choiceAggregate)
	if agg.Type != "single_choice" {
		t.Fatalf("type = %s", agg.Type)
	}
	if len(agg.Order) != len(q.Choices) {
		t.Fatalf("order len = %d, want %d", len(agg.Order), len(q.Choices))
	}
	for i, c := range q.Choices {
		if agg.Order[i] != c {
			t.Fatalf("order[%d] = %s, want %s", i, agg.Order[i], c)
		}
	}
	// Includes zero-count entries
	wantCounts := map[string]int{"<70": 0, "70-79": 0, "80-89": 2, "90-99": 1, "100": 0}
	for k, want := range wantCounts {
		if agg.Choices[k] != want {
			t.Errorf("choices[%s] = %d, want %d", k, agg.Choices[k], want)
		}
	}
	if len(agg.Choices) != len(wantCounts) {
		t.Errorf("choices has %d keys, want %d", len(agg.Choices), len(wantCounts))
	}
}

func TestComputeAggregates_MultiChoice(t *testing.T) {
	q := questions.Question{
		Id:      "fav_subjects",
		Type:    "multi_choice",
		Choices: []string{"Math", "Science", "English", "Art"},
	}
	answers := []map[string]any{
		{"fav_subjects": []any{"Math", "Science"}},
		{"fav_subjects": []any{"Math", "Math"}}, // duplicate within row counts once
		{"fav_subjects": []any{"Art"}},
		{"fav_subjects": []any{"Bogus"}}, // ignored
		{"fav_subjects": "Math"},         // wrong shape — ignored
	}

	agg := computeAggregates([]questions.Question{q}, answers)["fav_subjects"].(choiceAggregate)
	if agg.Type != "multi_choice" {
		t.Fatalf("type = %s", agg.Type)
	}
	want := map[string]int{"Math": 2, "Science": 1, "English": 0, "Art": 1}
	for k, w := range want {
		if agg.Choices[k] != w {
			t.Errorf("choices[%s] = %d, want %d", k, agg.Choices[k], w)
		}
	}
}

func TestComputeAggregates_FreeText(t *testing.T) {
	qs := []questions.Question{
		{Id: "quote", Type: "long_text"},
		{Id: "name", Type: "short_text"},
	}
	answers := []map[string]any{
		{"quote": " Sleep more. ", "name": "Alex"},
		{"quote": "Sleep   more.", "name": "alex"},
		{"quote": "Join a club.", "name": ""},
		{"quote": 9, "name": "Bo"},
		{},
	}
	got := computeAggregates(qs, answers)

	quoteAgg, ok := got["quote"].(textAggregate)
	if !ok {
		t.Fatalf("quote aggregate type = %T, want textAggregate", got["quote"])
	}
	if quoteAgg.Type != "long_text" || quoteAgg.Count != 3 {
		t.Fatalf("quote aggregate meta = %+v", quoteAgg)
	}
	wantQuotes := []textEntry{
		{Value: "Sleep more.", Count: 2},
		{Value: "Join a club.", Count: 1},
	}
	if fmt.Sprint(quoteAgg.Values) != fmt.Sprint(wantQuotes) {
		t.Fatalf("quote values = %+v, want %+v", quoteAgg.Values, wantQuotes)
	}

	nameAgg, ok := got["name"].(textAggregate)
	if !ok {
		t.Fatalf("name aggregate type = %T, want textAggregate", got["name"])
	}
	if nameAgg.Type != "short_text" || nameAgg.Count != 3 {
		t.Fatalf("name aggregate meta = %+v", nameAgg)
	}
	wantNames := []textEntry{
		{Value: "Alex", Count: 2},
		{Value: "Bo", Count: 1},
	}
	if fmt.Sprint(nameAgg.Values) != fmt.Sprint(wantNames) {
		t.Fatalf("name values = %+v, want %+v", nameAgg.Values, wantNames)
	}
}

func TestComputeAggregates_RealQuestionSchema(t *testing.T) {
	// Smoke-test against the canonical questions_gen.go list: every aggregatable
	// question should appear in the output, and retired/excluded IDs must not.
	answers := []map[string]any{
		{"stress": 7, "avg_sleep": 8, "final_grade_bucket": "80-89"},
		{"stress": 6, "avg_sleep": 7, "final_grade_bucket": "90-99"},
	}
	got := computeAggregates(questions.Questions, answers)

	for _, q := range questions.Questions {
		_, present := got[q.Id]
		switch q.Type {
		case "short_text", "long_text", "number", "scale_1_10", "single_choice", "multi_choice":
			if !present {
				t.Errorf("aggregatable question %q missing from aggregates", q.Id)
			}
		}
	}

	for _, retired := range []string{"linkedin", "first_name", "last_name", "fav_memory"} {
		if _, ok := got[retired]; ok {
			t.Errorf("retired/excluded id %q must not appear in aggregates", retired)
		}
	}
}

// --- Handler tests ------------------------------------------------------------

// fakeStatsStore implements statsStore over an in-memory slice of answers blobs.
type fakeStatsStore struct {
	answers  [][]byte // raw JSON for each survey row
	countErr error
	queryErr error
}

type fakeRow struct {
	val int
	err error
}

func (r fakeRow) Scan(dest ...any) error {
	if r.err != nil {
		return r.err
	}
	if len(dest) != 1 {
		return fmt.Errorf("fakeRow expected 1 dest, got %d", len(dest))
	}
	p, ok := dest[0].(*int)
	if !ok {
		return fmt.Errorf("fakeRow expected *int, got %T", dest[0])
	}
	*p = r.val
	return nil
}

type fakeRows struct {
	pgx.Rows
	rows [][]byte
	idx  int
}

func (f *fakeRows) Next() bool {
	if f.idx >= len(f.rows) {
		return false
	}
	f.idx++
	return true
}

func (f *fakeRows) Scan(dest ...any) error {
	if len(dest) != 1 {
		return fmt.Errorf("fakeRows expected 1 dest, got %d", len(dest))
	}
	p, ok := dest[0].(*[]byte)
	if !ok {
		return fmt.Errorf("fakeRows expected *[]byte, got %T", dest[0])
	}
	*p = f.rows[f.idx-1]
	return nil
}

func (f *fakeRows) Close()     {}
func (f *fakeRows) Err() error { return nil }

func (s *fakeStatsStore) QueryRow(_ context.Context, _ string, _ ...any) pgx.Row {
	if s.countErr != nil {
		return fakeRow{err: s.countErr}
	}
	return fakeRow{val: len(s.answers)}
}

func (s *fakeStatsStore) Query(_ context.Context, _ string, _ ...any) (pgx.Rows, error) {
	if s.queryErr != nil {
		return nil, s.queryErr
	}
	return &fakeRows{rows: s.answers}, nil
}

func mustJSON(t *testing.T, v any) []byte {
	t.Helper()
	b, err := json.Marshal(v)
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	return b
}

func seedFinalGradeAnswers(t *testing.T, n int, choice string) [][]byte {
	t.Helper()
	out := make([][]byte, 0, n)
	for range n {
		out = append(out, mustJSON(t, map[string]any{"final_grade_bucket": choice}))
	}
	return out
}

func TestStatsAggregates_BelowMinSuppressesAggregates(t *testing.T) {
	store := &fakeStatsStore{answers: seedFinalGradeAnswers(t, 4, "80-89")}
	h := StatsAggregates(store)

	req := httptest.NewRequest("GET", "/stats/aggregates", nil)
	rec := httptest.NewRecorder()
	h(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d (body: %s)", rec.Code, rec.Body.String())
	}
	var resp statsResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if resp.TotalSubmissions != 4 {
		t.Fatalf("total_submissions = %d, want 4", resp.TotalSubmissions)
	}
	if len(resp.Aggregates) != 0 {
		t.Fatalf("aggregates not empty under min: %v", resp.Aggregates)
	}
}

func TestStatsAggregates_AboveMinReturnsAggregates(t *testing.T) {
	rows := [][]byte{
		mustJSON(t, map[string]any{"final_grade_bucket": "80-89", "stress": 7, "avg_sleep": 8}),
		mustJSON(t, map[string]any{"final_grade_bucket": "80-89", "stress": 6, "avg_sleep": 7}),
		mustJSON(t, map[string]any{"final_grade_bucket": "90-99", "stress": 8, "avg_sleep": 6}),
		mustJSON(t, map[string]any{"final_grade_bucket": "90-99", "stress": 5, "avg_sleep": 8}),
		mustJSON(t, map[string]any{"final_grade_bucket": "100", "stress": 9, "avg_sleep": 9}),
	}
	store := &fakeStatsStore{answers: rows}
	h := StatsAggregates(store)

	req := httptest.NewRequest("GET", "/stats/aggregates", nil)
	rec := httptest.NewRecorder()
	h(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d (body: %s)", rec.Code, rec.Body.String())
	}
	var resp struct {
		TotalSubmissions int                        `json:"total_submissions"`
		Aggregates       map[string]json.RawMessage `json:"aggregates"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if resp.TotalSubmissions != 5 {
		t.Fatalf("total_submissions = %d, want 5", resp.TotalSubmissions)
	}

	// final_grade_bucket sanity-check (single_choice)
	var fgb choiceAggregate
	if err := json.Unmarshal(resp.Aggregates["final_grade_bucket"], &fgb); err != nil {
		t.Fatalf("decode final_grade_bucket: %v", err)
	}
	if fgb.Type != "single_choice" {
		t.Errorf("final_grade_bucket type = %s", fgb.Type)
	}
	if fgb.Choices["80-89"] != 2 || fgb.Choices["90-99"] != 2 || fgb.Choices["100"] != 1 {
		t.Errorf("final_grade_bucket counts wrong: %+v", fgb.Choices)
	}
	if fgb.Choices["<70"] != 0 || fgb.Choices["70-79"] != 0 {
		t.Errorf("missing zero-count entries: %+v", fgb.Choices)
	}

	// stress sanity-check (scale_1_10)
	var stress numericAggregate
	if err := json.Unmarshal(resp.Aggregates["stress"], &stress); err != nil {
		t.Fatalf("decode stress: %v", err)
	}
	if stress.Type != "scale_1_10" || stress.BucketMin != 1 || len(stress.Histogram) != 10 {
		t.Errorf("stress meta wrong: %+v", stress)
	}
	if stress.Count != 5 {
		t.Errorf("stress count = %d, want 5", stress.Count)
	}

	// avg_sleep (number) — schema has Min=3 Max=12, so histogram is length 10
	var sleep numericAggregate
	if err := json.Unmarshal(resp.Aggregates["avg_sleep"], &sleep); err != nil {
		t.Fatalf("decode avg_sleep: %v", err)
	}
	if sleep.Type != "number" || sleep.BucketMin != 3 || len(sleep.Histogram) != 10 {
		t.Errorf("avg_sleep meta wrong: %+v", sleep)
	}
}

func TestStatsAggregates_MinQueryDoesNotOverrideFloor(t *testing.T) {
	store := &fakeStatsStore{answers: seedFinalGradeAnswers(t, 1, "80-89")}
	h := StatsAggregates(store)

	req := httptest.NewRequest("GET", "/stats/aggregates?min=1", nil)
	rec := httptest.NewRecorder()
	h(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d (body: %s)", rec.Code, rec.Body.String())
	}
	var resp statsResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if resp.TotalSubmissions != 1 {
		t.Fatalf("total_submissions = %d, want 1", resp.TotalSubmissions)
	}
	if len(resp.Aggregates) != 0 {
		t.Fatalf("aggregates unlocked under ignored ?min=1 override: %v", resp.Aggregates)
	}
}

func TestStatsAggregates_CountErrorSurfaces500(t *testing.T) {
	store := &fakeStatsStore{countErr: errors.New("boom")}
	h := StatsAggregates(store)

	req := httptest.NewRequest("GET", "/stats/aggregates", nil)
	rec := httptest.NewRecorder()
	h(rec, req)

	if rec.Code != http.StatusInternalServerError {
		t.Fatalf("status = %d, want 500 (body: %s)", rec.Code, rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), "internal_error") {
		t.Fatalf("body should mention internal_error: %s", rec.Body.String())
	}
}

// --- Helpers ------------------------------------------------------------------

// answersFor builds one survey row per value so each row has exactly one answer
// for the given question id.
func answersFor(id string, values ...float64) []map[string]any {
	out := make([]map[string]any, 0, len(values))
	for _, v := range values {
		out = append(out, map[string]any{id: v})
	}
	return out
}
