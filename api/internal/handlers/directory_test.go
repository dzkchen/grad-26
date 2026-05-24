package handlers

import (
	"testing"
	"time"
)

func TestDirectoryCursorRoundTrip(t *testing.T) {
	ts := time.Date(2026, 5, 21, 18, 45, 12, 345_678_900, time.UTC)
	id := "11111111-2222-3333-4444-555555555555"

	encoded := encodeDirectoryCursor(ts, id)
	if encoded == "" {
		t.Fatal("encoded cursor is empty")
	}

	gotTS, gotID, ok, err := decodeDirectoryCursor(encoded)
	if err != nil {
		t.Fatalf("decode: %v", err)
	}
	if !ok {
		t.Fatal("decode reported empty cursor")
	}
	if !gotTS.Equal(ts) {
		t.Fatalf("ts = %s, want %s", gotTS, ts)
	}
	if gotID != id {
		t.Fatalf("id = %q, want %q", gotID, id)
	}
}

func TestDirectoryCursorEmpty(t *testing.T) {
	ts, id, ok, err := decodeDirectoryCursor("")
	if err != nil {
		t.Fatalf("decode empty: %v", err)
	}
	if ok || !ts.IsZero() || id != "" {
		t.Fatalf("empty cursor should decode to zero values; got ok=%v ts=%v id=%q", ok, ts, id)
	}
}

func TestDirectoryCursorMalformed(t *testing.T) {
	for _, raw := range []string{"not-base64!!!", "bm9waXBlc2hlcmU"} {
		if _, _, _, err := decodeDirectoryCursor(raw); err == nil {
			t.Fatalf("decode(%q) = nil, want error", raw)
		}
	}
}

func TestParseDirectoryLimit(t *testing.T) {
	tests := []struct {
		raw     string
		want    int
		wantErr bool
	}{
		{"", defaultDirectoryLimit, false},
		{"10", 10, false},
		{"100", 100, false},
		{"500", maxDirectoryLimit, false},
		{"0", 0, true},
		{"-1", 0, true},
		{"abc", 0, true},
	}
	for _, tc := range tests {
		got, err := parseDirectoryLimit(tc.raw)
		if tc.wantErr {
			if err == nil {
				t.Errorf("parseDirectoryLimit(%q) = %d, want error", tc.raw, got)
			}
			continue
		}
		if err != nil {
			t.Errorf("parseDirectoryLimit(%q) error: %v", tc.raw, err)
		}
		if got != tc.want {
			t.Errorf("parseDirectoryLimit(%q) = %d, want %d", tc.raw, got, tc.want)
		}
	}
}

func TestPhotoURL(t *testing.T) {
	tests := []struct {
		host string
		key  string
		want string
	}{
		{"pub-abc.r2.dev", "surveys/aaa.jpg", "https://pub-abc.r2.dev/surveys/aaa.jpg"},
		{"https://pub-abc.r2.dev/", "surveys/aaa.jpg", "https://pub-abc.r2.dev/surveys/aaa.jpg"},
		{"", "surveys/aaa.jpg", "surveys/aaa.jpg"},
		{"pub-abc.r2.dev", "/surveys/aaa.jpg", "https://pub-abc.r2.dev/surveys/aaa.jpg"},
	}
	for _, tc := range tests {
		if got := photoURL(tc.host, tc.key); got != tc.want {
			t.Errorf("photoURL(%q,%q) = %q, want %q", tc.host, tc.key, got, tc.want)
		}
	}
}
