package service

import (
	"context"
	"fmt"

	"pane/internal/config"
)

func (s *ConfigService) CreatePane(ctx context.Context, pane config.PaneConfig) (config.DashboardConfig, error) {
	cfg, err := s.store.Load(ctx)
	if err != nil {
		return config.DashboardConfig{}, err
	}

	if pane.ID == "" {
		return config.DashboardConfig{}, fmt.Errorf("%w: pane.id is required", config.ErrValidation)
	}
	if pane.Label == "" {
		return config.DashboardConfig{}, fmt.Errorf("%w: pane.label is required", config.ErrValidation)
	}
	if pane.Position == "" {
		pane.Position = "0,0"
	}
	if pane.AppColumns == 0 {
		pane.AppColumns = 3
	}
	if pane.AppRows == 0 {
		pane.AppRows = 1
	}

	cfg.Panes = append(cfg.Panes, pane)
	if err := config.ValidateConfig(&cfg); err != nil {
		return config.DashboardConfig{}, err
	}
	if err := s.store.Save(ctx, &cfg); err != nil {
		return config.DashboardConfig{}, err
	}
	return cfg, nil
}

func (s *ConfigService) UpdatePane(ctx context.Context, paneId string, patch config.PaneConfig) (config.DashboardConfig, error) {
	cfg, err := s.store.Load(ctx)
	if err != nil {
		return config.DashboardConfig{}, err
	}

	found := false
	for i := range cfg.Panes {
		if cfg.Panes[i].ID != paneId {
			continue
		}
		found = true
		// Patch only the fields we allow updates for v1.
		if patch.Label != "" {
			cfg.Panes[i].Label = patch.Label
		}
		if patch.Position != "" {
			cfg.Panes[i].Position = patch.Position
		}
		if patch.AppColumns != 0 {
			cfg.Panes[i].AppColumns = patch.AppColumns
		}
		if patch.AppRows != 0 {
			cfg.Panes[i].AppRows = patch.AppRows
		}
		break
	}
	if !found {
		return config.DashboardConfig{}, fmt.Errorf("%w: pane %s", ErrNotFound, paneId)
	}

	if err := config.ValidateConfig(&cfg); err != nil {
		return config.DashboardConfig{}, err
	}
	if err := s.store.Save(ctx, &cfg); err != nil {
		return config.DashboardConfig{}, err
	}
	return cfg, nil
}

func (s *ConfigService) DeletePane(ctx context.Context, paneId string) (config.DashboardConfig, error) {
	cfg, err := s.store.Load(ctx)
	if err != nil {
		return config.DashboardConfig{}, err
	}

	var had bool
	for _, p := range cfg.Panes {
		if p.ID == paneId {
			had = true
			break
		}
	}
	if !had {
		return config.DashboardConfig{}, fmt.Errorf("%w: pane %s", ErrNotFound, paneId)
	}

	next := make([]config.PaneConfig, 0, len(cfg.Panes))
	for _, p := range cfg.Panes {
		if p.ID == paneId {
			continue
		}
		next = append(next, p)
	}
	cfg.Panes = next

	if err := config.ValidateConfig(&cfg); err != nil {
		return config.DashboardConfig{}, err
	}
	if err := s.store.Save(ctx, &cfg); err != nil {
		return config.DashboardConfig{}, err
	}
	return cfg, nil
}

