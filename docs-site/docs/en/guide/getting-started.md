# Quick Start

OwnAPI provides API interfaces compatible with mainstream AI platforms. Simply change the API `base_url` and `api_key` to integrate your existing applications.

## Base URL

The base address for all API requests:

```
https://ownapi.dev
```

## Get Your API Key

1. Log in to the [OwnAPI platform](https://ownapi.dev)
2. Go to "User Center" → "API Key Management"
3. Click "Create Key" and copy the generated key

::: tip Security Tip
Your API Key is the sole credential for API access. Please keep it secure and do not expose it in client-side code or public repositories.
:::

## Your First Request

### cURL

```bash
curl https://ownapi.dev/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-5.4",
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Hello!"}
    ]
  }'
```

### Python (openai SDK)

```python
from openai import OpenAI

client = OpenAI(
    base_url="https://ownapi.dev/v1",
    api_key="YOUR_API_KEY"
)

response = client.chat.completions.create(
    model="gpt-5.4",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Hello!"}
    ]
)

print(response.choices[0].message.content)
```

### JavaScript/TypeScript

```javascript
import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: 'https://ownapi.dev/v1',
  apiKey: 'YOUR_API_KEY',
  dangerouslyAllowBrowser: true // Only needed for browser environments
});

const response = await client.chat.completions.create({
  model: 'gpt-5.4',
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Hello!' }
  ]
});

console.log(response.choices[0].message.content);
```

### Go

```go
package main

import (
	"context"
	"fmt"
	"os"

	"github.com/sashabaranov/go-openai"
)

func main() {
	client := openai.NewClientWithConfig(openai.ClientConfig{
		BaseURL: "https://ownapi.dev/v1",
		APIKey:  os.Getenv("OWNAPI_API_KEY"),
	})

	resp, err := client.CreateChatCompletion(
		context.Background(),
		openai.ChatCompletionRequest{
			Model: "gpt-5.4",
			Messages: []openai.ChatCompletionMessage{
				{Role: openai.ChatMessageRoleSystem, Content: "You are a helpful assistant."},
				{Role: openai.ChatMessageRoleUser, Content: "Hello!"},
			},
		},
	)
	if err != nil {
		panic(err)
	}

	fmt.Println(resp.Choices[0].Message.Content)
}
```

## Next Steps

- [Authentication](/en/guide/authentication) - Learn about the authentication mechanism
- [OpenAI Compatible API](/en/api/openai) - Chat Completions, Responses, Images
- [Claude Compatible API](/en/api/claude) - Messages API
- [Gemini Compatible API](/en/api/gemini) - Google GenAI SDK
