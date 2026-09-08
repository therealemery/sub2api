//go:build unit

package service

import (
	"context"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/Wei-Shaw/sub2api/internal/config"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/require"
)

func TestGatewayService_ForwardAsChatCompletions_PackyAnthropicUsesMessagesBearer(t *testing.T) {
	gin.SetMode(gin.TestMode)
	rec := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(rec)
	c.Request = httptest.NewRequest(http.MethodPost, "/v1/chat/completions", nil)

	upstream := &anthropicHTTPUpstreamRecorder{resp: &http.Response{
		StatusCode: http.StatusOK,
		Header:     http.Header{"Content-Type": []string{"text/event-stream"}, "x-request-id": []string{"packy-rid"}},
		Body:       io.NopCloser(strings.NewReader("event: message_start\ndata: {\"type\":\"message_start\",\"message\":{\"id\":\"msg_1\",\"type\":\"message\",\"role\":\"assistant\",\"model\":\"claude-sonnet-4-6\",\"content\":[],\"usage\":{\"input_tokens\":2,\"output_tokens\":0}}}\n\nevent: content_block_start\ndata: {\"type\":\"content_block_start\",\"index\":0,\"content_block\":{\"type\":\"text\",\"text\":\"ok\"}}\n\nevent: message_delta\ndata: {\"type\":\"message_delta\",\"delta\":{\"stop_reason\":\"end_turn\"},\"usage\":{\"output_tokens\":1}}\n\n")),
	}}
	cfg := &config.Config{}
	cfg.Security.URLAllowlist.Enabled = false
	service := &GatewayService{cfg: cfg, httpUpstream: upstream, tlsFPProfileService: &TLSFingerprintProfileService{}}
	account := &Account{
		ID: 9, Name: "Packy / Core", Platform: PlatformOpenAI, Type: AccountTypeAPIKey, Concurrency: 1,
		Credentials: map[string]any{"api_key": "packy-secret", "base_url": "https://cf.api.fan/v1", "model_mapping": map[string]any{"claude-sonnet-4-6": "claude-sonnet-4-6"}},
		Extra:       map[string]any{"upstream_provider": UpstreamProviderPackyAPI},
	}
	body := []byte(`{"model":"claude-sonnet-4-6","messages":[{"role":"user","content":"hi"}]}`)
	result, err := service.ForwardAsChatCompletions(context.Background(), c, account, body, nil)
	require.NoError(t, err)
	require.Equal(t, "/v1/messages", upstream.lastReq.URL.Path)
	require.Equal(t, "Bearer packy-secret", getHeaderRaw(upstream.lastReq.Header, "authorization"))
	require.Empty(t, getHeaderRaw(upstream.lastReq.Header, "x-api-key"))
	require.Equal(t, 2, result.Usage.InputTokens)
	require.Equal(t, 1, result.Usage.OutputTokens)
	require.NotContains(t, rec.Body.String(), "cf.api.fan")
	require.NotContains(t, rec.Body.String(), "packy-secret")
}

func TestGatewayService_ForwardAsChatCompletions_PackyAnthropicSanitizesError(t *testing.T) {
	gin.SetMode(gin.TestMode)
	rec := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(rec)
	c.Request = httptest.NewRequest(http.MethodPost, "/v1/chat/completions", nil)

	upstream := &anthropicHTTPUpstreamRecorder{resp: &http.Response{
		StatusCode: http.StatusBadRequest,
		Header:     make(http.Header),
		Body:       io.NopCloser(strings.NewReader(`{"error":{"message":"cf.api.fan rejected packy-secret for cc-sale"}}`)),
	}}
	cfg := &config.Config{}
	cfg.Security.URLAllowlist.Enabled = false
	service := &GatewayService{cfg: cfg, httpUpstream: upstream, tlsFPProfileService: &TLSFingerprintProfileService{}}
	account := &Account{
		ID: 9, Name: "Packy / Core", Platform: PlatformOpenAI, Type: AccountTypeAPIKey, Concurrency: 1,
		Credentials: map[string]any{"api_key": "packy-secret", "base_url": "https://cf.api.fan/v1", "model_mapping": map[string]any{"claude-sonnet-4-6": "claude-sonnet-4-6"}},
		Extra:       map[string]any{"upstream_provider": UpstreamProviderPackyAPI},
	}
	body := []byte(`{"model":"claude-sonnet-4-6","messages":[{"role":"user","content":"hi"}]}`)
	result, err := service.ForwardAsChatCompletions(context.Background(), c, account, body, nil)
	require.Error(t, err)
	require.Nil(t, result)
	require.NotContains(t, rec.Body.String(), "cf.api.fan")
	require.NotContains(t, rec.Body.String(), "packy-secret")
	require.NotContains(t, rec.Body.String(), "cc-sale")
	require.Contains(t, rec.Body.String(), "Upstream request failed")
}

