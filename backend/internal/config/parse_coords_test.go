package config

import "testing"

func TestParseCoordPair(t *testing.T) {
	t.Run("valid", func(t *testing.T) {
		x, y, err := ParseCoordPair("12,34")
		if err != nil {
			t.Fatalf("expected nil error, got %v", err)
		}
		if x != 12 || y != 34 {
			t.Fatalf("expected (12,34), got (%d,%d)", x, y)
		}
	})

	t.Run("valid with whitespace", func(t *testing.T) {
		x, y, err := ParseCoordPair("  0,1 ")
		if err != nil {
			t.Fatalf("expected nil error, got %v", err)
		}
		if x != 0 || y != 1 {
			t.Fatalf("expected (0,1), got (%d,%d)", x, y)
		}
	})

	t.Run("invalid", func(t *testing.T) {
		_, _, err := ParseCoordPair("1,2,3")
		if err == nil {
			t.Fatalf("expected error")
		}
	})
}

