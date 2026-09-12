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
	"os"
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
	miniMaxH3Model      = "MiniMax-H3"
	wanVideoModel       = "wan3.0-video"
	wanVideoPrimeModel  = "wan3.0-video-prime"
	videoAdapterDCAPI   = "dc-api"
	videoAdapterAlibaba = "alibaba"
	// MiniMax H3 official prices are 0.5 CNY/s (768p) and 0.8 CNY/s (2K).
	// OwnAPI converts at 6.7 CNY/USD and sells at 75% of the converted list price.
	miniMaxH3768PriceUSD = 0.0559701493
	miniMaxH32KPriceUSD  = 0.0895522388
	maxVideoJSONBody     = 64 << 20
)

var wanCustomerPricesUSD = map[string]map[string]float64{
	wanVideoModel:      {"480P": 0.0330048, "720P": 0.0660104, "1080P": 0.1320200},
	wanVideoPrimeModel: {"480P": 0.05088, "720P": 0.1017592, "1080P": 0.2035192},
}

var wanUpstreamCostsUSD = map[string]map[string]float64{
	wanVideoModel:      {"480P": 0.0246268657, "720P": 0.0492537313, "1080P": 0.0985074627},
	wanVideoPrimeModel: {"480P": 0.0436567164, "720P": 0.0873134328, "1080P": 0.1746268657},
}

type videoTaskEnvelope struct {
	UpstreamID string `json:"u"`
	AccountID  int64  `json:"a"`
	UserID     int64  `json:"n"`
	Model      string `json:"m"`
	Adapter    string `json:"p,omitempty"`
	ExpiresAt  int64  `json:"e"`
}

