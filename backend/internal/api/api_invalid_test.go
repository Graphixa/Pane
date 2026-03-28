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

func TestAPI_InvalidOperations(t *testing.T) {
	tmp := t.TempDir()
	path := filepath.Join(tmp, "config.yaml")
	cfgStore := store.NewFileStore(path, config.DefaultConfig)
	cfgService := service.NewConfigService(cfgStore)
	h := Router(cfgService)

	if _, err := cfgService.Get(context.Background()); err != nil {
		t.Fatalf("boot: %v", err)
	}

	t.Run("update pane with invalid position returns 400", func(t *testing.T) {
		body := []byte(`{"position":"not-a-coord"}`)
		req := httptest.NewRequest(http.MethodPut, "/api/panes/pane-1", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, req)

		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d: %s", rec.Code, rec.Body.String())
		}
		var out APIErrorBody
		if err := json.Unmarshal(rec.Body.Bytes(), &out); err != nil {
			t.Fatalf("decode: %v", err)
		}
		if out.Code != "validation_failed" {
			t.Fatalf("expected validation_failed code, got %q", out.Code)
		}
		if out.Message == "" {
			t.Fatalf("expected non-empty message")
		}
	})

	t.Run("update unknown pane returns 404", func(t *testing.T) {
		body := []byte(`{"position":"0,0"}`)
		req := httptest.NewRequest(http.MethodPut, "/api/panes/does-not-exist", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, req)

		if rec.Code != http.StatusNotFound {
			t.Fatalf("expected 404, got %d: %s", rec.Code, rec.Body.String())
		}
		var out APIErrorBody
		if err := json.Unmarshal(rec.Body.Bytes(), &out); err != nil {
			t.Fatalf("decode: %v", err)
		}
		if out.Code != "not_found" {
			t.Fatalf("expected not_found, got %q", out.Code)
		}
	})

	t.Run("delete unknown pane returns 404", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodDelete, "/api/panes/unknown-pane", nil)
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, req)

		if rec.Code != http.StatusNotFound {
			t.Fatalf("expected 404, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("update app columns below minimum returns 400", func(t *testing.T) {
		body := []byte(`{"appColumns":2}`)
		req := httptest.NewRequest(http.MethodPut, "/api/panes/pane-1", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, req)

		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d: %s", rec.Code, rec.Body.String())
		}
	})
}
