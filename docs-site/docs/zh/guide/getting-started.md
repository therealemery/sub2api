# 快速开始

OwnAPI 提供与主流 AI 平台兼容的 API 接口。只需修改 API 的 `base_url` 和 `api_key`，即可将现有应用接入 OwnAPI。

## Base URL

所有 API 请求的基础地址：

```
https://ownapi.dev
```

## 获取 API Key

1. 登录 [OwnAPI 平台](https://ownapi.dev)
2. 进入「用户中心」→「API Key 管理」
3. 点击「创建 Key」，复制生成的密钥

::: tip 安全提示
API Key 是调用接口的唯一凭证，请妥善保管，不要在客户端代码或公共仓库中暴露。
:::

## 第一个请求

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
  dangerouslyAllowBrowser: true // 仅浏览器环境需要
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

## 下一步

- [认证方式](/zh/guide/authentication) - 了解详细的认证机制
- [OpenAI 兼容 API](/zh/api/openai) - Chat Completions、Responses、Images
- [Claude 兼容 API](/zh/api/claude) - Messages API
- [Gemini 兼容 API](/zh/api/gemini) - Google GenAI SDK