// VideosCreate creates an asynchronous video task through the model's private
// managed upstream. Clients authenticate only with their OwnAPI key.
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

	request, err := parseVideoCreateRequest(c.Request)
	if err != nil {
		message := "Invalid video request"
		if requestErr, ok := err.(*videoRequestError); ok {
			message = requestErr.message
		}
		h.errorResponse(c, http.StatusBadRequest, "invalid_request_error", message)
		return
	}
	defer cleanupVideoCreateRequest(request)
	model := canonicalVideoModel(request["model"])
	if model == "" {
		h.errorResponse(c, http.StatusBadRequest, "unsupported_model", "Unsupported video model")
		return
	}
	durationValue := request["duration"]
	if durationValue == nil {
		durationValue = request["seconds"]
	}
	duration, ok := positiveWholeNumber(durationValue)
	if !ok {
		h.errorResponse(c, http.StatusBadRequest, "invalid_duration", videoDurationMessage(model))
		return
	}
	if (model == miniMaxH3Model && (duration < 5 || duration > 15)) || (model != miniMaxH3Model && (duration < 2 || duration > 30)) {
		h.errorResponse(c, http.StatusBadRequest, "invalid_duration", videoDurationMessage(model))
		return
	}
	adapter := videoAdapterDCAPI
	resolution := ""
	unitPrice := 0.0
	upstreamUnitCost := 0.0
	var body []byte
	stagedInputPaths := make([]string, 0, 3)
	keepStagedInputs := false
	defer func() {
		if !keepStagedInputs {
			removeVideoInputFiles(stagedInputPaths)
		}
	}()
	if model == miniMaxH3Model {
		resolution, ok = normalizeH3Resolution(request)
		if !ok {
			h.errorResponse(c, http.StatusBadRequest, "invalid_resolution", "resolution must be 768p or 2k")
			return
		}
		body, _, err = buildH3UpstreamRequest(request, duration, resolution, func(field string, value h3MediaValue) (string, error) {
			publicURL, path, storeErr := h.storeVideoInput(c, field, value)
			if storeErr == nil {
				stagedInputPaths = append(stagedInputPaths, path)
			}
			return publicURL, storeErr
		})
		unitPrice = miniMaxH3768PriceUSD
		if resolution == "2k" {
			unitPrice = miniMaxH32KPriceUSD
		}
	} else {
		adapter = videoAdapterAlibaba
		resolution, ok = normalizeWanResolution(request)
		if !ok {
			h.errorResponse(c, http.StatusBadRequest, "invalid_resolution", "resolution must be 480P, 720P, or 1080P")
			return
		}
		body, err = buildWanJSONRequest(request, model, duration, resolution)
		unitPrice = wanCustomerPricesUSD[model][resolution]
		upstreamUnitCost = wanUpstreamCostsUSD[model][resolution]
	}
	requestDurationMs := duration * 1000
	if err != nil {
		logger.L().With(zap.String("model", model)).Warn("video.media_prepare_failed", zap.Error(err))
		h.errorResponse(c, http.StatusBadRequest, "invalid_media", "Reference media could not be processed")
		return
	}

	multiplier := h.gatewayService.ResolveUserGroupRateMultiplier(c.Request.Context(), apiKey.User.ID, apiKey.Group.ID, apiKey.Group.RateMultiplier)
	multiplier = h.gatewayService.ResolveUserModelRateMultiplier(c.Request.Context(), apiKey.User.ID, apiKey.Group.ID, model, multiplier)
	cost := float64(duration) * unitPrice * multiplier
	if apiKey.User.Balance+1e-9 < cost {
		h.errorResponse(c, http.StatusPaymentRequired, "insufficient_balance", "Insufficient balance for this video request")
		return
	}

	var account *service.Account
	if adapter == videoAdapterAlibaba {
		account, err = h.gatewayService.SelectAlibabaVideoAccount(c.Request.Context(), model)
	} else {
		account, err = h.gatewayService.SelectDCVideoAccount(c.Request.Context(), model)
	}
	if err != nil {
		h.errorResponse(c, http.StatusServiceUnavailable, "video_unavailable", "The requested video model is temporarily unavailable")
		return
	}
	var resp *http.Response
	if adapter == videoAdapterAlibaba {
		resp, err = h.gatewayService.ForwardAlibabaVideo(c.Request.Context(), account, http.MethodPost, "/services/aigc/video-generation/video-synthesis", body)
	} else {
		resp, err = h.gatewayService.ForwardDCVideo(c.Request.Context(), account, http.MethodPost, "/v1/videos", body)
	}
	if err != nil {
		h.errorResponse(c, http.StatusBadGateway, "upstream_error", "Video provider request failed")
		return
	}
	defer func() { _ = resp.Body.Close() }()
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
	if !shouldBillVideoCreate(adapter, upstream) {
		c.JSON(http.StatusBadGateway, gin.H{"error": gin.H{"type": "video_provider_error", "message": "Video request could not be completed"}})
		return
	}
	upstreamTaskID := upstreamVideoTaskID(upstream, adapter)
	if strings.TrimSpace(upstreamTaskID) == "" {
		h.errorResponse(c, http.StatusBadGateway, "upstream_error", "Video provider returned no task id")
		return
	}
	// A successfully accepted H3 task may fetch its private reference inputs
	// after the create response has returned. Their signed URLs expire in one
	// hour and cleanup is handled opportunistically by the input store.
	keepStagedInputs = adapter == videoAdapterDCAPI
	publicTaskID, err := h.sealVideoTask(videoTaskEnvelope{
		UpstreamID: upstreamTaskID,
		AccountID:  account.ID,
		UserID:     apiKey.User.ID,
		Model:      model,
		Adapter:    adapter,
		ExpiresAt:  time.Now().Add(14 * 24 * time.Hour).Unix(),
	})
	if err != nil {
		h.errorResponse(c, http.StatusInternalServerError, "api_error", "Failed to secure video task")
		return
	}

	var accountStatsCost *float64
	if adapter == videoAdapterAlibaba {
		accountStatsCost = floatPointer(float64(duration) * upstreamUnitCost)
	}
	if _, err := h.usageService.Create(c.Request.Context(), service.CreateUsageLogRequest{
		UserID:           apiKey.User.ID,
		APIKeyID:         apiKey.ID,
		AccountID:        account.ID,
		RequestID:        videoUsageRequestID(publicTaskID),
		Model:            model,
		TotalCost:        cost,
		ActualCost:       cost,
		RateMultiplier:   multiplier,
		VideoTaskID:      &publicTaskID,
		GroupID:          &apiKey.Group.ID,
		RequestType:      service.RequestTypeSync,
		ImageSize:        &resolution,
		DurationMs:       &requestDurationMs,
		InboundEndpoint:  stringPointer("/v1/videos"),
		UpstreamEndpoint: stringPointer(videoUpstreamCreateEndpoint(adapter)),
		AccountStatsCost: accountStatsCost,
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

	c.JSON(http.StatusOK, sanitizedVideoResponseForModel(c, upstream, publicTaskID, model, adapter))
}

func shouldBillVideoCreate(adapter string, upstream map[string]any) bool {
	return adapter != videoAdapterDCAPI || !strings.EqualFold(strings.TrimSpace(stringValue(upstream["status"])), "failed")
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
	adapter := envelope.Adapter
	if adapter == "" {
		adapter = videoAdapterDCAPI
	}
	var account *service.Account
	if adapter == videoAdapterAlibaba {
		account, err = h.gatewayService.GetAlibabaVideoAccount(c.Request.Context(), envelope.AccountID, envelope.Model)
	} else {
		account, err = h.gatewayService.GetDCVideoAccount(c.Request.Context(), envelope.AccountID, envelope.Model)
	}
	if err != nil {
		h.errorResponse(c, http.StatusServiceUnavailable, "video_unavailable", "Video task is temporarily unavailable")
		return
	}
	path := "/v1/videos/" + url.PathEscape(envelope.UpstreamID)
	if adapter == videoAdapterAlibaba {
		path = "/tasks/" + url.PathEscape(envelope.UpstreamID)
	} else if content {
		path += "/content"
	}
	resp, err := func() (*http.Response, error) {
		if adapter == videoAdapterAlibaba {
			return h.gatewayService.ForwardAlibabaVideo(c.Request.Context(), account, http.MethodGet, path, nil)
		}
		return h.gatewayService.ForwardDCVideo(c.Request.Context(), account, http.MethodGet, path, nil)
	}()
	if err != nil {
		h.errorResponse(c, http.StatusBadGateway, "upstream_error", "Video provider request failed")
		return
	}
	defer func() { _ = resp.Body.Close() }()
	if content && adapter != videoAdapterAlibaba && resp.StatusCode >= 200 && resp.StatusCode < 300 {
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
	if adapter == videoAdapterAlibaba && content {
		videoURL := alibabaVideoURL(upstream)
		if videoURL == "" {
			h.errorResponse(c, http.StatusConflict, "video_not_ready", "Video content is not available")
			return
		}
		contentResp, fetchErr := h.gatewayService.FetchAlibabaVideoContent(c.Request.Context(), account, videoURL)
		if fetchErr != nil {
			h.errorResponse(c, http.StatusBadGateway, "upstream_error", "Video content could not be downloaded")
			return
		}
		defer func() { _ = contentResp.Body.Close() }()
		if contentResp.StatusCode < 200 || contentResp.StatusCode >= 300 {
			h.errorResponse(c, http.StatusBadGateway, "upstream_error", "Video content could not be downloaded")
			return
		}
		if contentType := contentResp.Header.Get("Content-Type"); contentType != "" {
			c.Header("Content-Type", contentType)
		}
		c.Status(http.StatusOK)
		_, _ = io.Copy(c.Writer, contentResp.Body)
		return
	}
	response := sanitizedVideoResponseForModel(c, upstream, publicTaskID, envelope.Model, adapter)
	if historyID != "" {
		response["id"] = historyID
		delete(response, "url")
	}
	c.JSON(http.StatusOK, response)
}

func canonicalVideoModel(value any) string {
	raw, _ := value.(string)
	switch {
	case strings.EqualFold(strings.TrimSpace(raw), miniMaxH3Model):
		return miniMaxH3Model
	case strings.EqualFold(strings.TrimSpace(raw), wanVideoModel):
		return wanVideoModel
	case strings.EqualFold(strings.TrimSpace(raw), wanVideoPrimeModel):
		return wanVideoPrimeModel
	default:
		return ""
	}
}

func videoDurationMessage(model string) string {
	if model == miniMaxH3Model {
		return "duration must be a whole number of seconds from 5 through 15"
	}
	return "duration must be a whole number of seconds from 2 through 30"
}

func normalizeWanResolution(request map[string]any) (string, bool) {
	value, _ := request["resolution"].(string)
	if strings.TrimSpace(value) == "" {
		value, _ = request["size"].(string)
	}
	switch strings.ToUpper(strings.TrimSpace(value)) {
	case "480P":
		return "480P", true
	case "720P":
		return "720P", true
	case "1080P":
		return "1080P", true
	default:
		return "", false
	}
}

func buildWanJSONRequest(request map[string]any, model string, duration int, resolution string) ([]byte, error) {
	if model != wanVideoModel && model != wanVideoPrimeModel {
		return nil, fmt.Errorf("unsupported video model")
	}
	input := map[string]any{}
	prompt, _ := request["prompt"].(string)
	if strings.TrimSpace(prompt) != "" {
		input["prompt"] = strings.TrimSpace(prompt)
	}
	media := make([]map[string]any, 0)
	add := func(kind string, values []string) {
		for _, value := range values {
			if strings.TrimSpace(value) != "" {
				media = append(media, map[string]any{"type": kind, "url": value})
			}
		}
	}
	first := stringValues(request["first_frame_image"])
	if len(first) == 0 {
		first = stringValues(request["first_frame"])
	}
	last := stringValues(request["last_frame_image"])
	if len(last) == 0 {
		last = stringValues(request["last_frame"])
	}
	images := stringValues(request["reference_images"])
	videos := stringValues(request["reference_videos"])
	audios := stringValues(request["reference_audios"])
	files := stringValues(request["file"])
	links := stringValues(request["link"])
	if len(first) > 1 || len(last) > 1 {
		return nil, fmt.Errorf("only one first and last frame is allowed")
	}
	if len(images) > 10 {
		return nil, fmt.Errorf("at most 10 reference images are allowed")
	}
	if len(videos) > 5 {
		return nil, fmt.Errorf("at most 5 reference videos are allowed")
	}
	if len(audios) > 5 {
		return nil, fmt.Errorf("at most 5 reference audios are allowed")
	}
	if len(files) > 1 || len(links) > 1 {
		return nil, fmt.Errorf("only one file or link is allowed")
	}
	if len(files) > 0 && len(links) > 0 {
		return nil, fmt.Errorf("file and link cannot be combined")
	}
	if len(first)+len(last) > 0 && len(images)+len(videos)+len(audios)+len(files)+len(links) > 0 {
		return nil, fmt.Errorf("first/last frame cannot be combined with reference media, file, or link")
	}
	if len(first)+len(last)+len(images)+len(videos)+len(audios)+len(files)+len(links) > 20 {
		return nil, fmt.Errorf("at most 20 media items are allowed")
	}
	add("first_frame", first)
	add("last_frame", last)
	add("reference_image", images)
	add("reference_video", videos)
	add("reference_audio", audios)
	add("file", files)
	add("link", links)
	if len(media) > 0 {
		input["media"] = media
	}
	if len(input) == 0 {
		return nil, fmt.Errorf("prompt or media is required")
	}
	params := map[string]any{"resolution": resolution, "duration": duration}
	ratio, _ := request["ratio"].(string)
	if ratio == "" {
		ratio = "adaptive"
	}
	allowedRatios := map[string]bool{"adaptive": true, "16:9": true, "4:3": true, "1:1": true, "3:4": true, "9:16": true}
	if !allowedRatios[ratio] {
		return nil, fmt.Errorf("invalid ratio")
	}
	params["ratio"] = ratio
	for _, key := range []string{"audio", "prompt_extend", "watermark"} {
		if value, exists := request[key]; exists {
			if _, ok := value.(bool); !ok {
				return nil, fmt.Errorf("%s must be boolean", key)
			}
			params[key] = value
		}
	}
	if value, exists := request["seed"]; exists {
		seed, ok := wholeNumber(value)
		if !ok || seed < -1 || seed > 2147483647 {
			return nil, fmt.Errorf("seed must be -1 or an integer from 0 through 2147483647")
		}
		params["seed"] = seed
	}
	return json.Marshal(map[string]any{"model": model, "input": input, "parameters": params})
}

func wholeNumber(value any) (int64, bool) {
	n, ok := value.(float64)
	if !ok || n != float64(int64(n)) {
		return 0, false
	}
	return int64(n), true
}

func upstreamVideoTaskID(upstream map[string]any, adapter string) string {
	if adapter == videoAdapterAlibaba {
		if output, ok := upstream["output"].(map[string]any); ok {
			id, _ := output["task_id"].(string)
			return strings.TrimSpace(id)
		}
	}
	id, _ := upstream["id"].(string)
	return strings.TrimSpace(id)
}

func sanitizedVideoResponseForModel(c *gin.Context, upstream map[string]any, publicTaskID, model, adapter string) gin.H {
	if adapter != videoAdapterAlibaba {
		out := sanitizedVideoResponse(c, upstream, publicTaskID)
		out["model"] = model
		return out
	}
	out := gin.H{"id": publicTaskID, "object": "video", "model": model}
	output, _ := upstream["output"].(map[string]any)
	status, _ := output["task_status"].(string)
	switch strings.ToUpper(status) {
	case "PENDING":
		out["status"] = "queued"
	case "RUNNING":
		out["status"] = "in_progress"
	case "SUCCEEDED":
		out["status"] = "completed"
		if c != nil {
			out["url"] = ownAPIVideoContentURL(c, publicTaskID)
		}
	default:
		out["status"] = "failed"
		out["error"] = gin.H{"code": "task_failed", "message": "Video generation failed"}
	}
	return out
}

func alibabaVideoURL(upstream map[string]any) string {
	output, _ := upstream["output"].(map[string]any)
	value, _ := output["video_url"].(string)
	return strings.TrimSpace(value)
}
func videoUpstreamCreateEndpoint(adapter string) string {
	// Usage records are customer-visible, so they keep the stable OwnAPI
	// resource path rather than exposing a provider-specific implementation.
	return "/v1/videos"
}
func stringPointer(value string) *string  { return &value }
func floatPointer(value float64) *float64 { return &value }

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
func buildH3JSONRequest(request map[string]any, duration int, resolution string, buildMediaURL h3MediaURLBuilder) ([]byte, error) {
	// DC-API's own frontend and documentation use duration in the JSON body for
	// both text-only and media-backed requests.
	upstream := map[string]any{"model": "minimax-h3", "duration": duration}
	prompt, _ := request["prompt"].(string)
	if strings.TrimSpace(prompt) == "" {
		return nil, fmt.Errorf("prompt is required")
	}
	upstream["prompt"] = strings.TrimSpace(prompt)
	upstream["size"] = h3RequestSize(request, resolution)

	for _, mapping := range []struct {
		provider string
		field    string
		values   []h3MediaValue
	}{
		{"reference_images", "input_reference", append(h3MediaValues(request["input_reference"]), h3MediaValues(request["reference_images"])...)},
		{"reference_videos", "reference_videos", h3MediaValues(request["reference_videos"])},
		{"reference_audios", "reference_audios", h3MediaValues(request["reference_audios"])},
		{"first_frame", "first_frame", append(h3MediaValues(request["first_frame"]), h3MediaValues(request["first_frame_image"])...)},
		{"last_frame", "last_frame", append(h3MediaValues(request["last_frame"]), h3MediaValues(request["last_frame_image"])...)},
	} {
		objects := make([]map[string]string, 0, len(mapping.values))
		for _, value := range mapping.values {
			mediaURL, err := h3DCMediaURL(mapping.field, value, buildMediaURL)
			if err != nil {
				return nil, err
			}
			objects = append(objects, map[string]string{"url": mediaURL})
		}
		if len(objects) > 0 {
			upstream[mapping.provider] = objects
		}
	}
	return json.Marshal(upstream)
}

func h3DCMediaURL(field string, value h3MediaValue, buildMediaURL h3MediaURLBuilder) (string, error) {
	if value.Upload == nil {
		text := strings.TrimSpace(value.Text)
		if !strings.HasPrefix(text, "data:") {
			return text, nil
		}
		if field != "reference_videos" && field != "reference_audios" {
			return text, nil
		}
	}
	if field == "reference_videos" || field == "reference_audios" {
		if buildMediaURL == nil {
			return "", fmt.Errorf("%s upload could not be prepared", field)
		}
		return buildMediaURL(field, value)
	}
	if value.Upload == nil {
		return strings.TrimSpace(value.Text), nil
	}
	data, err := os.ReadFile(value.Upload.Path)
	if err != nil {
		return "", fmt.Errorf("unable to read media for %s", field)
	}
	return "data:" + value.Upload.MIME + ";base64," + base64.StdEncoding.EncodeToString(data), nil
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
	case "768p", "1536x672", "1344x768", "1024x768", "768x768", "768x1024", "768x1344":
		return "768p", true
	case "2k", "2912x1280", "2544x1456", "1920x1440", "1440x1440", "1440x1920", "1440x2560":
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
