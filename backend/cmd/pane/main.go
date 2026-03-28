package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"pane/internal/api"
	"pane/internal/config"
	"pane/internal/service"
	"pane/internal/store"
)

func main() {
	ctx := context.Background()

	addr := getEnv("PANE_ADDR", ":8080")
	configPath := getEnv("PANE_CONFIG_PATH", "./config.yaml")

	// Backend is authoritative for config persistence; frontend derives layout at render time.
	fileStore := store.NewFileStore(configPath, config.DefaultConfig)
	cfgService := service.NewConfigService(fileStore)

	srv := &http.Server{
		Addr:              addr,
		Handler:           api.Router(cfgService),
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      10 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	// Validate config on boot so operators find issues early.
	if _, err := cfgService.Get(ctx); err != nil {
		log.Fatalf("failed to load config: %v", err)
	}

	log.Printf("Pane API listening on %s (config: %s)", addr, configPath)
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("server error: %v", err)
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

