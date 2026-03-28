package config

import "testing"

func TestValidateConfig_DefaultsValid(t *testing.T) {
	cfg := DefaultConfig()
	if err := ValidateConfig(&cfg); err != nil {
		t.Fatalf("expected default config valid, got %v", err)
	}
}

func TestValidateConfig_RejectsMissingTitle(t *testing.T) {
	cfg := DefaultConfig()
	cfg.Title = ""
	if err := ValidateConfig(&cfg); err == nil {
		t.Fatalf("expected error for missing title")
	}
}

func TestValidateConfig_RejectsInvalidPaneColumns(t *testing.T) {
	cfg := DefaultConfig()
	cfg.Panes[0].AppColumns = 2
	if err := ValidateConfig(&cfg); err == nil {
		t.Fatalf("expected error for invalid appColumns")
	}
}

