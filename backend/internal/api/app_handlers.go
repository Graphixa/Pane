package api

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"

	"pane/internal/config"
	"pane/internal/service"
)

func postAppHandler(cfgService *service.ConfigService) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		paneID := chi.URLParam(r, "id")
		var req config.AppConfig
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeJSONError(w, http.StatusBadRequest, "invalid_json", "Invalid JSON body", "")
			return
		}

		cfg, err := cfgService.CreateApp(r.Context(), paneID, req)
		if err != nil {
			if handleServiceError(w, err) {
				return
			}
			writeJSONError(w, http.StatusInternalServerError, "internal_error", "Failed to create app", "")
			return
		}

		_ = json.NewEncoder(w).Encode(cfg)
	})
}

func putAppHandler(cfgService *service.ConfigService) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		paneID := chi.URLParam(r, "paneId")
		appID := chi.URLParam(r, "appId")

		var req config.AppConfig
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeJSONError(w, http.StatusBadRequest, "invalid_json", "Invalid JSON body", "")
			return
		}

		cfg, err := cfgService.UpdateApp(r.Context(), paneID, appID, req)
		if err != nil {
			if handleServiceError(w, err) {
				return
			}
			writeJSONError(w, http.StatusInternalServerError, "internal_error", "Failed to update app", "")
			return
		}

		_ = json.NewEncoder(w).Encode(cfg)
	})
}

func deleteAppHandler(cfgService *service.ConfigService) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		paneID := chi.URLParam(r, "paneId")
		appID := chi.URLParam(r, "appId")

		cfg, err := cfgService.DeleteApp(r.Context(), paneID, appID)
		if err != nil {
			if handleServiceError(w, err) {
				return
			}
			writeJSONError(w, http.StatusInternalServerError, "internal_error", "Failed to delete app", "")
			return
		}

		_ = json.NewEncoder(w).Encode(cfg)
	})
}

