package store

import (
	"context"
	"path/filepath"
	"testing"

	"pane/internal/config"
)

func TestYAMLRoundTripIntegrity(t *testing.T) {
	tmp := t.TempDir()
	path := filepath.Join(tmp, "config.yaml")

	s := NewFileStore(path, config.DefaultConfig)
	ctx := context.Background()

	cfg1, err := s.Load(ctx)
	if err != nil {
		t.Fatalf("load defaults: %v", err)
	}

	// Mutate a few fields to ensure they survive a save/load round trip.
	cfg1.Title = "Round Trip"
	cfg1.Panes[0].Position = "3,2"
	cfg1.Panes[0].AppColumns = 4
	cfg1.Panes[0].Apps[0].Position = "2,1"

	if err := s.Save(ctx, &cfg1); err != nil {
		t.Fatalf("save: %v", err)
	}

	cfg2, err := s.Load(ctx)
	if err != nil {
		t.Fatalf("reload: %v", err)
	}

	if cfg2.Title != "Round Trip" {
		t.Fatalf("title mismatch: %s", cfg2.Title)
	}
	if cfg2.Panes[0].Position != "3,2" {
		t.Fatalf("pane position mismatch: %s", cfg2.Panes[0].Position)
	}
	if cfg2.Panes[0].AppColumns != 4 {
		t.Fatalf("pane columns mismatch: %d", cfg2.Panes[0].AppColumns)
	}
	if cfg2.Panes[0].Apps[0].Position != "2,1" {
		t.Fatalf("app position mismatch: %s", cfg2.Panes[0].Apps[0].Position)
	}
}

