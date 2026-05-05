# Model List

OwnAPI supports the following models, all accessible through a unified API interface.

## Supported Models

### OpenAI Series

| Model Name | Model ID | Description |
|-----------|----------|-------------|
| GPT-5.5 | `gpt-5.5` | Enhanced flagship model, best performance |
| GPT-5.4 | `gpt-5.4` | Latest multimodal flagship model |
| GPT-5.3 Codex | `gpt-5.3-codex` | Code generation specialized model |

### Claude Series

| Model Name | Model ID | Description |
|-----------|----------|-------------|
| Claude Opus 4.7 | `claude-opus-4-7` | Strongest reasoning capability |
| Claude Opus 4.6 | `claude-opus-4-6` | Top-tier performance |
| Claude Sonnet 4.6 | `claude-sonnet-4-6` | Balanced, best value |
| Claude Haiku 4.5 | `claude-haiku-4-5` | Fast response, low cost |

## Get Model List via API

```bash
curl https://ownapi.dev/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY"
```

Response example:

```json
{
  "object": "list",
  "data": [
    {
      "id": "gpt-5.5",
      "object": "model",
      "created": 1686935002,
      "owned_by": "openai"
    },
    {
      "id": "claude-opus-4-7",
      "object": "model",
      "created": 1686935002,
      "owned_by": "anthropic"
    }
  ]
}
```

## Usage Examples

### GPT-5.5

```bash
curl https://ownapi.dev/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-5.5",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

### Claude Opus 4.7

```bash
curl https://ownapi.dev/v1/messages \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude-opus-4-7",
    "max_tokens": 1024,
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

## Group Model Allowlist

Administrators can configure a **model allowlist** for different user groups:

- Only models in the allowlist can be called by users in that group
- Requests for models outside the allowlist will return `404` or permission errors
- Groups can also configure **multipliers** (affecting billing) and **concurrency/RPM limits**

For specific available models, please consult your platform administrator or check the user center.
