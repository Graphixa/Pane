package config

import (
	"errors"
	"fmt"
)

var ErrValidation = errors.New("config validation error")

func ValidateConfig(cfg *DashboardConfig) error {
	if cfg == nil {
		return fmt.Errorf("%w: nil config", ErrValidation)
	}
	if cfg.Version != 1 && cfg.Version != 0 {
		// Allow 0 while bootstrapping, but prefer 1.
		return fmt.Errorf("%w: unsupported version %d", ErrValidation, cfg.Version)
	}
	if cfg.Title == "" {
		return fmt.Errorf("%w: title is required", ErrValidation)
	}
	if err := validateLayout(cfg.Layout); err != nil {
		return err
	}
	for i := range cfg.Panes {
		p := &cfg.Panes[i]
		if p.ID == "" {
			return fmt.Errorf("%w: pane[%d].id is required", ErrValidation, i)
		}
		if p.Label == "" {
			return fmt.Errorf("%w: pane[%d].label is required", ErrValidation, i)
		}
		if _, _, err := ParseCoordPair(p.Position); err != nil {
			return fmt.Errorf("%w: pane[%d].position: %w", ErrValidation, i, err)
		}
		if p.AppColumns < 3 {
			return fmt.Errorf("%w: pane[%d].appColumns must be >= 3", ErrValidation, i)
		}
		if p.AppRows < 1 {
			return fmt.Errorf("%w: pane[%d].appRows must be >= 1", ErrValidation, i)
		}

		for j := range p.Apps {
			a := &p.Apps[j]
			if a.ID == "" {
				return fmt.Errorf("%w: pane[%d].apps[%d].id is required", ErrValidation, i, j)
			}
			if a.Name == "" {
				return fmt.Errorf("%w: pane[%d].apps[%d].name is required", ErrValidation, i, j)
			}
			if _, _, err := ParseCoordPair(a.Position); err != nil {
				return fmt.Errorf("%w: pane[%d].apps[%d].position: %w", ErrValidation, i, j, err)
			}
			if a.URL == "" {
				return fmt.Errorf("%w: pane[%d].apps[%d].url is required", ErrValidation, i, j)
			}
			if a.Icon == "" {
				// icon is required by the UI; allow empty for now to avoid hard failures.
				// Later we can validate against the icon index.
			}
		}
	}
	return nil
}

const (
	layoutWidthMin       = 640
	layoutMaxWidthMax    = 4000
	layoutCustomWidthMax = 5000
)

func validateLayout(l Layout) error {
	if l.WidthMode != "" && l.WidthMode != WidthModePreset && l.WidthMode != WidthModeCustom && l.WidthMode != WidthModeFull {
		return fmt.Errorf("%w: layout.widthMode must be preset, custom, or full", ErrValidation)
	}
	if l.MaxWidth != nil {
		if *l.MaxWidth < layoutWidthMin || *l.MaxWidth > layoutMaxWidthMax {
			return fmt.Errorf("%w: layout.maxWidth must be between %d and %d", ErrValidation, layoutWidthMin, layoutMaxWidthMax)
		}
	}
	if l.CustomWidth != nil {
		if *l.CustomWidth < layoutWidthMin || *l.CustomWidth > layoutCustomWidthMax {
			return fmt.Errorf("%w: layout.customWidth must be between %d and %d", ErrValidation, layoutWidthMin, layoutCustomWidthMax)
		}
	}
	return nil
}

