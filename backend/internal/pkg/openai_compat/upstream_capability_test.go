package openai_compat

import "testing"

func TestResolveResponsesSupport(t *testing.T) {
	tests := []struct {
		name  string
		extra map[string]any
		want  AccountResponsesSupport
	}{
		{"nil extra", nil, ResponsesSupportUnknown},
		{"empty extra", map[string]any{}, ResponsesSupportUnknown},
		{"key missing", map[string]any{"other": "value"}, ResponsesSupportUnknown},
		{"value true", map[string]any{ExtraKeyResponsesSupported: true}, ResponsesSupportYes},
		{"value false", map[string]any{ExtraKeyResponsesSupported: false}, ResponsesSupportNo},
		{"value wrong type string", map[string]any{ExtraKeyResponsesSupported: "true"}, ResponsesSupportUnknown},
		{"value wrong type number", map[string]any{ExtraKeyResponsesSupported: 1}, ResponsesSupportUnknown},
		{"value nil", map[string]any{ExtraKeyResponsesSupported: nil}, ResponsesSupportUnknown},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got := ResolveResponsesSupport(tc.extra)
			if got != tc.want {
				t.Errorf("ResolveResponsesSupport(%v) = %v, want %v", tc.extra, got, tc.want)
			}
		})
	}
}

func TestShouldUseResponsesAPI(t *testing.T) {
	tests := []struct {
		name  string
		extra map[string]any
		want  bool
	}{
		// 关键不变量：未探测必须返回 true（保留旧行为）
		{"unknown defaults to true (preserve old behavior)", nil, true},
		{"unknown empty defaults to true", map[string]any{}, true},
		{"unknown wrong type defaults to true", map[string]any{ExtraKeyResponsesSupported: "yes"}, true},

		// 已探测：标记决定
		{"explicitly supported", map[string]any{ExtraKeyResponsesSupported: true}, true},
		{"explicitly unsupported", map[string]any{ExtraKeyResponsesSupported: false}, false},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got := ShouldUseResponsesAPI(tc.extra)
			if got != tc.want {
				t.Errorf("ShouldUseResponsesAPI(%v) = %v, want %v", tc.extra, got, tc.want)
			}
		})
	}
}

func TestResolvePackyModelProtocol(t *testing.T) {
	tests := []struct {
		model string
		want  PackyUpstreamProtocol
		ok    bool
	}{
		{"gpt-5.6-luna", PackyProtocolOpenAIResponses, true},
		{"codex-auto-review", PackyProtocolOpenAIResponses, true},
		{" GPT-6-ASTRA ", PackyProtocolOpenAIResponses, true},
		{"grok-4.6", PackyProtocolOpenAIResponses, true},
		{"gpt-5.4", PackyProtocolOpenAIChat, true},
		{"claude-sonnet-4-6", PackyProtocolAnthropicMessages, true},
		{"CLAUDE-OPUS-4-6", PackyProtocolAnthropicMessages, true},
		{"MiniMax-M3", PackyProtocolOpenAIChat, true},
		{"glm-5.3", PackyProtocolOpenAIChat, true},
		{"gemini-3.1-pro-preview", PackyProtocolOpenAIChat, true},
		{"qwen3.8-max", PackyProtocolOpenAIChat, true},
		{"deepseek-v4.1-flash", PackyProtocolOpenAIChat, true},
		{"deepseek-v4-pro", PackyProtocolOpenAIChat, true},
		{"deepseek-v4-flash", PackyProtocolUnknown, false},
		{"not-configured", PackyProtocolUnknown, false},
		{"", PackyProtocolUnknown, false},
	}

	for _, tc := range tests {
		t.Run(tc.model, func(t *testing.T) {
			got, ok := ResolvePackyModelProtocol(tc.model)
			if got != tc.want || ok != tc.ok {
				t.Fatalf("ResolvePackyModelProtocol(%q) = (%q, %v), want (%q, %v)", tc.model, got, ok, tc.want, tc.ok)
			}
		})
	}

	if endpoint := PackyProtocolOpenAIResponses.Endpoint(); endpoint != "/v1/responses" {
		t.Fatalf("Responses endpoint = %q", endpoint)
	}
	if endpoint := PackyProtocolAnthropicMessages.Endpoint(); endpoint != "/v1/messages" {
		t.Fatalf("Anthropic endpoint = %q", endpoint)
	}
}
