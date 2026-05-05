# Model List

OwnAPI supports models from multiple upstream platforms. The specific available models depend on the upstream accounts and group policies configured by the administrator.

## Dynamic Model List

The model list below is fetched from the API in real-time. **Note: This section requires a valid API Key for authentication**. If you are not currently logged into the platform, a loading failure message will be displayed below — this is expected, as the static documentation in your browser cannot carry your private API Key.

Use your own API Key in your code to call the `/v1/models` endpoint and retrieve the full list of available models. The "Common Models" table below lists the models typically supported by the platform for reference.

<ModelList lang="en" />

## Common Models

The following models are typically supported by the platform (actual availability depends on administrator configuration):

### OpenAI Models

| Model ID | Description |
|---------|------|
| `gpt-4o` | Latest multimodal flagship model |
| `gpt-4o-mini` | Fast, cost-effective version |
| `gpt-4-turbo` | 128K context window |
| `gpt-4` | Standard GPT-4 |
| `gpt-3.5-turbo` | Fast, low-cost |
| `dall-e-3` | Image generation |

### Claude Models

| Model ID | Description |
|---------|------|
| `claude-3-5-sonnet-20241022` | Latest Sonnet |
| `claude-3-5-haiku-20241022` | Fast Haiku |
| `claude-3-opus-20240229` | Most capable Opus |

### Gemini Models

| Model ID | Description |
|---------|------|
| `gemini-1.5-pro` | Multimodal professional version |
| `gemini-1.5-flash` | Fast response version |
| `gemini-1.0-pro` | Standard version |

## Get Model List via API

```bash
curl https://ownapi.dev/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY"
```

Response format:

```json
{
  "object": "list",
  "data": [
    {
      "id": "gpt-4o",
      "object": "model",
      "created": 1686935002,
      "owned_by": "openai"
    }
  ]
}
```

## Group Model Allowlist

Administrators can configure a **model allowlist** for different user groups:

- Only models in the allowlist can be called by users in that group
- Requests for models outside the allowlist will return `404` or permission errors
- Groups can also configure **multipliers** (affecting billing) and **concurrency/RPM limits**

For specific available models, please consult your platform administrator or check the user center.
