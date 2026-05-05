# Authentication

OwnAPI uses **Bearer Token** authentication for all API requests.

## Authorization Header

Include the following HTTP Header in all API requests:

```
Authorization: Bearer YOUR_API_KEY
```

::: warning Note
- There must be a space after `Bearer`
- Do not include the `Bearer` prefix as part of the API Key itself
- The header name `Authorization` is case-sensitive
:::

## Complete Request Example

```bash
curl https://ownapi.dev/v1/chat/completions \
  -H "Authorization: Bearer sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-4o", "messages": [{"role": "user", "content": "Hi"}]}'
```

## Error Responses

If authentication fails, the API returns the following errors:

### 401 Unauthorized - Invalid or Missing API Key

```json
{
  "code": "INVALID_API_KEY",
  "message": "Invalid API key"
}
```

### 403 Forbidden - API Key Disabled or Expired

```json
{
  "code": "FORBIDDEN",
  "message": "API key has been disabled"
}
```

## SDK Configuration

### Python openai

```python
from openai import OpenAI

client = OpenAI(
    base_url="https://ownapi.dev/v1",
    api_key="YOUR_API_KEY"  # Or read from environment variable
)
```

### Node.js openai

```javascript
import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: 'https://ownapi.dev/v1',
  apiKey: process.env.OWNAPI_API_KEY
});
```

### Anthropic Python SDK

```python
from anthropic import Anthropic

client = Anthropic(
    base_url="https://ownapi.dev/v1",
    api_key="YOUR_API_KEY"
)
```

## Security Best Practices

1. **Store API Keys in environment variables**, do not hardcode in source code
2. **Do not expose API Keys in client-side code** (browser/mobile). Use a backend proxy instead
3. **Rotate API Keys regularly**. You can regenerate them in the platform admin panel
4. **Monitor usage** to detect abnormal calls early

## Getting Your API Key

Log in to the [OwnAPI platform](https://ownapi.dev), then navigate to "User Center" → "API Key Management" to create and manage your keys.
