# 快速开始与使用流程

本页面向首次使用 OwnAPI 的用户，把“快速开始”和“完整使用流程”放在同一个入口中。你可以先按最短路径完成一次成功调用，再根据自己的工具环境继续配置 Claude Code、OpenAI SDK、VS Code 或 Cursor。

<div class="doc-quick-notices">
  <section class="doc-quick-notice">
    <p class="doc-quick-notice-title">推荐顺序</p>
    <p>注册或登录 OwnAPI → 获取可用额度 → 创建 API Key → 选择可用模型 → 配置工具 → 发起测试请求 → 查看使用记录。</p>
  </section>
  <section class="doc-quick-notice doc-quick-notice--important">
    <p class="doc-quick-notice-title">阅读建议</p>
    <p>建议耐心按顺序阅读本教程。多数接入、配置和排查问题，都可以在本页对应章节中找到处理方法。</p>
  </section>
</div>

## 最短接入路径

如果你已经有账号和可用额度，只需要完成下面三步。

### 1. 创建 API Key

1. 登录 [OwnAPI 平台](https://ownapi.dev)。
2. 进入控制台。
3. 打开「API 密钥」页面。
4. 点击「创建密钥」，按页面提示保存。
5. 复制生成的密钥，后续示例统一写作 `YOUR_OWNAPI_API_KEY`。

::: warning 安全提示
API Key 是调用 OwnAPI 的访问凭证。不要把 API Key 写入公开仓库、网页前端代码、截图或聊天记录中。
:::

### 2. 配置 Base URL

OpenAI 兼容接口使用：

```text
https://ownapi.dev/v1
```

Claude 兼容工具如果要求填写 Anthropic 网关地址，通常使用：

```text
https://ownapi.dev
```

### 3. 发送第一条请求

```bash
curl https://ownapi.dev/v1/chat/completions \
  -H "Authorization: Bearer YOUR_OWNAPI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-5.5",
    "messages": [
      {"role": "user", "content": "请用一句话介绍 OwnAPI"}
    ]
  }'
```

如果请求成功返回模型回复，说明 API Key、额度、模型权限和 Base URL 已经配置正确。

## 1. 注册或登录 OwnAPI

1. 打开 [OwnAPI 平台](https://ownapi.dev)。
2. 点击页面右上角的登录入口。
3. 已有账号直接登录；没有账号时按页面提示完成注册。
4. 登录后进入控制台，后续的 API Key、订阅、兑换、支付和使用记录都在控制台内完成。

如果登录后没有看到控制台入口，请刷新页面或重新登录一次。

## 2. 获取可用额度

调用模型前，账号需要有可用余额、订阅额度或兑换额度。OwnAPI 当前支持以下方式：

| 方式 | 适合场景 | 入口 |
| --- | --- | --- |
| Stripe 支付 | 直接充值或购买额度 | 控制台的充值 / 购买页面 |
| 订阅套餐 | 按套餐额度使用 | 控制台的订阅页面 |
| 兑换码 | 已获得兑换码的用户 | 控制台的兑换页面 |

完成支付、订阅或兑换后，可以在控制台查看当前余额、套餐额度和订单状态。实际到账与价格说明以页面展示为准。

## 3. 创建 API Key

API Key 是调用 OwnAPI 的访问凭证。创建后请妥善保存，不要公开在网页、仓库、截图或聊天记录中。

1. 进入控制台。
2. 打开「API 密钥」页面。
3. 点击「创建密钥」。
4. 按页面提示选择可用配置并保存。
5. 复制生成的密钥，后续示例统一写作 `YOUR_OWNAPI_API_KEY`。

::: warning 生产环境建议
正式项目建议由后端服务持有 API Key，再由前端请求自己的后端接口。不要为了方便测试把 API Key 直接暴露在浏览器端。
:::

## 4. 选择可用模型

创建 API Key 后，请先确认当前账号或密钥可以使用哪些模型。常用模型包括：

| 类型 | 推荐模型 ID | 适用场景 |
| --- | --- | --- |
| OpenAI 兼容 | `gpt-5.5`、`gpt-5.4` | 通用对话、代码、复杂任务 |
| Claude 兼容 | `claude-opus-4-7`、`claude-opus-4-6`、`claude-sonnet-4-6` | 长文本、代码、推理任务 |
| Gemini 兼容 | 以平台模型列表为准 | 多模态和 Google GenAI 生态 |

也可以通过接口查询当前 API Key 可用模型：

```bash
curl https://ownapi.dev/v1/models \
  -H "Authorization: Bearer YOUR_OWNAPI_API_KEY"
```

如果返回模型不存在或无权限，请检查模型 ID 拼写、API Key 状态、分组权限和可用额度。

## 5. 配置 OpenAI 兼容工具

大多数支持 OpenAI SDK 的工具只需要修改 `base_url` 和 `api_key`。

### Python

```python
from openai import OpenAI

client = OpenAI(
    base_url="https://ownapi.dev/v1",
    api_key="YOUR_OWNAPI_API_KEY",
)

response = client.chat.completions.create(
    model="gpt-5.5",
    messages=[
        {"role": "user", "content": "请用一句话介绍 OwnAPI"}
    ],
)

print(response.choices[0].message.content)
```

### Node.js

```javascript
import OpenAI from 'openai'

const client = new OpenAI({
  baseURL: 'https://ownapi.dev/v1',
  apiKey: process.env.OWNAPI_API_KEY,
})

const response = await client.chat.completions.create({
  model: 'gpt-5.5',
  messages: [
    { role: 'user', content: '请用一句话介绍 OwnAPI' },
  ],
})

console.log(response.choices[0].message.content)
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
			Model: "gpt-5.5",
			Messages: []openai.ChatCompletionMessage{
				{Role: openai.ChatMessageRoleUser, Content: "请用一句话介绍 OwnAPI"},
			},
		},
	)
	if err != nil {
		panic(err)
	}

	fmt.Println(resp.Choices[0].Message.Content)
}
```

## 6. 配置 Claude Code

Claude Code 使用 Anthropic 兼容接口时，通常配置两个环境变量：

| 变量名 | 说明 | OwnAPI 示例值 |
| --- | --- | --- |
| `ANTHROPIC_BASE_URL` | Claude Code 访问的网关地址 | `https://ownapi.dev` |
| `ANTHROPIC_AUTH_TOKEN` | OwnAPI API Key，不要加 `Bearer` 前缀 | `YOUR_OWNAPI_API_KEY` |

::: tip 说明
Claude Code 会在请求时拼接 Anthropic 路径，例如 `/v1/messages`。因此这里的 `ANTHROPIC_BASE_URL` 使用 `https://ownapi.dev`，不是 `https://ownapi.dev/v1`。
:::

### Windows：PowerShell 永久配置

```powershell
[System.Environment]::SetEnvironmentVariable("ANTHROPIC_BASE_URL", "https://ownapi.dev", [System.EnvironmentVariableTarget]::User)
[System.Environment]::SetEnvironmentVariable("ANTHROPIC_AUTH_TOKEN", "YOUR_OWNAPI_API_KEY", [System.EnvironmentVariableTarget]::User)
```

查看是否写入成功：

```powershell
[System.Environment]::GetEnvironmentVariable("ANTHROPIC_BASE_URL", [System.EnvironmentVariableTarget]::User)
[System.Environment]::GetEnvironmentVariable("ANTHROPIC_AUTH_TOKEN", [System.EnvironmentVariableTarget]::User)
```

设置后请关闭并重新打开 PowerShell、VS Code、Cursor 等工具。

### macOS：zsh 配置

```bash
echo 'export ANTHROPIC_BASE_URL="https://ownapi.dev"' >> ~/.zshrc
echo 'export ANTHROPIC_AUTH_TOKEN="YOUR_OWNAPI_API_KEY"' >> ~/.zshrc
source ~/.zshrc
```

### Linux / WSL：bash 配置

```bash
echo 'export ANTHROPIC_BASE_URL="https://ownapi.dev"' >> ~/.bashrc
echo 'export ANTHROPIC_AUTH_TOKEN="YOUR_OWNAPI_API_KEY"' >> ~/.bashrc
source ~/.bashrc
```

配置完成后进入项目目录运行：

```bash
claude
```

发送一个简单问题。如果能够正常返回结果，说明 Claude Code 已经通过 OwnAPI 接入成功。

## 7. 配置 VS Code / Cursor 插件

如果你使用 VS Code 或 Cursor 中的 Claude Code 相关插件，通常仍然需要先完成系统环境变量配置。

1. 安装 Claude Code 相关插件。
2. 确认 `ANTHROPIC_BASE_URL` 和 `ANTHROPIC_AUTH_TOKEN` 已配置。
3. 完全退出并重新打开 VS Code 或 Cursor。
4. 在插件入口打开 Claude Code。

如果插件仍然跳转到登录或无法连接，优先检查：

- 编辑器是否在配置环境变量后重启。
- 当前终端是否能读取 `ANTHROPIC_BASE_URL`。
- API Key 是否复制完整。
- 当前 API Key 是否有可用额度和模型权限。

## 8. 查看使用记录

请求成功后，可以回到 OwnAPI 控制台查看：

- API Key 使用情况
- Token 消耗
- 调用费用
- 响应耗时
- 错误记录

如果工具端显示失败，但控制台没有调用记录，通常说明请求没有到达 OwnAPI。请重点检查 Base URL、环境变量和网络代理。

## 9. 常见问题

### 401：API Key 无效

请检查：

- Header 是否为 `Authorization: Bearer YOUR_OWNAPI_API_KEY`。
- Claude Code 中 `ANTHROPIC_AUTH_TOKEN` 是否只填写 API Key 本身，不要加 `Bearer`。
- API Key 是否复制完整，前后没有空格。
- API Key 是否已被删除、禁用或过期。

### 403：无权限或额度不足

请检查：

- 账号是否有余额、订阅额度或兑换额度。
- 当前 API Key 是否绑定了可用分组。
- 当前分组是否允许调用所选模型。

### 404：模型或端点不存在

请检查：

- OpenAI SDK 是否使用 `https://ownapi.dev/v1`。
- Claude Code 是否使用 `https://ownapi.dev`。
- 模型 ID 是否和模型列表一致。
- 当前分组是否支持该平台和模型。

### 429：请求过多

说明触发了 RPM、并发或平台限流。请降低并发、减少重试频率，稍后再试。

### 修改环境变量后仍不生效

请按顺序检查：

1. 关闭并重新打开终端。
2. 关闭并重新打开 VS Code、Cursor 或其他 IDE。
3. macOS / Linux 执行 `source ~/.zshrc` 或 `source ~/.bashrc`。
4. Windows 重新打开 PowerShell，必要时重启电脑。
5. 确认没有旧的 `ANTHROPIC_BASE_URL` 或其他中转站配置覆盖当前设置。

## 下一步

- 查看 [认证方式](/zh/guide/authentication)
- 查看 [OpenAI 兼容 API](/zh/api/openai)
- 查看 [Claude 兼容 API](/zh/api/claude)
- 查看 [Gemini 兼容 API](/zh/api/gemini)
- 查看 [模型列表](/zh/api/models)
