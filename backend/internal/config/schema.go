package config

// These types intentionally match the YAML schema in the developer specification.

type WidthMode string

const (
	WidthModePreset WidthMode = "preset"
	WidthModeCustom WidthMode = "custom"
	WidthModeFull   WidthMode = "full"
)

type TileSizePreset string

const (
	TileSizeSmall  TileSizePreset = "small"
	TileSizeMedium TileSizePreset = "medium"
	TileSizeLarge  TileSizePreset = "large"
)

type DashboardConfig struct {
	Version   int    `yaml:"version" json:"version"`
	Title     string `yaml:"title" json:"title"`
	Layout    Layout `yaml:"layout" json:"layout"`
	AppLayout AppLayout `yaml:"appLayout" json:"appLayout"`
	Appearance Appearance `yaml:"appearance" json:"appearance"`
	Panes      []PaneConfig `yaml:"panes" json:"panes"`
}

type Layout struct {
	WidthMode  WidthMode `yaml:"widthMode" json:"widthMode"`
	MaxWidth   *int      `yaml:"maxWidth,omitempty" json:"maxWidth,omitempty"`
	CustomWidth *int     `yaml:"customWidth,omitempty" json:"customWidth,omitempty"`
}

type AppLayout struct {
	Size TileSizePreset `yaml:"size" json:"size"`
}

type Appearance struct {
	Accent     string `yaml:"accent" json:"accent"`
	Background string `yaml:"background" json:"background"`
}

type PaneConfig struct {
	ID          string    `yaml:"id" json:"id"`
	Label       string    `yaml:"label" json:"label"`
	Position    string    `yaml:"position" json:"position"` // "x,y"
	AppColumns  int       `yaml:"appColumns" json:"appColumns"`
	AppRows     int       `yaml:"appRows" json:"appRows"`
	Apps        []AppConfig `yaml:"apps" json:"apps"`
}

type AppConfig struct {
	ID        string `yaml:"id" json:"id"`
	Name      string `yaml:"name" json:"name"`
	Position  string `yaml:"position" json:"position"` // "col,row"
	URL       string `yaml:"url" json:"url"`
	Icon      string `yaml:"icon" json:"icon"`
	IconStyle *string `yaml:"iconStyle,omitempty" json:"iconStyle,omitempty"`
	IconColor *string `yaml:"iconColor,omitempty" json:"iconColor,omitempty"`
	OpenInNewTab *bool `yaml:"openInNewTab,omitempty" json:"openInNewTab,omitempty"`
}

