# OpenAI Compatible API

OwnAPI provides interfaces fully compatible with the OpenAI API, supporting direct integration using the official `openai` SDK.

## Base URL

```
https://ownapi.dev/v1
```

## Chat Completions

Create a chat completion. Supports both streaming and non-streaming responses.

### Request

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

### Request Parameters

| Parameter | Type | Required | Description |
|------|------|------|------|
| `model` | string | Yes | Model ID, e.g., `gpt-5.4`, `gpt-5.5` |
| `messages` | array | Yes | List of messages with `role` and `content` |
| `temperature` | float | No | Sampling temperature, 0-2, default 1 |
| `max_tokens` | integer | No | Maximum number of tokens to generate |
| `stream` | boolean | No | Whether to stream output, default false |
| `top_p` | float | No | Nucleus sampling, 0-1 |
| `frequency_penalty` | float | No | Frequency penalty, -2 to 2 |
| `presence_penalty` | float | No | Presence penalty, -2 to 2 |

### Response

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

### Streaming Response

Set `"stream": true`. The response will be returned character-by-character using SSE (Server-Sent Events):

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

Python streaming example:

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

OpenAI Responses API compatible interface, supporting conversations and tool calls.

### Request

```bash
curl https://ownapi.dev/v1/responses \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-5.4",
    "input": "What is the weather like?"
  }'
```

### Request Parameters

| Parameter | Type | Required | Description |
|------|------|------|------|
| `model` | string | Yes | Model ID |
| `input` | string/array | Yes | User input or message list |
| `tools` | array | No | List of tool definitions |
| `tool_choice` | string/object | No | Tool selection strategy |
| `stream` | boolean | No | Whether to stream output |

### Response

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

### Alias Endpoints

The following endpoints all route to the same handler:

- `POST /v1/responses`
- `POST /responses`
- `POST /responses/{subpath}`
- `POST /backend-api/codex/responses`
- `GET /v1/responses` (WebSocket)

## Images Generations

Generate images (DALL-E compatible).

### Request

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

### Request Parameters

| Parameter | Type | Required | Description |
|------|------|------|------|
| `model` | string | Yes | Image model, e.g., `gpt-5.4` |
| `prompt` | string | Yes | Image description |
| `n` | integer | No | Number of images, default 1 |
| `size` | string | No | Size, e.g., `1024x1024` |
| `quality` | string | No | `standard` or `hd` |
| `style` | string | No | `vivid` or `natural` |

### Response

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

Edit images.

```bash
curl https://ownapi.dev/v1/images/edits \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -F image="@otter.png" \
  -F mask="@mask.png" \
  -F prompt="A cute baby sea otter wearing a beret" \
  -F n=1 \
  -F size="1024x1024"
```

## Models List

Get the list of available models.

```bash
curl https://ownapi.dev/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY"
```

Response format is consistent with OpenAI:

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

## Notes

- All parameters and response formats are consistent with the official OpenAI API
- Streaming responses use SSE format; ensure your client supports it
- Image-related APIs are only available for OpenAI groups; other platform groups will receive 404
- Supports `Codex CLI` direct endpoint `/backend-api/codex/responses`
