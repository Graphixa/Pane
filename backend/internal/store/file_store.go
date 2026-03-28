package store

import (
	"context"
	"errors"
	"fmt"
	"os"
	"path/filepath"

	"pane/internal/config"

	"gopkg.in/yaml.v3"
)

type ConfigStore interface {
	Load(ctx context.Context) (config.DashboardConfig, error)
	Save(ctx context.Context, cfg *config.DashboardConfig) error
}

type FileStore struct {
	path     string
	defaults func() config.DashboardConfig
}

func NewFileStore(path string, defaults func() config.DashboardConfig) *FileStore {
	return &FileStore{
		path:     path,
		defaults: defaults,
	}
}

func (s *FileStore) Load(ctx context.Context) (config.DashboardConfig, error) {
	_ = ctx
	data, err := os.ReadFile(s.path)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			cfg := s.defaults()
			if err := config.ValidateConfig(&cfg); err != nil {
				return config.DashboardConfig{}, err
			}
			out, marshalErr := yaml.Marshal(cfg)
			if marshalErr != nil {
				return config.DashboardConfig{}, fmt.Errorf("marshal default YAML: %w", marshalErr)
			}
			if writeErr := atomicWriteFile(s.path, out, 0o644); writeErr != nil {
				return config.DashboardConfig{}, fmt.Errorf("persist default config: %w", writeErr)
			}
			return cfg, nil
		}
		return config.DashboardConfig{}, fmt.Errorf("read config: %w", err)
	}

	var cfg config.DashboardConfig
	if err := yaml.Unmarshal(data, &cfg); err != nil {
		return config.DashboardConfig{}, fmt.Errorf("parse YAML: %w", err)
	}
	if err := config.ValidateConfig(&cfg); err != nil {
		return config.DashboardConfig{}, err
	}

	return cfg, nil
}

func (s *FileStore) Save(ctx context.Context, cfg *config.DashboardConfig) error {
	_ = ctx
	if err := config.ValidateConfig(cfg); err != nil {
		return err
	}

	out, err := yaml.Marshal(cfg)
	if err != nil {
		return fmt.Errorf("marshal YAML: %w", err)
	}

	return atomicWriteFile(s.path, out, 0o644)
}

func atomicWriteFile(path string, data []byte, perm os.FileMode) error {
	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return fmt.Errorf("mkdir %s: %w", dir, err)
	}

	tmp, err := os.CreateTemp(dir, filepath.Base(path)+".tmp-*")
	if err != nil {
		return fmt.Errorf("create temp: %w", err)
	}
	tmpName := tmp.Name()

	// Ensure temp cleanup even if we return early.
	defer func() { _ = os.Remove(tmpName) }()

	if _, err := tmp.Write(data); err != nil {
		_ = tmp.Close()
		return fmt.Errorf("write temp: %w", err)
	}
	if err := tmp.Chmod(perm); err != nil {
		_ = tmp.Close()
		return fmt.Errorf("chmod temp: %w", err)
	}
	if err := tmp.Close(); err != nil {
		return fmt.Errorf("close temp: %w", err)
	}

	return os.Rename(tmpName, path)
}

