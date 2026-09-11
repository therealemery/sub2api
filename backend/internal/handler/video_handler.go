package handler

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/Wei-Shaw/sub2api/internal/pkg/logger"
	middleware2 "github.com/Wei-Shaw/sub2api/internal/server/middleware"
	"github.com/Wei-Shaw/sub2api/internal/service"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

const (
	miniMaxH3Model = "MiniMax-H3"
	// MiniMax H3 official prices are 0.5 CNY/s (768p) and 0.8 CNY/s (2K).
	// OwnAPI converts at 6.7 CNY/USD and sells at 75% of the converted list price.
	miniMaxH3768PriceUSD = 0.0559701493
	miniMaxH32KPriceUSD  = 0.0895522388
	maxVideoJSONBody     = 64 << 20
)

type videoTaskEnvelope struct {
	UpstreamID string `json:"u"`
	AccountID  int64  `json:"a"`
	UserID     int64  `json:"n"`
	Model      string `json:"m"`
	ExpiresAt  int64  `json:"e"`
}

// VideosCreate creates an asynchronous MiniMax H3 task through the private
// DC-API upstream. Clients authenticate only with their OwnAPI key.
func (h *GatewayHandler) VideosCreate(c *gin.Context) {
	apiKey, ok := middleware2.GetAPIKeyFromContext(c)
	if !ok || apiKey.User == nil || apiKey.Group == nil {
		h.errorResponse(c, http.StatusUnauthorized, "authentication_error", "Invalid API key")
		return
	}
	if subscription, _ := middleware2.GetSubscriptionFromContext(c); subscription != nil {
		h.errorResponse(c, http.StatusBadRequest, "unsupported_billing_type", "Video generation currently requires a balance-billed API key")
		return
	}
	if err := h.billingCacheService.CheckBillingEligibility(c.Request.Context(), apiKey.User, apiKey, apiKey.Group, nil); err != nil {
		status, code, message, retryAfter := billingErrorDetails(err)
		if retryAfter > 0 {
			c.Header("Retry-After", strconv.Itoa(retryAfter))
		}
		h.errorResponse(c, status, code, message)
		return
	}

	body, err := io.ReadAll(io.LimitReader(c.Request.Body, maxVideoJSONBody+1))
	if err != nil || len(body) > maxVideoJSONBody {
		h.errorResponse(c, http.StatusRequestEntityTooLarge, "invalid_request_error", "Video request is too large")
		return
	}
	var request map[string]any
	if err := json.Unmarshal(body, &request); err != nil {
		h.errorResponse(c, http.StatusBadRequest, "invalid_request_error", "Invalid JSON body")
		return
	}
	model, _ := request["model"].(string)
	if !strings.EqualFold(strings.TrimSpace(model), miniMaxH3Model) {
		h.errorResponse(c, http.StatusBadRequest, "unsupported_model", "Only MiniMax-H3 is supported by this video endpoint")
		return
	}
	durationValue := request["duration"]
	if durationValue == nil {
		durationValue = request["seconds"]
	}
	duration, ok := positiveWholeNumber(durationValue)
	if !ok {
		h.errorResponse(c, http.StatusBadRequest, "invalid_duration", "duration must be a whole number of seconds from 5 through 15")
		return
	}
	if duration < 5 || duration > 15 {
		h.errorResponse(c, http.StatusBadRequest, "invalid_duration", "duration must be a whole number of seconds from 5 through 15")
		return
	}
	resolution, ok := normalizeH3Resolution(request)
	if !ok {
		h.errorResponse(c, http.StatusBadRequest, "invalid_resolution", "resolution must be 768p or 2k")
		return
	}
	body, err = buildH3JSONRequest(request, duration, resolution)
	if err != nil {
		h.errorResponse(c, http.StatusBadRequest, "invalid_media", err.Error())
		return
	}

	multiplier := h.gatewayService.ResolveUserGroupRateMultiplier(c.Request.Context(), apiKey.User.ID, apiKey.Group.ID, apiKey.Group.RateMultiplier)
	multiplier = h.gatewayService.ResolveUserModelRateMultiplier(c.Request.Context(), apiKey.User.ID, apiKey.Group.ID, miniMaxH3Model, multiplier)
	unitPrice := miniMaxH3768PriceUSD
	if resolution == "2k" {
		unitPrice = miniMaxH32KPriceUSD
	}
	cost := float64(duration) * unitPrice * multiplier
	if apiKey.User.Balance+1e-9 < cost {
		h.errorResponse(c, http.StatusPaymentRequired, "insufficient_balance", "Insufficient balance for this video request")
		return
	}

	account, err := h.gatewayService.SelectDCVideoAccount(c.Request.Context(), miniMaxH3Model)
	if err != nil {
		h.errorResponse(c, http.StatusServiceUnavailable, "video_unavailable", "MiniMax-H3 is temporarily unavailable")
		return
	}
	resp, err := h.gatewayService.ForwardDCVideo(c.Request.Context(), account, http.MethodPost, "/v1/videos", body)
	if err != nil {
		h.errorResponse(c, http.StatusBadGateway, "upstream_error", "Video provider request failed")
		return
	}
	defer resp.Body.Close()
	responseBody, err := io.ReadAll(io.LimitReader(resp.Body, maxVideoJSONBody+1))
	if err != nil || len(responseBody) > maxVideoJSONBody {
		h.errorResponse(c, http.StatusBadGateway, "upstream_error", "Invalid video provider response")
		return
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		writeSanitizedVideoError(c, resp.StatusCode, responseBody)
		return
	}
	var upstream map[string]any
	if err := json.Unmarshal(responseBody, &upstream); err != nil {
		h.errorResponse(c, http.StatusBadGateway, "upstream_error", "Invalid video provider response")
		return
	}
	upstreamTaskID, _ := upstream["id"].(string)
	if strings.TrimSpace(upstreamTaskID) == "" {
		h.errorResponse(c, http.StatusBadGateway, "upstream_error", "Video provider returned no task id")
		return
	}
	publicTaskID, err := h.sealVideoTask(videoTaskEnvelope{
		UpstreamID: upstreamTaskID,
		AccountID:  account.ID,
		UserID:     apiKey.User.ID,
		Model:      miniMaxH3Model,
		ExpiresAt:  time.Now().Add(14 * 24 * time.Hour).Unix(),
	})
	if err != nil {
		h.errorResponse(c, http.StatusInternalServerError, "api_error", "Failed to secure video task")
		return
	}

	if _, err := h.usageService.Create(c.Request.Context(), service.CreateUsageLogRequest{
		UserID:         apiKey.User.ID,
		APIKeyID:       apiKey.ID,
		AccountID:      account.ID,
		RequestID:      videoUsageRequestID(publicTaskID),
		Model:          miniMaxH3Model,
		TotalCost:      cost,
		ActualCost:     cost,
		RateMultiplier: multiplier,
		VideoTaskID:    &publicTaskID,
	}); err != nil {
		logger.L().With(zap.Int64("user_id", apiKey.User.ID), zap.Int64("account_id", account.ID)).Error("video.billing_failed", zap.Error(err))
		h.errorResponse(c, http.StatusInternalServerError, "billing_error", "Video task was created but billing could not be finalized; contact support")
		return
	}
	if apiKey.Quota > 0 {
		_ = h.apiKeyService.UpdateQuotaUsed(c.Request.Context(), apiKey.ID, cost)
	}
	if apiKey.HasRateLimits() {
		_ = h.apiKeyService.UpdateRateLimitUsage(c.Request.Context(), apiKey.ID, cost)
	}

	c.JSON(http.StatusOK, sanitizedVideoResponse(c, upstream, publicTaskID))
}

