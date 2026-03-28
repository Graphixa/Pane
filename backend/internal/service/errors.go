package service

import "errors"

// ErrNotFound indicates the requested pane or app does not exist.
var ErrNotFound = errors.New("not found")
