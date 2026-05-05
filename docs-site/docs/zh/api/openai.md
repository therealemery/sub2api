# OpenAI 兼容 API

OwnAPI 提供与 OpenAI API 完全兼容的接口，支持使用官方 `openai` SDK 直接接入。

## Base URL

```
https://ownapi.dev/v1
```

## Chat Completions

创建聊天补全，支持流式和非流式响应。

### 请求

```bash
curl https://ownapi.dev/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-5.4",
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Hello!"}
    ],
    "temperature": 0.7,
    "max_tokens": 2048,
    "stream": false
  }'
```

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `model` | string | 是 | 模型 ID，如 `gpt-5.4`、`gpt-5.5` |
| `messages` | array | 是 | 消息列表，包含 `role` 和 `content` |
| `temperature` | float | 否 | 采样温度，0-2，默认 1 |
| `max_tokens` | integer | 否 | 最大生成 token 数 |
| `stream` | boolean | 否 | 是否流式输出，默认 false |
| `top_p` | float | 否 | 核采样，0-1 |
| `frequency_penalty` | float | 否 | 频率惩罚，-2 到 2 |
| `presence_penalty` | float | 否 | 存在惩罚，-2 到 2 |

### 响应

```json
{
  "id": "chatcmpl-xxx",
  "object": "chat.completion",
  "created": 1699000000,
  "model": "gpt-5.4",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! How can I assist you today?"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 20,
    "completion_tokens": 10,
    "total_tokens": 30
  }
}
```

### 流式响应

设置 `"stream": true`，响应将以 SSE (Server-Sent Events) 格式逐字返回：

```bash
curl https://ownapi.dev/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-5.4",
    "messages": [{"role": "user", "content": "Hello"}],
    "stream": true
  }'
```

Python 流式示例：

```python
response = client.chat.completions.create(
    model="gpt-5.4",
    messages=[{"role": "user", "content": "Hello"}],
    stream=True
)

for chunk in response:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="")
```

## Responses API

OpenAI Responses API 兼容接口，支持对话和工具调用。

### 请求

```bash
curl https://ownapi.dev/v1/responses \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-5.4",
    "input": "What is the weather like?"
  }'
```

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `model` | string | 是 | 模型 ID |
| `input` | string/array | 是 | 用户输入或消息列表 |
| `tools` | array | 否 | 工具定义列表 |
| `tool_choice` | string/object | 否 | 工具选择策略 |
| `stream` | boolean | 否 | 是否流式输出 |

### 响应

```json
{
  "id": "resp_xxx",
  "object": "response",
  "created_at": 1699000000,
  "model": "gpt-5.4",
  "output": [
    {
      "type": "message",
      "role": "assistant",
      "content": [
        {
          "type": "output_text",
          "text": "I don't have access to real-time weather data..."
        }
      ]
    }
  ],
  "usage": {
    "input_tokens": 10,
    "output_tokens": 20,
    "total_tokens": 30
  }
}
```

### 别名端点

以下端点均指向同一处理器：

- `POST /v1/responses`
- `POST /responses`
- `POST /responses/{subpath}`
- `POST /backend-api/codex/responses`
- `GET /v1/responses`（WebSocket）

## Images Generations

生成图像（DALL-E 兼容）。

### 请求

```bash
curl https://ownapi.dev/v1/images/generations \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-5.4",
    "prompt": "A cute cat wearing a hat",
    "n": 1,
    "size": "1024x1024"
  }'
```

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `model` | string | 是 | 图像模型，如 `gpt-5.4` |
| `prompt` | string | 是 | 图像描述 |
| `n` | integer | 否 | 生成数量，默认 1 |
| `size` | string | 否 | 尺寸，如 `1024x1024` |
| `quality` | string | 否 | `standard` 或 `hd` |
| `style` | string | 否 | `vivid` 或 `natural` |

### 响应

```json
{
  "created": 1699000000,
  "data": [
    {
      "url": "https://...",
      "revised_prompt": "A cute domestic cat..."
    }
  ]
}
```

## Images Edits

编辑图像。

```bash
curl https://ownapi.dev/v1/images/edits \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -F image="@otter.png" \
  -F mask="@mask.png" \
  -F prompt="A cute baby sea otter wearing a beret" \
  -F n=1 \
  -F size="1024x1024"
```

## Models 列表

获取可用模型列表。

```bash
curl https://ownapi.dev/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY"
```

响应格式与 OpenAI 一致：

```json
{
  "object": "list",
  "data": [
    {
      "id": "gpt-5.4",
      "object": "model",
      "created": 1686935002,
      "owned_by": "openai"
    }
  ]
}
```

## 注意事项

- 所有参数和响应格式与 OpenAI 官方 API 保持一致
- 流式响应使用 SSE 格式，需确保客户端支持
- 图像相关 API 仅对 OpenAI 分组可用，其他平台分组调用将返回 404
- 支持 `Codex CLI` 直连端点 `/backend-api/codex/responses`
