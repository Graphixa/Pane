package config

// DefaultConfig provides an initial dashboard for first run.
func DefaultConfig() DashboardConfig {
	maxW := 1200
	return DashboardConfig{
		Version: 1,
		Title:   "Dashboard",
		Layout: Layout{
			WidthMode:  WidthModePreset,
			MaxWidth:   &maxW,
			CustomWidth: nil,
		},
		AppLayout: AppLayout{
			Size: TileSizeMedium,
		},
		Appearance: Appearance{
			Accent:     "#3B82F6",
			Background: "#0F1115",
		},
		Panes: []PaneConfig{
			{
				ID:         "pane-1",
				Label:      "My Apps",
				Position:   "0,0",
				AppColumns: 3,
				AppRows:    1,
				Apps: []AppConfig{
					{
						ID:       "drive",
						Name:     "Google Drive",
						Position: "1,0",
						URL:      "https://drive.google.com",
						Icon:     "google-drive",
					},
				},
			},
		},
	}
}