// videoUsageRequestID derives a stable idempotency key that fits the
// usage_logs.request_id VARCHAR(64) column without exposing the sealed task ID.
func videoUsageRequestID(publicTaskID string) string {
	sum := sha256.Sum256([]byte("ownapi-video-usage:" + publicTaskID))
	return fmt.Sprintf("%x", sum)
}

func (h *GatewayHandler) VideosGet(c *gin.Context) {
	h.forwardVideoTaskRequest(c, false)
}

func (h *GatewayHandler) VideosContent(c *gin.Context) {
	h.forwardVideoTaskRequest(c, true)
}

func (h *GatewayHandler) forwardVideoTaskRequest(c *gin.Context, content bool) {
	apiKey, ok := middleware2.GetAPIKeyFromContext(c)
	if !ok || apiKey.User == nil {
		h.errorResponse(c, http.StatusUnauthorized, "authentication_error", "Invalid API key")
		return
	}
	h.forwardOwnedVideoTask(c, c.Param("taskID"), apiKey.User.ID, content, "")
}

// UserVideoGet lets an authenticated console user reopen a video from an
// owned usage record without entering or exposing the API key used to create it.
func (h *GatewayHandler) UserVideoGet(c *gin.Context) {
	h.forwardUserUsageVideo(c, false)
}

