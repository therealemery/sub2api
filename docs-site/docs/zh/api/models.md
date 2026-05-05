# 模型列表

OwnAPI 支持以下模型，所有模型均通过统一的 API 接口访问。

## 支持的模型

### OpenAI 系列

| 模型名称 | 模型 ID | 说明 |
|---------|---------|------|
| GPT-5.5 | `gpt-5.5` | 增强版旗舰模型，最强性能 |
| GPT-5.4 | `gpt-5.4` | 最新多模态旗舰模型 |
| GPT-5.3 Codex | `gpt-5.3-codex` | 代码生成专用模型 |

### Claude 系列

| 模型名称 | 模型 ID | 说明 |
|---------|---------|------|
| Claude Opus 4.7 | `claude-opus-4-7` | 最强推理能力 |
| Claude Opus 4.6 | `claude-opus-4-6` | 顶级性能 |
| Claude Sonnet 4.6 | `claude-sonnet-4-6` | 平衡型，性价比最佳 |
| Claude Haiku 4.5 | `claude-haiku-4-5` | 快速响应，低成本 |

## 通过 API 获取模型列表

```bash
curl https://ownapi.dev/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY"
```

响应示例：

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

## 使用示例

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

## 分组模型白名单

管理员可以为不同用户分组配置**模型白名单**：

- 只有白名单内的模型才能被该分组用户调用
- 超出白名单范围的模型请求将返回 `404` 或权限错误
- 分组还可配置**倍率**（影响计费）和**并发/RPM 限制**

具体可用模型请咨询平台管理员或在用户中心查看。
