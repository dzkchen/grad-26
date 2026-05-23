package questions

import (
	"errors"
	"fmt"
)

// ValidateAnswers checks that every entry in answers refers to a known
// question and that the value matches that question's type/constraints.
// Missing answers are allowed here — required-field policy lives at the
// handler layer.
func ValidateAnswers(answers map[string]any) error {
	for id, v := range answers {
		q, ok := QuestionsByID[id]
		if !ok {
			return fmt.Errorf("unknown question id %q", id)
		}
		if err := validateAnswer(q, v); err != nil {
			return fmt.Errorf("question %q: %w", id, err)
		}
	}
	return nil
}

func validateAnswer(q Question, v any) error {
	switch q.Type {
	case "short_text", "long_text":
		s, ok := v.(string)
		if !ok {
			return fmt.Errorf("expected string, got %T", v)
		}
		if q.MaxLength != nil && len(s) > *q.MaxLength {
			return fmt.Errorf("length %d exceeds max %d", len(s), *q.MaxLength)
		}
		return nil

	case "number":
		n, err := asNumber(v)
		if err != nil {
			return err
		}
		if q.Min != nil && n < float64(*q.Min) {
			return fmt.Errorf("value %v below min %d", v, *q.Min)
		}
		if q.Max != nil && n > float64(*q.Max) {
			return fmt.Errorf("value %v above max %d", v, *q.Max)
		}
		return nil

	case "scale_1_10":
		n, err := asNumber(v)
		if err != nil {
			return err
		}
		if n < 1 || n > 10 {
			return fmt.Errorf("scale value %v out of range 1..10", v)
		}
		return nil

	case "single_choice":
		s, ok := v.(string)
		if !ok {
			return fmt.Errorf("expected string, got %T", v)
		}
		if !choiceAllowed(q.Choices, s) {
			return fmt.Errorf("choice %q not in allowed list", s)
		}
		return nil

	case "multi_choice":
		arr, ok := v.([]any)
		if !ok {
			return fmt.Errorf("expected array, got %T", v)
		}
		for _, item := range arr {
			s, ok := item.(string)
			if !ok {
				return fmt.Errorf("expected string in array, got %T", item)
			}
			if !choiceAllowed(q.Choices, s) {
				return fmt.Errorf("choice %q not in allowed list", s)
			}
		}
		return nil
	}

	return errors.New("unknown question type")
}

func asNumber(v any) (float64, error) {
	switch n := v.(type) {
	case float64:
		return n, nil
	case float32:
		return float64(n), nil
	case int:
		return float64(n), nil
	case int32:
		return float64(n), nil
	case int64:
		return float64(n), nil
	default:
		return 0, fmt.Errorf("expected number, got %T", v)
	}
}

func choiceAllowed(allowed []string, s string) bool {
	for _, a := range allowed {
		if a == s {
			return true
		}
	}
	return false
}
