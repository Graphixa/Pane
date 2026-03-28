package api

import (
	"encoding/json"
	"net/http"

	"pane/internal/config"
	"pane/internal/service"
)

type getConfig struct {
	cfgService *service.ConfigService
}

func getConfigHandler(cfgService *service.ConfigService) http.Handler {
	return &getConfig{cfgService: cfgService}
}

func (h *getConfig) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	cfg, err := h.cfgService.Get(r.Context())
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, "internal_error", "Failed to load config", "")
		return
	}

	enc := json.NewEncoder(w)
	enc.SetEscapeHTML(true)
	_ = enc.Encode(cfg)
}

type putConfig struct {
	cfgService *service.ConfigService
}

func putConfigHandler(cfgService *service.ConfigService) http.Handler {
	return &putConfig{cfgService: cfgService}
}

func (h *putConfig) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var req config.DashboardConfig
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid_json", "Invalid JSON body", "")
		return
	}

	if err := h.cfgService.Put(r.Context(), req); err != nil {
		if handleServiceError(w, err) {
			return
		}
		writeJSONError(w, http.StatusInternalServerError, "internal_error", "Failed to persist config", "")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

