package api

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"testing"

	"pane/internal/config"
	"pane/internal/service"
	"pane/internal/store"
)

func TestAPI_PaneAndAppEndpoints(t *testing.T) {
	tmp := t.TempDir()
	path := filepath.Join(tmp, "config.yaml")

	cfgStore := store.NewFileStore(path, config.DefaultConfig)
	cfgService := service.NewConfigService(cfgStore)
	h := Router(cfgService)

	// Ensure default exists.
	if _, err := cfgService.Get(context.Background()); err != nil {
		t.Fatalf("boot config: %v", err)
	}

	t.Run("update pane position", func(t *testing.T) {
		body := []byte(`{"position":"1,0"}`)
		req := httptest.NewRequest(http.MethodPut, "/api/panes/pane-1", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
		}
		var out config.DashboardConfig
		if err := json.Unmarshal(rec.Body.Bytes(), &out); err != nil {
			t.Fatalf("decode: %v", err)
		}
		if out.Panes[0].Position != "1,0" {
			t.Fatalf("expected position updated, got %s", out.Panes[0].Position)
		}
	})

	t.Run("update app position (move)", func(t *testing.T) {
		body := []byte(`{"position":"2,1"}`)
		req := httptest.NewRequest(http.MethodPut, "/api/panes/pane-1/apps/drive", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
		}
		var out config.DashboardConfig
		if err := json.Unmarshal(rec.Body.Bytes(), &out); err != nil {
			t.Fatalf("decode: %v", err)
		}
		got := out.Panes[0].Apps[0].Position
		if got != "2,1" {
			t.Fatalf("expected app moved to 2,1, got %s", got)
		}
	})

	t.Run("delete app", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodDelete, "/api/panes/pane-1/apps/drive", nil)
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
		}
		var out config.DashboardConfig
		if err := json.Unmarshal(rec.Body.Bytes(), &out); err != nil {
			t.Fatalf("decode: %v", err)
		}
		if len(out.Panes[0].Apps) != 0 {
			t.Fatalf("expected app deleted, got %d apps", len(out.Panes[0].Apps))
		}
	})

	t.Run("delete pane", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodDelete, "/api/panes/pane-1", nil)
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
		}
		var out config.DashboardConfig
		if err := json.Unmarshal(rec.Body.Bytes(), &out); err != nil {
			t.Fatalf("decode: %v", err)
		}
		if len(out.Panes) != 0 {
			t.Fatalf("expected pane deleted, got %d panes", len(out.Panes))
		}
	})
}