// UserVideoContent proxies video bytes for an authenticated console user.
func (h *GatewayHandler) UserVideoContent(c *gin.Context) {
	h.forwardUserUsageVideo(c, true)
}

func (h *GatewayHandler) forwardUserUsageVideo(c *gin.Context, content bool) {
	subject, ok := middleware2.GetAuthSubjectFromContext(c)
	if !ok {
		h.errorResponse(c, http.StatusUnauthorized, "authentication_error", "User not authenticated")
		return
	}
	usageLogID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || usageLogID <= 0 {
		h.errorResponse(c, http.StatusNotFound, "video_not_found", "Video task not found")
		return
	}
	publicTaskID, err := h.usageService.GetVideoTaskID(c.Request.Context(), usageLogID, subject.UserID)
	if err != nil {
		h.errorResponse(c, http.StatusNotFound, "video_not_found", "Video task not found")
		return
	}
	h.forwardOwnedVideoTask(c, publicTaskID, subject.UserID, content, strconv.FormatInt(usageLogID, 10))
}

func (h *GatewayHandler) forwardOwnedVideoTask(c *gin.Context, publicTaskID string, userID int64, content bool, historyID string) {
	envelope, err := h.openVideoTask(publicTaskID)
	if err != nil || envelope.UserID != userID || envelope.ExpiresAt < time.Now().Unix() {
		h.errorResponse(c, http.StatusNotFound, "video_not_found", "Video task not found")
		return
	}
	account, err := h.gatewayService.GetDCVideoAccount(c.Request.Context(), envelope.AccountID, envelope.Model)
	if err != nil {
		h.errorResponse(c, http.StatusServiceUnavailable, "video_unavailable", "Video task is temporarily unavailable")
		return
	}
	path := "/v1/videos/" + url.PathEscape(envelope.UpstreamID)
	if content {
		path += "/content"
	}
	resp, err := h.gatewayService.ForwardDCVideo(c.Request.Context(), account, http.MethodGet, path, nil)
	if err != nil {
		h.errorResponse(c, http.StatusBadGateway, "upstream_error", "Video provider request failed")
		return
	}
	defer resp.Body.Close()
	if content && resp.StatusCode >= 200 && resp.StatusCode < 300 {
		if contentType := resp.Header.Get("Content-Type"); contentType != "" {
			c.Header("Content-Type", contentType)
		}
		c.Status(http.StatusOK)
		_, _ = io.Copy(c.Writer, resp.Body)
		return
	}
	body, err := io.ReadAll(io.LimitReader(resp.Body, maxVideoJSONBody+1))
	if err != nil || len(body) > maxVideoJSONBody {
		h.errorResponse(c, http.StatusBadGateway, "upstream_error", "Invalid video provider response")
		return
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		writeSanitizedVideoError(c, resp.StatusCode, body)
		return
	}
	var upstream map[string]any
	if err := json.Unmarshal(body, &upstream); err != nil {
		h.errorResponse(c, http.StatusBadGateway, "upstream_error", "Invalid video provider response")
		return
	}
	response := sanitizedVideoResponse(c, upstream, publicTaskID)
	if historyID != "" {
		response["id"] = historyID
		delete(response, "url")
	}
	c.JSON(http.StatusOK, response)
}

func positiveWholeNumber(value any) (int, bool) {
	n, ok := value.(float64)
	if !ok || n <= 0 || n != float64(int(n)) || n > 3600 {
		return 0, false
	}
	return int(n), true
}

// buildH3JSONRequest translates OwnAPI's stable JSON contract into the JSON
// protocol accepted by the configured console.dc-api.com account. The public
// endpoint remains JSON; upstream media fields use the provider's names.
func buildH3JSONRequest(request map[string]any, duration int, resolution string) ([]byte, error) {
	upstream := map[string]any{"model": "minimax-h3", "seconds": duration}
	prompt, _ := request["prompt"].(string)
	if strings.TrimSpace(prompt) == "" {
		return nil, fmt.Errorf("prompt is required")
	}
	upstream["prompt"] = prompt
	if size, _ := request["size"].(string); strings.TrimSpace(size) != "" {
		upstream["size"] = strings.TrimSpace(size)
	} else {
		size := "1344x768"
		if resolution == "2k" {
			size = "2544x1456"
		}
		upstream["size"] = size
	}
	for _, field := range []struct{ own, provider string }{
		{"input_reference", "input_reference"}, {"reference_images", "input_reference"},
		{"reference_videos", "reference_videos"}, {"reference_audios", "reference_audios"},
		{"first_frame", "first_frame"}, {"last_frame", "last_frame"},
		{"first_frame_image", "first_frame"}, {"last_frame_image", "last_frame"},
	} {
		values := stringValues(request[field.own])
		if len(values) == 1 {
			upstream[field.provider] = values[0]
		} else if len(values) > 1 {
			upstream[field.provider] = values
		}
	}
	return json.Marshal(upstream)
}

