package config

import (
	"fmt"
	"regexp"
	"strconv"
	"strings"
)

var coordPairRe = regexp.MustCompile(`^\s*(\d+),(\d+)\s*$`)

// ParseCoordPair parses "x,y" or "col,row" into integers.
func ParseCoordPair(value string) (int, int, error) {
	m := coordPairRe.FindStringSubmatch(strings.TrimSpace(value))
	if m == nil {
		return 0, 0, fmt.Errorf("invalid coordinate format: %q", value)
	}

	x, err := strconv.Atoi(m[1])
	if err != nil {
		return 0, 0, fmt.Errorf("invalid coordinate x: %w", err)
	}
	y, err := strconv.Atoi(m[2])
	if err != nil {
		return 0, 0, fmt.Errorf("invalid coordinate y: %w", err)
	}
	return x, y, nil
}

func FormatCoordPair(x, y int) string {
	return fmt.Sprintf("%d,%d", x, y)
}

