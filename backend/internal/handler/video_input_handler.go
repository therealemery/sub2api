package handler

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

const (
	videoInputTTL          = time.Hour
	videoInputCleanupGrace = time.Hour
	videoInputTokenPrefix  = "input_"
	videoInputTokenAAD     = "ownapi-video-input-v1"
)

type videoInputEnvelope struct {
	File      string `json:"f"`
	MIME      string `json:"m"`
	Size      int64  `json:"s"`
	ExpiresAt int64  `json:"e"`
}

// VideoInputContent serves a short-lived, opaque media URL used only by the
// private H3 upstream. The encrypted token is the authorization boundary.
func (h *GatewayHandler) VideoInputContent(c *gin.Context) {
	envelope, err := h.openVideoInput(c.Param("token"))
	if err != nil || envelope.ExpiresAt < time.Now().Unix() || envelope.Size <= 0 {
		if err == nil {
			if path, pathErr := safeVideoInputPath(h.videoInputDir(), envelope.File); pathErr == nil {
				_ = os.Remove(path)
			}
		}
		c.Status(http.StatusNotFound)
		return
	}
	path, err := safeVideoInputPath(h.videoInputDir(), envelope.File)
	if err != nil {
		c.Status(http.StatusNotFound)
		return
	}
	file, err := os.Open(path)
	if err != nil {
		c.Status(http.StatusNotFound)
		return
	}
	defer func() { _ = file.Close() }()
	info, err := file.Stat()
	if err != nil || !info.Mode().IsRegular() || info.Size() != envelope.Size {
		c.Status(http.StatusNotFound)
		return
	}
	c.Header("Content-Type", envelope.MIME)
	c.Header("Content-Length", strconv.FormatInt(envelope.Size, 10))
	c.Header("Cache-Control", "private, max-age=3600")
	c.Header("X-Content-Type-Options", "nosniff")
	http.ServeContent(c.Writer, c.Request, envelope.File, info.ModTime(), file)
}

func (h *GatewayHandler) storeVideoInput(c *gin.Context, field string, value h3MediaValue) (string, string, error) {
	if field != "reference_videos" && field != "reference_audios" {
		return "", "", fmt.Errorf("unsupported temporary video input")
	}
	dir := h.videoInputDir()
	if err := os.MkdirAll(dir, 0o700); err != nil {
		return "", "", fmt.Errorf("unable to prepare uploaded media")
	}
	h.cleanupExpiredVideoInputs(time.Now())

	randomName := make([]byte, 24)
	if _, err := rand.Read(randomName); err != nil {
		return "", "", fmt.Errorf("unable to prepare uploaded media")
	}
	name := hex.EncodeToString(randomName)
	path, err := safeVideoInputPath(dir, name)
	if err != nil {
		return "", "", fmt.Errorf("unable to prepare uploaded media")
	}
	output, err := os.OpenFile(path, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0o600)
	if err != nil {
		return "", "", fmt.Errorf("unable to prepare uploaded media")
	}

	mimeType, size, copyErr := writeVideoInput(output, field, value)
	closeErr := output.Close()
	if copyErr != nil || closeErr != nil || size <= 0 || size > mediaLimitForField(field) {
		_ = os.Remove(path)
		return "", "", fmt.Errorf("unable to prepare uploaded media")
	}
	expiresAt := time.Now().Add(videoInputTTL)
	token, err := h.sealVideoInput(videoInputEnvelope{File: name, MIME: mimeType, Size: size, ExpiresAt: expiresAt.Unix()})
	if err != nil {
		_ = os.Remove(path)
		return "", "", fmt.Errorf("unable to secure uploaded media")
	}
	baseURL, err := h.videoInputBaseURL(c)
	if err != nil {
		_ = os.Remove(path)
		return "", "", err
	}
	return baseURL + "/v1/video-inputs/" + url.PathEscape(token), path, nil
}

func writeVideoInput(output *os.File, field string, value h3MediaValue) (string, int64, error) {
	if value.Upload != nil {
		input, err := os.Open(value.Upload.Path)
		if err != nil {
			return "", 0, err
		}
		defer func() { _ = input.Close() }()
		written, err := io.Copy(output, io.LimitReader(input, mediaLimitForField(field)+1))
		return value.Upload.MIME, written, err
	}
	mimeType, data, err := decodeH3DataURI(strings.TrimSpace(value.Text))
	if err != nil {
		return "", 0, err
	}
	written, err := output.Write(data)
	return mimeType, int64(written), err
}

