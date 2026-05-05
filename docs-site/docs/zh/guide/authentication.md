# 认证

OwnAPI 使用 **Bearer Token** 方式进行 API 认证。

## 认证头格式

在所有 API 请求中，必须包含以下 HTTP Header：

```
Authorization: Bearer YOUR_API_KEY
```

::: warning 注意
- `Bearer` 后面必须有一个空格
- API Key 不要包含 `Bearer` 前缀本身
- Header 名称 `Authorization` 区分大小写
:::

## 完整请求示例

```bash
curl https://ownapi.dev/v1/chat/completions \
  -H "Authorization: Bearer sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-5.4", "messages": [{"role": "user", "content": "Hi"}]}'
```

## 错误响应

如果认证失败，API 将返回以下错误：

### 401 Unauthorized - API Key 无效或缺失

```json
{
  "code": "INVALID_API_KEY",
  "message": "Invalid API key"
}
```

### 403 Forbidden - API Key 已被禁用或过期

```json
{
  "code": "FORBIDDEN",
  "message": "API key has been disabled"
}
```

## 在 SDK 中配置

### Python openai

```python
from openai import OpenAI

client = OpenAI(
    base_url="https://ownapi.dev/v1",
    api_key="YOUR_API_KEY"  # 或从环境变量读取
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

## 安全最佳实践

1. **使用环境变量存储 API Key**，不要硬编码在代码中
2. **不要在客户端（浏览器/移动端）直接暴露 API Key**，应通过后端代理
3. **定期轮换 API Key**，在平台管理后台可重新生成
4. **监控用量**，及时发现异常调用

## 获取 API Key

前往 [OwnAPI 平台](https://ownapi.dev) 登录后，在「用户中心」→「API Key 管理」中创建和管理你的密钥。
