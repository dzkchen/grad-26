package questions

import "testing"

func TestValidateAnswers_Pass(t *testing.T) {
	cases := []struct {
		name    string
		answers map[string]any
	}{
		{"valid scale value", map[string]any{"stress": 7}},
		{"valid scale boundary low", map[string]any{"stress": 1}},
		{"valid scale boundary high", map[string]any{"stress": 10}},
		{"valid single_choice", map[string]any{"final_grade_bucket": "80-89"}},
		{"valid number in range", map[string]any{"study_hours": 12}},
		{"valid short_text under max", map[string]any{"program_major": "Engineering"}},
		{"empty answers", map[string]any{}},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if err := ValidateAnswers(tc.answers); err != nil {
				t.Fatalf("expected nil, got %v", err)
			}
		})
	}
}

func TestValidateAnswers_Fail(t *testing.T) {
	cases := []struct {
		name    string
		answers map[string]any
	}{
		{"out-of-range scale low", map[string]any{"stress": 0}},
		{"out-of-range scale high", map[string]any{"stress": 11}},
		{"unknown question id", map[string]any{"not_a_real_question": "x"}},
		{"choice not in list", map[string]any{"final_grade_bucket": "F"}},
		{"number below min", map[string]any{"avg_sleep": 2}},
		{"number above max", map[string]any{"avg_sleep": 25}},
		{"wrong type for text", map[string]any{"program_major": 42}},
		{"text exceeds maxLength", map[string]any{
			"program_major": string(make([]byte, 200)),
		}},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if err := ValidateAnswers(tc.answers); err == nil {
				t.Fatalf("expected error, got nil")
			}
		})
	}
}
