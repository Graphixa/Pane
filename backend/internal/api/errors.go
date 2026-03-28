package api

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"pane/internal/config"
	"pane/internal/service"
)

// APIErrorBody is the JSON shape returned for failed requests.
type APIErrorBody struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Field   string `json:"field,omitempty"`
}

func writeJSONError(w http.ResponseWriter, status int, code, message, field string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(APIErrorBody{
		Code:    code,
		Message: message,
		Field:   field,
	})
}

// validationUserMessage strips the sentinel prefix from wrapped validation errors.
func validationUserMessage(err error) string {
	s := err.Error()
	prefix := config.ErrValidation.Error() + ": "
	if strings.HasPrefix(s, prefix) {
		return strings.TrimPrefix(s, prefix)
	}
	return s
}

// handleServiceError writes an appropriate JSON error and returns true if handled.
func handleServiceError(w http.ResponseWriter, err error) bool {
	if err == nil {
		return false
	}
	if errors.Is(err, config.ErrValidation) {
		writeJSONError(w, http.StatusBadRequest, "validation_failed", validationUserMessage(err), "")
		return true
	}
	if errors.Is(err, service.ErrNotFound) {
		msg := strings.TrimSpace(strings.TrimPrefix(err.Error(), service.ErrNotFound.Error()))
		msg = strings.TrimPrefix(msg, ":")
		msg = strings.TrimSpace(msg)
		if msg == "" {
			msg = "Resource not found"
		}
		writeJSONError(w, http.StatusNotFound, "not_found", msg, "")
		return true
	}
	return false
}
