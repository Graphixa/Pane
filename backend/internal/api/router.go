package api

import (
	"net/http"

	"github.com/go-chi/chi/v5"

	"pane/internal/service"
)

func Router(cfgService *service.ConfigService) http.Handler {
	r := chi.NewRouter()

	r.Get("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"ok":true}`))
	})

	r.Get("/api/config", getConfigHandler(cfgService).ServeHTTP)
	r.Put("/api/config", putConfigHandler(cfgService).ServeHTTP)

	// Pane endpoints
	r.Post("/api/panes", postPaneHandler(cfgService).ServeHTTP)
	r.Put("/api/panes/{id}", putPaneHandler(cfgService).ServeHTTP)
	r.Delete("/api/panes/{id}", deletePaneHandler(cfgService).ServeHTTP)

	// App endpoints
	r.Post("/api/panes/{id}/apps", postAppHandler(cfgService).ServeHTTP)
	r.Put("/api/panes/{paneId}/apps/{appId}", putAppHandler(cfgService).ServeHTTP)
	r.Delete("/api/panes/{paneId}/apps/{appId}", deleteAppHandler(cfgService).ServeHTTP)

	return r
}

