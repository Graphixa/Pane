package service

import (
	"context"

	"pane/internal/config"
	"pane/internal/store"
)

type ConfigService struct {
	store store.ConfigStore
}

func NewConfigService(store store.ConfigStore) *ConfigService {
	return &ConfigService{store: store}
}

func (s *ConfigService) Get(ctx context.Context) (config.DashboardConfig, error) {
	return s.store.Load(ctx)
}

func (s *ConfigService) Put(ctx context.Context, cfg config.DashboardConfig) error {
	return s.store.Save(ctx, &cfg)
}

