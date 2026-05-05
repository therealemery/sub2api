# 错误码

OwnAPI 使用标准的 HTTP 状态码和 JSON 错误响应体。所有错误响应均包含 `code` 和 `message` 字段。

## 错误响应格式

```json
{
  "code": "ERROR_CODE",
  "message": "Human readable error description"
}
```

## HTTP 状态码

| 状态码 | 含义 | 常见场景 |
|--------|------|----------|
| **200** | 成功 | 请求正常处理 |
| **400** | 请求参数错误 | JSON 格式错误、缺少必填参数 |
| **401** | 未授权 | API Key 缺失或无效 |
| **403** | 禁止访问 | API Key 被禁用、分组无权限、余额不足 |
| **404** | 未找到 | 模型不存在、端点不存在 |
| **429** | 请求过多 | 触发 RPM 限制或并发限制 |
| **500** | 服务器内部错误 | 上游服务异常、系统错误 |
| **502** | 网关错误 | 上游服务不可用 |
| **503** | 服务不可用 | 所有上游账号暂时不可用 |

## 常见错误码

### 认证相关

| 错误码 | 状态码 | 说明 | 解决方案 |
|--------|--------|------|----------|
| `INVALID_API_KEY` | 401 | API Key 无效 | 检查 Key 是否正确，是否包含空格 |
| `MISSING_API_KEY` | 401 | 未提供 API Key | 在 Header 中添加 `Authorization: Bearer xxx` |
| `API_KEY_DISABLED` | 403 | API Key 已被禁用 | 联系管理员或重新生成 Key |
| `API_KEY_EXPIRED` | 403 | API Key 已过期 | 在平台重新生成新 Key |

### 权限与资源

| 错误码 | 状态码 | 说明 | 解决方案 |
|--------|--------|------|----------|
| `FORBIDDEN` | 403 | 无权限访问 | 检查分组权限和模型白名单 |
| `INSUFFICIENT_BALANCE` | 403 | 余额不足 | 充值或购买订阅套餐 |
| `MODEL_NOT_FOUND` | 404 | 模型不存在 | 检查模型 ID 拼写，确认分组白名单 |
| `ENDPOINT_NOT_FOUND` | 404 | 端点不存在 | 检查 URL 路径是否正确 |
| `GROUP_NOT_FOUND` | 404 | 用户未分配分组 | 联系管理员分配分组 |

### 限流相关

| 错误码 | 状态码 | 说明 | 解决方案 |
|--------|--------|------|----------|
| `RATE_LIMIT_EXCEEDED` | 429 | RPM 限制触发 | 降低请求频率，稍后重试 |
| `CONCURRENCY_LIMIT_EXCEEDED` | 429 | 并发限制触发 | 减少同时进行的请求数 |
| `TOO_MANY_REQUESTS` | 429 | 全局限流 | 等待一段时间后重试 |

### 上游服务

| 错误码 | 状态码 | 说明 | 解决方案 |
|--------|--------|------|----------|
| `SERVICE_UNAVAILABLE` | 503 | 暂无可用上游账号 | 稍后重试，联系管理员检查账号池 |
| `UPSTREAM_ERROR` | 502/504 | 上游服务错误 | 自动故障转移中，稍后重试 |
| `UPSTREAM_TIMEOUT` | 504 | 上游响应超时 | 检查请求参数，减少 max_tokens 或缩短请求 |
| `ACCOUNT_SWITCH_LIMIT` | 503 | 账号切换次数超限 | 减少并发请求，或联系管理员增加上限 |

### 内容相关

| 错误码 | 状态码 | 说明 | 解决方案 |
|--------|--------|------|----------|
| `CONTENT_FILTERED` | 400 | 内容被安全过滤 | 修改请求内容，避免敏感话题 |
| `CONTEXT_LENGTH_EXCEEDED` | 400 | 超出上下文长度 | 减少 messages 中的历史记录或文本长度 |
| `INVALID_PARAMETER` | 400 | 参数格式错误 | 对照文档检查参数类型和范围 |

## 错误处理最佳实践

### 指数退避重试

遇到 429 或 5xx 错误时，建议实现指数退避：

```python
import time
import random

def exponential_backoff(attempt):
    return min(2 ** attempt + random.uniform(0, 1), 60)

# 重试逻辑
for attempt in range(5):
    try:
        response = client.chat.completions.create(...)
        break
    except Exception as e:
        if e.status_code in [429, 502, 503, 504]:
            wait = exponential_backoff(attempt)
            time.sleep(wait)
        else:
            raise
```

### 检查错误类型

```python
from openai import OpenAI

client = OpenAI(base_url="https://ownapi.dev/v1", api_key="YOUR_KEY")

try:
    response = client.chat.completions.create(...)
except client.error.AuthenticationError:
    print("API Key 无效")
except client.error.RateLimitError:
    print("触发限流")
except client.error.APIConnectionError:
    print("连接失败")
except client.error.APIError as e:
    print(f"API 错误: {e.code} - {e.message}")
```

### 流式响应中的错误

流式响应中可能在中途返回错误：

```python
for chunk in response:
    if chunk.choices[0].finish_reason == "error":
        print("流式输出中断")
        break
```

## 获取帮助

如果遇到未列出的错误：

1. 检查 [OwnAPI 平台](https://ownapi.dev) 的系统公告
2. 查看响应头中的 `X-Request-ID`，提供给管理员排查
3. 在管理后台查看「监控」→「错误日志」获取详细信息