func TestExtractCCReasoningEffortFromBody(t *testing.T) {
	t.Parallel()

	t.Run("nested reasoning.effort", func(t *testing.T) {
		got := extractCCReasoningEffortFromBody([]byte(`{"reasoning":{"effort":"HIGH"}}`))
		require.NotNil(t, got)
		require.Equal(t, "high", *got)
	})

	t.Run("flat reasoning_effort", func(t *testing.T) {
		got := extractCCReasoningEffortFromBody([]byte(`{"reasoning_effort":"x-high"}`))
		require.NotNil(t, got)
		require.Equal(t, "xhigh", *got)
	})

	t.Run("missing effort", func(t *testing.T) {
		require.Nil(t, extractCCReasoningEffortFromBody([]byte(`{"model":"gpt-5"}`)))
	})
}

func TestHandleCCBufferedFromAnthropic_PreservesMessageStartCacheUsageAndReasoning(t *testing.T) {
	t.Parallel()
	gin.SetMode(gin.TestMode)

	rec := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(rec)

	reasoningEffort := "high"
	resp := &http.Response{
		Header: http.Header{"x-request-id": []string{"rid_cc_buffered"}},
		Body: io.NopCloser(strings.NewReader(strings.Join([]string{
			`event: message_start`,
			`data: {"type":"message_start","message":{"id":"msg_1","type":"message","role":"assistant","content":[],"model":"claude-sonnet-4.5","stop_reason":"","usage":{"input_tokens":12,"cache_read_input_tokens":9,"cache_creation_input_tokens":3}}}`,
			``,
			`event: content_block_start`,
			`data: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":"hello"}}`,
			``,
			`event: message_delta`,
			`data: {"type":"message_delta","delta":{"stop_reason":"end_turn"},"usage":{"output_tokens":7}}`,
			``,
		}, "\n"))),
	}

	svc := &GatewayService{}
	result, err := svc.handleCCBufferedFromAnthropic(resp, c, "gpt-5", "claude-sonnet-4.5", &reasoningEffort, time.Now())
	require.NoError(t, err)
	require.NotNil(t, result)
	require.Equal(t, 12, result.Usage.InputTokens)
	require.Equal(t, 7, result.Usage.OutputTokens)
	require.Equal(t, 9, result.Usage.CacheReadInputTokens)
	require.Equal(t, 3, result.Usage.CacheCreationInputTokens)
	require.NotNil(t, result.ReasoningEffort)
	require.Equal(t, "high", *result.ReasoningEffort)
}

func TestHandleCCStreamingFromAnthropic_PreservesMessageStartCacheUsageAndReasoning(t *testing.T) {
	t.Parallel()
	gin.SetMode(gin.TestMode)

	rec := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(rec)

	reasoningEffort := "medium"
	resp := &http.Response{
		Header: http.Header{"x-request-id": []string{"rid_cc_stream"}},
		Body: io.NopCloser(strings.NewReader(strings.Join([]string{
			`event: message_start`,
			`data: {"type":"message_start","message":{"id":"msg_2","type":"message","role":"assistant","content":[],"model":"claude-sonnet-4.5","stop_reason":"","usage":{"input_tokens":20,"cache_read_input_tokens":11,"cache_creation_input_tokens":4}}}`,
			``,
			`event: content_block_start`,
			`data: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":"hello"}}`,
			``,
			`event: message_delta`,
			`data: {"type":"message_delta","delta":{"stop_reason":"end_turn"},"usage":{"output_tokens":8}}`,
			``,
			`event: message_stop`,
			`data: {"type":"message_stop"}`,
			``,
		}, "\n"))),
	}

	svc := &GatewayService{}
	result, err := svc.handleCCStreamingFromAnthropic(resp, c, "gpt-5", "claude-sonnet-4.5", &reasoningEffort, time.Now(), true)
	require.NoError(t, err)
	require.NotNil(t, result)
	require.Equal(t, 20, result.Usage.InputTokens)
	require.Equal(t, 8, result.Usage.OutputTokens)
	require.Equal(t, 11, result.Usage.CacheReadInputTokens)
	require.Equal(t, 4, result.Usage.CacheCreationInputTokens)
	require.NotNil(t, result.ReasoningEffort)
	require.Equal(t, "medium", *result.ReasoningEffort)
	require.Contains(t, rec.Body.String(), `[DONE]`)
}
