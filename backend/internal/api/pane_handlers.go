package api

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"

	"pane/internal/config"
	"pane/internal/service"
)

func postPaneHandler(cfgService *service.ConfigService) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		var req config.PaneConfig
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeJSONError(w, http.StatusBadRequest, "invalid_json", "Invalid JSON body", "")
			return
		}

		cfg, err := cfgService.CreatePane(r.Context(), req)
		if err != nil {
			if handleServiceError(w, err) {
				return
			}
			writeJSONError(w, http.StatusInternalServerError, "internal_error", "Failed to create pane", "")
			return
		}

		_ = json.NewEncoder(w).Encode(cfg)
	})
}

func putPaneHandler(cfgService *service.ConfigService) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		id := chi.URLParam(r, "id")
		var req config.PaneConfig
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeJSONError(w, http.StatusBadRequest, "invalid_json", "Invalid JSON body", "")
			return
		}

		cfg, err := cfgService.UpdatePane(r.Context(), id, req)
		if err != nil {
			if handleServiceError(w, err) {
				return
			}
			writeJSONError(w, http.StatusInternalServerError, "internal_error", "Failed to update pane", "")
			return
		}

		_ = json.NewEncoder(w).Encode(cfg)
	})
}

func deletePaneHandler(cfgService *service.ConfigService) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		id := chi.URLParam(r, "id")
		cfg, err := cfgService.DeletePane(r.Context(), id)
		if err != nil {
			if handleServiceError(w, err) {
				return
			}
			writeJSONError(w, http.StatusInternalServerError, "internal_error", "Failed to delete pane", "")
			return
		}

		_ = json.NewEncoder(w).Encode(cfg)
	})
}

