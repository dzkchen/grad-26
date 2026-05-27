package auth

import "strings"

// IsAdmin reports whether email is on the comma-separated admin allowlist.
// Comparison is case-insensitive and whitespace-tolerant.
type IsAdmin func(email string) bool

// NewIsAdmin returns an IsAdmin closure over the parsed allowlist. Empty entries
// are ignored, so an empty or unset env var produces a checker that rejects
// every email.
func NewIsAdmin(allowlist string) IsAdmin {
	allowed := make(map[string]struct{})
	for _, raw := range strings.Split(allowlist, ",") {
		email := strings.ToLower(strings.TrimSpace(raw))
		if email != "" {
			allowed[email] = struct{}{}
		}
	}
	return func(email string) bool {
		key := strings.ToLower(strings.TrimSpace(email))
		if key == "" {
			return false
		}
		_, ok := allowed[key]
		return ok
	}
}