func (h *GatewayHandler) videoInputBaseURL(c *gin.Context) (string, error) {
	base := ""
	if h.settingService != nil {
		base = strings.TrimSpace(h.settingService.GetFrontendURL(c.Request.Context()))
	}
	if base == "" && h.cfg != nil {
		base = strings.TrimSpace(h.cfg.Server.FrontendURL)
	}
	if base == "" {
		hostname := strings.TrimSpace(c.Request.Host)
		hostOnly := hostname
		if parsedURL, parseErr := url.Parse("//" + hostname); parseErr == nil && parsedURL.Hostname() != "" {
			hostOnly = parsedURL.Hostname()
		}
		isOwnAPIHost := hostOnly == "ownapi.dev" || strings.HasSuffix(hostOnly, ".ownapi.dev")
		if hostOnly != "127.0.0.1" && hostOnly != "localhost" && !isOwnAPIHost {
			return "", fmt.Errorf("public media URL is unavailable")
		}
		scheme := "https"
		if !isOwnAPIHost {
			scheme = "http"
		}
		base = scheme + "://" + hostname
	}
	parsed, err := url.Parse(base)
	if err != nil {
		return "", fmt.Errorf("public media URL is unavailable")
	}
	validLocalHTTP := parsed.Scheme == "http" && (parsed.Hostname() == "127.0.0.1" || parsed.Hostname() == "localhost")
	if parsed.Hostname() == "" || (parsed.Scheme != "https" && !validLocalHTTP) {
		return "", fmt.Errorf("public media URL is unavailable")
	}
	parsed.Path, parsed.RawPath, parsed.RawQuery, parsed.Fragment = "", "", "", ""
	return strings.TrimRight(parsed.String(), "/"), nil
}

func (h *GatewayHandler) videoInputDir() string {
	base := "/app/data"
	if h.cfg != nil && strings.TrimSpace(h.cfg.Pricing.DataDir) != "" {
		configured := strings.TrimSpace(h.cfg.Pricing.DataDir)
		// Production has a persistent /app/data volume. Relative pricing paths
		// may resolve inside the image workdir, so never use them for media that
		// the provider can fetch after the request returns.
		if filepath.IsAbs(configured) || !directoryExists("/app/data") {
			base = configured
		}
	}
	return filepath.Join(base, "video-inputs")
}

func directoryExists(path string) bool {
	info, err := os.Stat(path)
	return err == nil && info.IsDir()
}

func (h *GatewayHandler) cleanupExpiredVideoInputs(now time.Time) {
	dir := h.videoInputDir()
	entries, err := os.ReadDir(dir)
	if err != nil {
		return
	}
	cutoff := now.Add(-videoInputTTL - videoInputCleanupGrace)
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		info, err := entry.Info()
		if err == nil && info.ModTime().Before(cutoff) {
			_ = os.Remove(filepath.Join(dir, entry.Name()))
		}
	}
}

func removeVideoInputFiles(paths []string) {
	for _, path := range paths {
		if strings.TrimSpace(path) != "" {
			_ = os.Remove(path)
		}
	}
}

func safeVideoInputPath(dir, name string) (string, error) {
	if name == "" || filepath.Base(name) != name || strings.ContainsAny(name, `/\\`) {
		return "", fmt.Errorf("invalid video input path")
	}
	return filepath.Join(dir, name), nil
}

func (h *GatewayHandler) sealVideoInput(envelope videoInputEnvelope) (string, error) {
	aead, err := h.videoTaskCipher()
	if err != nil {
		return "", err
	}
	plain, err := json.Marshal(envelope)
	if err != nil {
		return "", err
	}
	nonce := make([]byte, aead.NonceSize())
	if _, err := rand.Read(nonce); err != nil {
		return "", err
	}
	sealed := aead.Seal(nonce, nonce, plain, []byte(videoInputTokenAAD))
	return videoInputTokenPrefix + base64.RawURLEncoding.EncodeToString(sealed), nil
}

func (h *GatewayHandler) openVideoInput(token string) (*videoInputEnvelope, error) {
	if !strings.HasPrefix(token, videoInputTokenPrefix) {
		return nil, fmt.Errorf("invalid video input token")
	}
	sealed, err := base64.RawURLEncoding.DecodeString(strings.TrimPrefix(token, videoInputTokenPrefix))
	if err != nil {
		return nil, err
	}
	aead, err := h.videoTaskCipher()
	if err != nil || len(sealed) < aead.NonceSize() {
		return nil, fmt.Errorf("invalid video input token")
	}
	plain, err := aead.Open(nil, sealed[:aead.NonceSize()], sealed[aead.NonceSize():], []byte(videoInputTokenAAD))
	if err != nil {
		return nil, err
	}
	var envelope videoInputEnvelope
	if err := json.Unmarshal(plain, &envelope); err != nil {
		return nil, err
	}
	return &envelope, nil
}
