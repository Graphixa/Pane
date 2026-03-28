package service

import (
	"context"
	"fmt"

	"pane/internal/config"
)

func (s *ConfigService) CreateApp(ctx context.Context, paneId string, app config.AppConfig) (config.DashboardConfig, error) {
	cfg, err := s.store.Load(ctx)
	if err != nil {
		return config.DashboardConfig{}, err
	}

	if app.ID == "" {
		return config.DashboardConfig{}, fmt.Errorf("%w: app.id is required", config.ErrValidation)
	}
	if app.Name == "" {
		return config.DashboardConfig{}, fmt.Errorf("%w: app.name is required", config.ErrValidation)
	}
	if app.Position == "" {
		app.Position = "0,0"
	}
	if app.URL == "" {
		return config.DashboardConfig{}, fmt.Errorf("%w: app.url is required", config.ErrValidation)
	}

	found := false
	for i := range cfg.Panes {
		if cfg.Panes[i].ID != paneId {
			continue
		}
		found = true
		cfg.Panes[i].Apps = append(cfg.Panes[i].Apps, app)
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

func (s *ConfigService) UpdateApp(ctx context.Context, paneId string, appId string, patch config.AppConfig) (config.DashboardConfig, error) {
	cfg, err := s.store.Load(ctx)
	if err != nil {
		return config.DashboardConfig{}, err
	}

	foundPane := false
	foundApp := false
	for i := range cfg.Panes {
		if cfg.Panes[i].ID != paneId {
			continue
		}
		foundPane = true
		for j := range cfg.Panes[i].Apps {
			if cfg.Panes[i].Apps[j].ID != appId {
				continue
			}
			foundApp = true
			if patch.Name != "" {
				cfg.Panes[i].Apps[j].Name = patch.Name
			}
			if patch.Position != "" {
				cfg.Panes[i].Apps[j].Position = patch.Position
			}
			if patch.URL != "" {
				cfg.Panes[i].Apps[j].URL = patch.URL
			}
			if patch.Icon != "" {
				cfg.Panes[i].Apps[j].Icon = patch.Icon
			}
			if patch.IconStyle != nil {
				cfg.Panes[i].Apps[j].IconStyle = patch.IconStyle
			}
			if patch.IconColor != nil {
				cfg.Panes[i].Apps[j].IconColor = patch.IconColor
			}
			if patch.OpenInNewTab != nil {
				cfg.Panes[i].Apps[j].OpenInNewTab = patch.OpenInNewTab
			}
			break
		}
		break
	}
	if !foundPane {
		return config.DashboardConfig{}, fmt.Errorf("%w: pane %s", ErrNotFound, paneId)
	}
	if !foundApp {
		return config.DashboardConfig{}, fmt.Errorf("%w: app %s", ErrNotFound, appId)
	}

	if err := config.ValidateConfig(&cfg); err != nil {
		return config.DashboardConfig{}, err
	}
	if err := s.store.Save(ctx, &cfg); err != nil {
		return config.DashboardConfig{}, err
	}
	return cfg, nil
}

func (s *ConfigService) DeleteApp(ctx context.Context, paneId string, appId string) (config.DashboardConfig, error) {
	cfg, err := s.store.Load(ctx)
	if err != nil {
		return config.DashboardConfig{}, err
	}

	foundPane := false
	for i := range cfg.Panes {
		if cfg.Panes[i].ID != paneId {
			continue
		}
		foundPane = true
		var hadApp bool
		for _, a := range cfg.Panes[i].Apps {
			if a.ID == appId {
				hadApp = true
				break
			}
		}
		if !hadApp {
			return config.DashboardConfig{}, fmt.Errorf("%w: app %s", ErrNotFound, appId)
		}
		nextApps := make([]config.AppConfig, 0, len(cfg.Panes[i].Apps))
		for _, a := range cfg.Panes[i].Apps {
			if a.ID == appId {
				continue
			}
			nextApps = append(nextApps, a)
		}
		cfg.Panes[i].Apps = nextApps
		break
	}
	if !foundPane {
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

