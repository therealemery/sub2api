package handler

import (
	"encoding/json"
	"strings"
	"testing"
	"time"

	"github.com/Wei-Shaw/sub2api/internal/config"
	"github.com/stretchr/testify/require"
)

func TestBuildWanJSONRequest(t *testing.T) {
	body, err := buildWanJSONRequest(map[string]any{
		"prompt": "A paper boat crosses the lake",
		"ratio":  "16:9", "audio": false, "seed": float64(7),
		"prompt_extend": false, "watermark": true,
		"reference_images": []any{"https://example.com/image.png"},
		"reference_videos": []any{"https://example.com/video.mp4"},
		"reference_audios": []any{"https://example.com/audio.mp3"},
	}, wanVideoModel, 5, "720P")
	require.NoError(t, err)
	var got map[string]any
	require.NoError(t, json.Unmarshal(body, &got))
	require.Equal(t, wanVideoModel, got["model"])
	input, ok := got["input"].(map[string]any)
	require.True(t, ok)
	require.Equal(t, "A paper boat crosses the lake", input["prompt"])
	media, ok := input["media"].([]any)
	require.True(t, ok)
	require.Len(t, media, 3)
	firstMedia, ok := media[0].(map[string]any)
	require.True(t, ok)
	require.Equal(t, "reference_image", firstMedia["type"])
	params := got["parameters"].(map[string]any)
	require.Equal(t, "720P", params["resolution"])
	require.Equal(t, float64(5), params["duration"])
	require.Equal(t, false, params["audio"])
	require.Equal(t, float64(7), params["seed"])
}

func TestBuildWanJSONRequestRejectsInvalidMediaCombinations(t *testing.T) {
	_, err := buildWanJSONRequest(map[string]any{"prompt": "x"}, "unknown", 5, "480P")
	require.ErrorContains(t, err, "unsupported video model")

	_, err = buildWanJSONRequest(map[string]any{
		"prompt": "x", "first_frame_image": "data:image/png;base64,abc",
		"reference_images": []any{"https://example.com/image.png"},
	}, wanVideoModel, 5, "480P")
	require.ErrorContains(t, err, "first/last frame")

	_, err = buildWanJSONRequest(map[string]any{"prompt": "x", "file": "https://example.com/a.pdf", "link": "https://example.com"}, wanVideoModel, 5, "480P")
	require.ErrorContains(t, err, "file and link")

	images := make([]any, 11)
	for i := range images {
		images[i] = "https://example.com/image.png"
	}
	_, err = buildWanJSONRequest(map[string]any{"prompt": "x", "reference_images": images}, wanVideoModel, 5, "480P")
	require.ErrorContains(t, err, "10 reference images")
}

func TestVideoUsageEndpointDoesNotRevealPrivateAdapterPath(t *testing.T) {
	require.Equal(t, "/v1/videos", videoUpstreamCreateEndpoint(videoAdapterDCAPI))
	require.Equal(t, "/v1/videos", videoUpstreamCreateEndpoint(videoAdapterAlibaba))
}

func TestImmediateH3FailureIsRejectedBeforeBilling(t *testing.T) {
	require.False(t, shouldBillVideoCreate(videoAdapterDCAPI, map[string]any{"status": "failed", "id": "private-task"}))
	require.True(t, shouldBillVideoCreate(videoAdapterDCAPI, map[string]any{"status": "queued", "id": "private-task"}))
	require.True(t, shouldBillVideoCreate(videoAdapterAlibaba, map[string]any{"status": "failed"}))
}

func TestSanitizedWanVideoResponse(t *testing.T) {
	upstream := map[string]any{"output": map[string]any{"task_status": "SUCCEEDED", "task_id": "private", "video_url": "https://private.example/video.mp4"}, "request_id": "private-request"}
	out := sanitizedVideoResponseForModel(nil, upstream, "video_public", wanVideoModel, videoAdapterAlibaba)
	require.Equal(t, "completed", out["status"])
	require.Equal(t, wanVideoModel, out["model"])
	encoded, err := json.Marshal(out)
	require.NoError(t, err)
	require.NotContains(t, string(encoded), "private.example")
	require.NotContains(t, string(encoded), "private-request")
}

func TestWanVideoPricingAndMinimumCharge(t *testing.T) {
	tests := []struct {
		model          string
		resolution     string
		customerPerSec float64
		upstreamPerSec float64
	}{
		{wanVideoModel, "480P", 0.0330048, 0.0246268657},
		{wanVideoModel, "720P", 0.0660104, 0.0492537313},
		{wanVideoModel, "1080P", 0.1320200, 0.0985074627},
		{wanVideoPrimeModel, "480P", 0.05088, 0.0436567164},
		{wanVideoPrimeModel, "720P", 0.1017592, 0.0873134328},
		{wanVideoPrimeModel, "1080P", 0.2035192, 0.1746268657},
	}
	for _, tt := range tests {
		t.Run(tt.model+"/"+tt.resolution, func(t *testing.T) {
			require.InDelta(t, tt.customerPerSec, wanCustomerPricesUSD[tt.model][tt.resolution], 1e-12)
			require.InDelta(t, tt.upstreamPerSec, wanUpstreamCostsUSD[tt.model][tt.resolution], 1e-12)
		})
	}

	// The paid smoke-test floor is a two-second standard 480P request.
	require.InDelta(t, 0.0660096, 2*wanCustomerPricesUSD[wanVideoModel]["480P"], 1e-12)
	require.InDelta(t, 0.0492537314, 2*wanUpstreamCostsUSD[wanVideoModel]["480P"], 1e-12)
}

func TestNormalizeH3Resolution(t *testing.T) {
	resolution, ok := normalizeH3Resolution(map[string]any{"resolution": "2K"})
	require.True(t, ok)
	require.Equal(t, "2k", resolution)

	resolution, ok = normalizeH3Resolution(map[string]any{"size": "768p"})
	require.True(t, ok)
	require.Equal(t, "768p", resolution)

	resolution, ok = normalizeH3Resolution(map[string]any{"size": "1440x2560"})
	require.True(t, ok)
	require.Equal(t, "2k", resolution)

	resolution, ok = normalizeH3Resolution(map[string]any{"size": "1024x768"})
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

func TestVideoUsageRequestIDFitsUsageLogColumn(t *testing.T) {
	publicTaskID := "video_" + strings.Repeat("opaque-task-token", 20)

	requestID := videoUsageRequestID(publicTaskID)

	require.Len(t, requestID, 64)
	require.Equal(t, requestID, videoUsageRequestID(publicTaskID))
	require.NotContains(t, requestID, publicTaskID)
	require.NotEqual(t, requestID, videoUsageRequestID(publicTaskID+"x"))
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
