// Package openai_compat 提供 OpenAI 协议族在不同上游间的能力差异判定工具。
//
// 背景：sub2api 的 OpenAI APIKey 账号通过 base_url 接入多种第三方 OpenAI 兼容上游
// （DeepSeek、Kimi、GLM、Qwen 等）。这些上游普遍只支持 /v1/chat/completions，
// 不存在 /v1/responses 端点。但网关历史代码无差别走 CC→Responses 转换并打到
// /v1/responses，导致兼容上游 404。
//
// 本包提供基于"账号探测标记"的能力判定，配合
// internal/service/openai_apikey_responses_probe.go 在创建/修改账号时一次性
// 探测并落标。
//
// 设计取舍：
//   - 不维护静态 host 白名单——避免新增厂商时必须改代码（讨论沉淀于
//     pensieve/short-term/knowledge/upstream-capability-detection-design-tradeoffs）
//   - 标记缺失时默认 true（即"走 Responses"），保持与重构前老代码完全一致的存量
//     账号行为（"现状即证据"原则；详见
//     pensieve/short-term/maxims/preserve-existing-runtime-behavior-when-replacing-logic-in-stateful-systems）
package openai_compat

import "strings"

// PackyUpstreamProtocol is the verified private protocol used for a Packy
// model. Customer requests and responses remain OpenAI Chat Completions.
type PackyUpstreamProtocol string

const (
	PackyProtocolUnknown           PackyUpstreamProtocol = ""
	PackyProtocolOpenAIChat        PackyUpstreamProtocol = "openai_chat"
	PackyProtocolOpenAIResponses   PackyUpstreamProtocol = "openai_responses"
	PackyProtocolAnthropicMessages PackyUpstreamProtocol = "anthropic_messages"
)

func (p PackyUpstreamProtocol) Endpoint() string {
	switch p {
	case PackyProtocolOpenAIChat:
		return "/v1/chat/completions"
	case PackyProtocolOpenAIResponses:
		return "/v1/responses"
	case PackyProtocolAnthropicMessages:
		return "/v1/messages"
	default:
		return ""
	}
}

// AccountResponsesSupport 描述账号上游对 OpenAI Responses API 的支持状态。
//
// 仅用于 platform=openai + type=apikey 的账号；其他账号类型不应调用本包判定。
type AccountResponsesSupport int

const (
	// ResponsesSupportUnknown 表示账号尚未完成能力探测（extra 字段缺失）。
	// 上游路由层应按"现状即证据"原则默认走 Responses，保持与重构前一致。
	ResponsesSupportUnknown AccountResponsesSupport = iota

	// ResponsesSupportYes 探测确认上游支持 /v1/responses。
	ResponsesSupportYes

	// ResponsesSupportNo 探测确认上游不支持 /v1/responses，应走
	// /v1/chat/completions 直转路径。
	ResponsesSupportNo
)

// ExtraKeyResponsesSupported 是 accounts.extra JSON 中存储探测结果的键名。
// 值类型为 bool：true=支持、false=不支持、键缺失=未探测。
const ExtraKeyResponsesSupported = "openai_responses_supported"

// ResolveResponsesSupport 从账号的 extra map 中读取探测标记。
//
// 标记缺失或类型不匹配时返回 ResponsesSupportUnknown——调用方应按
// "未探测=保留旧行为=走 Responses" 处理（参见 ShouldUseResponsesAPI）。
func ResolveResponsesSupport(extra map[string]any) AccountResponsesSupport {
	if extra == nil {
		return ResponsesSupportUnknown
	}
	v, ok := extra[ExtraKeyResponsesSupported]
	if !ok {
		return ResponsesSupportUnknown
	}
	supported, ok := v.(bool)
	if !ok {
		return ResponsesSupportUnknown
	}
	if supported {
		return ResponsesSupportYes
	}
	return ResponsesSupportNo
}

// ShouldUseResponsesAPI 判断 OpenAI APIKey 账号的入站 /v1/chat/completions 请求
// 是否应走"CC→Responses 转换 + 上游 /v1/responses"路径。
//
// 返回 true 的两种情况：
//  1. 账号已探测确认支持 Responses
//  2. 账号未探测（标记缺失）——按"现状即证据"原则保留旧行为
//
// 仅当账号已探测且确认不支持时返回 false，此时调用方应走 CC 直转路径
// （详见 internal/service/openai_gateway_chat_completions_raw.go）。
func ShouldUseResponsesAPI(extra map[string]any) bool {
	return ResolveResponsesSupport(extra) != ResponsesSupportNo
}

// ResolvePackyModelProtocol returns the exact protocol verified against the
// Packy token-group and endpoint filters on 2026-09-08. Unknown models fail
// closed; callers must not infer a protocol from a provider or model prefix.
func ResolvePackyModelProtocol(model string) (PackyUpstreamProtocol, bool) {
	normalized := strings.ToLower(strings.TrimSpace(model))
	switch normalized {
	case "gpt-5.4-mini", "gpt-5.5", "gpt-5.6-luna", "gpt-5.6-sol", "gpt-5.6-terra", "gpt-6-astra", "codex-auto-review",
		"grok-4.5", "grok-4.6":
		return PackyProtocolOpenAIResponses, true
	case "claude-fable-5", "claude-haiku-4-5-20251001", "claude-opus-4-5-20251101", "claude-opus-4-6", "claude-opus-4-7", "claude-opus-4-8", "claude-opus-5", "claude-sonnet-4-5-20250929", "claude-sonnet-4-6", "claude-sonnet-5":
		return PackyProtocolAnthropicMessages, true
	case "gpt-5.4", "minimax-m3", "glm-5", "glm-5.2", "glm-5.3", "glm-5.3-flash", "kimi-k2.5", "minimax-m2.5", "minimax-m2.7",
		"deepseek-v4.1-flash", "deepseek-v4-pro",
		"qwen3-coder-next", "qwen3-max", "qwen3-vl-flash", "qwen3.5-flash", "qwen3.5-plus", "qwen3.6-max-preview", "qwen3.6-plus", "qwen3.7-max", "qwen3.7-plus", "qwen3.8-flash", "qwen3.8-max", "qwen3.8-max-0902",
		"gemini-2.5-flash", "gemini-2.5-pro", "gemini-3-flash-preview", "gemini-3-pro-preview", "gemini-3.1-pro-preview", "gemini-3.5-flash":
		return PackyProtocolOpenAIChat, true
	default:
		return PackyProtocolUnknown, false
	}
}

// PackyModelRequiresResponses remains as a compatibility helper for existing
// routing call sites while protocol-aware dispatch is introduced.
func PackyModelRequiresResponses(model string) bool {
	protocol, ok := ResolvePackyModelProtocol(model)
	return ok && protocol == PackyProtocolOpenAIResponses
}