func stringValues(value any) []string {
	if value == nil {
		return nil
	}
	if s, ok := value.(string); ok {
		return []string{s}
	}
	values, ok := value.([]any)
	if !ok {
		return nil
	}
	out := make([]string, 0, len(values))
	for _, item := range values {
		if obj, ok := item.(map[string]any); ok {
			if s, ok := obj["url"].(string); ok {
				out = append(out, s)
			}
			continue
		}
		if s, ok := item.(string); ok {
			out = append(out, s)
		}
	}
	return out
}

func normalizeH3Resolution(request map[string]any) (string, bool) {
	value, _ := request["resolution"].(string)
	if strings.TrimSpace(value) == "" {
		value, _ = request["size"].(string)
	}
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "768p":
		return "768p", true
	case "2k":
		return "2k", true
	default:
		return "", false
	}
}

func sanitizedVideoResponse(c *gin.Context, upstream map[string]any, publicTaskID string) gin.H {
	out := gin.H{"id": publicTaskID, "object": "video", "model": miniMaxH3Model}
	for _, key := range []string{"status", "progress", "created_at", "seconds", "usage"} {
		if value, exists := upstream[key]; exists {
			out[key] = value
		}
	}
	status, _ := upstream["status"].(string)
	if status == "completed" {
		out["url"] = ownAPIVideoContentURL(c, publicTaskID)
	}
	if status == "failed" {
		out["error"] = gin.H{"code": "task_failed", "message": "Video generation failed"}
	}
	return out
}

func ownAPIVideoContentURL(c *gin.Context, taskID string) string {
	scheme := strings.TrimSpace(c.GetHeader("X-Forwarded-Proto"))
	if scheme == "" {
		scheme = "https"
		if c.Request.TLS == nil && strings.HasPrefix(c.Request.Host, "127.0.0.1") {
			scheme = "http"
		}
	}
	return fmt.Sprintf("%s://%s/v1/videos/%s/content", scheme, c.Request.Host, taskID)
}

func writeSanitizedVideoError(c *gin.Context, status int, _ []byte) {
	if status < 400 || status > 599 {
		status = http.StatusBadGateway
	}
	c.JSON(status, gin.H{"error": gin.H{"type": "video_provider_error", "message": "Video request could not be completed"}})
}

func (h *GatewayHandler) videoTaskCipher() (cipher.AEAD, error) {
	if h.cfg == nil || strings.TrimSpace(h.cfg.JWT.Secret) == "" {
		return nil, fmt.Errorf("video task secret is unavailable")
	}
	key := sha256.Sum256([]byte("ownapi-video-task:" + h.cfg.JWT.Secret))
	block, err := aes.NewCipher(key[:])
	if err != nil {
		return nil, err
	}
	return cipher.NewGCM(block)
}

func (h *GatewayHandler) sealVideoTask(envelope videoTaskEnvelope) (string, error) {
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
	sealed := aead.Seal(nonce, nonce, plain, []byte("ownapi-video-v1"))
	return "video_" + base64.RawURLEncoding.EncodeToString(sealed), nil
}

func (h *GatewayHandler) openVideoTask(taskID string) (*videoTaskEnvelope, error) {
	if !strings.HasPrefix(taskID, "video_") {
		return nil, fmt.Errorf("invalid video task id")
	}
	sealed, err := base64.RawURLEncoding.DecodeString(strings.TrimPrefix(taskID, "video_"))
	if err != nil {
		return nil, err
	}
	aead, err := h.videoTaskCipher()
	if err != nil || len(sealed) < aead.NonceSize() {
		return nil, fmt.Errorf("invalid video task id")
	}
	nonce, ciphertext := sealed[:aead.NonceSize()], sealed[aead.NonceSize():]
	plain, err := aead.Open(nil, nonce, ciphertext, []byte("ownapi-video-v1"))
	if err != nil {
		return nil, err
	}
	var envelope videoTaskEnvelope
	if err := json.Unmarshal(plain, &envelope); err != nil {
		return nil, err
	}
	return &envelope, nil
}
