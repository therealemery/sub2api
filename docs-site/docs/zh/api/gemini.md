# Gemini 兼容 API

OwnAPI 提供与 Google Gemini API 兼容的接口，支持使用 Google GenAI SDK 直接接入。

## Base URL

```
https://ownapi.dev/v1beta
```

## 认证方式

Gemini 接口同样使用 Bearer Token 认证：

```
Authorization: Bearer YOUR_API_KEY
```

或作为查询参数：

```
https://ownapi.dev/v1beta/models/gemini-1.5-pro:generateContent?key=YOUR_API_KEY
```

::: tip 建议
推荐使用 Header 方式传递 API Key，安全性更高。
:::

## 生成内容

```bash
curl "https://ownapi.dev/v1beta/models/gemini-1.5-pro:generateContent" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [
      {
        "role": "user",
        "parts": [
          {"text": "Explain how AI works"}
        ]
      }
    ]
  }'
```

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `contents` | array | 是 | 内容列表，包含 `role` 和 `parts` |
| `generationConfig` | object | 否 | 生成配置 |
| `safetySettings` | array | 否 | 安全设置 |

### 内容格式

```json
{
  "contents": [
    {
      "role": "user",
      "parts": [
        {"text": "Hello, how are you?"}
      ]
    }
  ],
  "generationConfig": {
    "temperature": 0.7,
    "maxOutputTokens": 1024,
    "topP": 0.95,
    "topK": 40
  }
}
```

### 响应

```json
{
  "candidates": [
    {
      "content": {
        "role": "model",
        "parts": [
          {"text": "I'm doing well, thank you for asking! How can I help you today?"}
        ]
      },
      "finishReason": "STOP",
      "index": 0,
      "safetyRatings": [...]
    }
  ],
  "usageMetadata": {
    "promptTokenCount": 8,
    "candidatesTokenCount": 15,
    "totalTokenCount": 23
  }
}
```

## 流式生成

添加 `?alt=sse` 或使用 `streamGenerateContent`：

```bash
curl "https://ownapi.dev/v1beta/models/gemini-1.5-pro:streamGenerateContent" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{"role": "user", "parts": [{"text": "Count to 10"}]}]
  }'
```

## 模型列表

### 列出所有模型

```bash
curl "https://ownapi.dev/v1beta/models" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### 获取模型详情

```bash
curl "https://ownapi.dev/v1beta/models/gemini-1.5-pro" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### 响应示例

```json
{
  "models": [
    {
      "name": "models/gemini-1.5-pro",
      "version": "001",
      "displayName": "Gemini 1.5 Pro",
      "description": "Mid-size multimodal model",
      "inputTokenLimit": 1048576,
      "outputTokenLimit": 8192,
      "supportedGenerationMethods": [
        "generateContent",
        "countTokens"
      ]
    }
  ]
}
```

## 多模态输入

Gemini 支持文本、图片、音频、视频输入：

```json
{
  "contents": [
    {
      "role": "user",
      "parts": [
        {
          "inlineData": {
            "mimeType": "image/jpeg",
            "data": "/9j/4AAQSkZJRg..."
          }
        },
        {
          "text": "Describe this image"
        }
      ]
    }
  ]
}
```

## 支持的操作

所有 `/v1beta/models/*` 路径的操作均由 `GeminiV1BetaModels` 处理器处理，支持：

- `:generateContent` - 生成内容
- `:streamGenerateContent` - 流式生成
- `:countTokens` - 计算 token 数
- `:embedContent` - 嵌入内容
- `:batchEmbedContents` - 批量嵌入

## 注意事项

- Gemini 接口使用 `/v1beta` 前缀，与 OpenAI/Claude 的 `/v1` 不同
- API Key 需要属于 Google 平台分组才能调用 Gemini 接口
- 支持 Google AI Studio 和 Vertex AI 两种接入方式
- 流式响应使用 SSE 格式
