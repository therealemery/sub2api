package handler

import (
	"encoding/base64"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/Wei-Shaw/sub2api/internal/config"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/require"
)

func newVideoInputTestHandler(t *testing.T) *GatewayHandler {
	t.Helper()
	return &GatewayHandler{cfg: &config.Config{
		JWT:     config.JWTConfig{Secret: strings.Repeat("s", 32)},
		Pricing: config.PricingConfig{DataDir: t.TempDir()},
		Server:  config.ServerConfig{FrontendURL: "https://ownapi.dev"},
	}}
}

func TestVideoInputTokenAndPublicDownload(t *testing.T) {
	gin.SetMode(gin.TestMode)
	tests := []struct {
		name      string
		field     string
		mimeType  string
		data      []byte
		useUpload bool
	}{
		{"video data URI", "reference_videos", "video/mp4", append([]byte{0, 0, 0, 12}, []byte("ftypisom")...), false},
		{"video upload", "reference_videos", "video/mp4", append([]byte{0, 0, 0, 12}, []byte("ftypisom")...), true},
		{"audio data URI", "reference_audios", "audio/mpeg", []byte("ID3audio"), false},
		{"audio upload", "reference_audios", "audio/mpeg", []byte("ID3audio"), true},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			h := newVideoInputTestHandler(t)
			recorder := httptest.NewRecorder()
			ctx, _ := gin.CreateTestContext(recorder)
			ctx.Request = httptest.NewRequest(http.MethodPost, "http://internal/v1/videos", nil)

			value := h3MediaValue{Text: "data:" + test.mimeType + ";base64," + base64.StdEncoding.EncodeToString(test.data)}
			if test.useUpload {
				uploadPath := filepath.Join(t.TempDir(), "reference")
				require.NoError(t, os.WriteFile(uploadPath, test.data, 0o600))
				value = h3MediaValue{Upload: &h3UploadedMedia{Path: uploadPath, MIME: test.mimeType, Name: "reference", Size: int64(len(test.data))}}
			}
			publicURL, path, err := h.storeVideoInput(ctx, test.field, value)
			require.NoError(t, err)
			require.Equal(t, "https://ownapi.dev/v1/video-inputs/", publicURL[:len("https://ownapi.dev/v1/video-inputs/")])
			info, err := os.Stat(path)
			require.NoError(t, err)
			require.Equal(t, os.FileMode(0o600), info.Mode().Perm())
			require.NotContains(t, publicURL, filepath.Base(path))

			token := strings.TrimPrefix(publicURL, "https://ownapi.dev/v1/video-inputs/")
			download := httptest.NewRecorder()
			downloadCtx, _ := gin.CreateTestContext(download)
			downloadCtx.Params = gin.Params{{Key: "token", Value: token}}
			downloadCtx.Request = httptest.NewRequest(http.MethodGet, "/v1/video-inputs/"+token, nil)
			h.VideoInputContent(downloadCtx)
			require.Equal(t, http.StatusOK, download.Code)
			require.Equal(t, test.mimeType, download.Header().Get("Content-Type"))
			require.Equal(t, "private, max-age=3600", download.Header().Get("Cache-Control"))
			require.Equal(t, test.data, download.Body.Bytes())
		})
	}
}

func TestVideoInputDownloadRejectsTamperedExpiredAndUnsafeTokens(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := newVideoInputTestHandler(t)

	for _, envelope := range []videoInputEnvelope{
		{File: "missing", MIME: "video/mp4", Size: 12, ExpiresAt: time.Now().Add(-time.Minute).Unix()},
		{File: "../config.yaml", MIME: "video/mp4", Size: 12, ExpiresAt: time.Now().Add(time.Hour).Unix()},
	} {
		token, err := h.sealVideoInput(envelope)
		require.NoError(t, err)
		recorder := httptest.NewRecorder()
		ctx, _ := gin.CreateTestContext(recorder)
		ctx.Params = gin.Params{{Key: "token", Value: token}}
		ctx.Request = httptest.NewRequest(http.MethodGet, "/v1/video-inputs/"+token, nil)
		h.VideoInputContent(ctx)
		require.Equal(t, http.StatusNotFound, ctx.Writer.Status())
	}

	token, err := h.sealVideoInput(videoInputEnvelope{File: "missing", MIME: "video/mp4", Size: 12, ExpiresAt: time.Now().Add(time.Hour).Unix()})
	require.NoError(t, err)
	tampered := token[:len(token)-1] + "x"
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Params = gin.Params{{Key: "token", Value: tampered}}
	ctx.Request = httptest.NewRequest(http.MethodGet, "/v1/video-inputs/"+tampered, nil)
	h.VideoInputContent(ctx)
	require.Equal(t, http.StatusNotFound, ctx.Writer.Status())
}

func TestVideoInputBaseURLRejectsUnconfiguredHostHeader(t *testing.T) {
	h := newVideoInputTestHandler(t)
	h.cfg.Server.FrontendURL = ""
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodPost, "https://attacker.example/v1/videos", nil)

	_, err := h.videoInputBaseURL(ctx)

	require.ErrorContains(t, err, "unavailable")
}
