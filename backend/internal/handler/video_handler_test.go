package handler

import (
	"strings"
	"testing"
	"time"

	"github.com/Wei-Shaw/sub2api/internal/config"
	"github.com/stretchr/testify/require"
)

func TestNormalizeH3Resolution(t *testing.T) {
	resolution, ok := normalizeH3Resolution(map[string]any{"resolution": "2K"})
	require.True(t, ok)
	require.Equal(t, "2k", resolution)

	resolution, ok = normalizeH3Resolution(map[string]any{"size": "768p"})
	require.True(t, ok)
	require.Equal(t, "768p", resolution)

	_, ok = normalizeH3Resolution(map[string]any{"resolution": "1080p"})
	require.False(t, ok)
}

func TestVideoTaskIDIsOpaqueAndAuthenticated(t *testing.T) {
	h := &GatewayHandler{cfg: &config.Config{JWT: config.JWTConfig{Secret: strings.Repeat("s", 32)}}}
	want := videoTaskEnvelope{
		UpstreamID: "task_private_upstream_id",
		AccountID:  42,
		UserID:     7,
		Model:      miniMaxH3Model,
		ExpiresAt:  time.Now().Add(time.Hour).Unix(),
	}

	taskID, err := h.sealVideoTask(want)
	require.NoError(t, err)
	require.NotContains(t, taskID, want.UpstreamID)
	require.NotContains(t, taskID, miniMaxH3Model)

	got, err := h.openVideoTask(taskID)
	require.NoError(t, err)
	require.Equal(t, want, *got)

	_, err = h.openVideoTask(taskID[:len(taskID)-1] + "x")
	require.Error(t, err)
}

func TestPositiveWholeNumber(t *testing.T) {
	value, ok := positiveWholeNumber(float64(5))
	require.True(t, ok)
	require.Equal(t, 5, value)
	for _, invalid := range []any{0.0, -1.0, 1.5, "5", float64(3601)} {
		_, ok := positiveWholeNumber(invalid)
		require.False(t, ok)
	}
}
