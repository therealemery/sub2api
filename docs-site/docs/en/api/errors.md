# Error Codes

OwnAPI uses standard HTTP status codes and JSON error response bodies. All error responses contain `code` and `message` fields.

## Error Response Format

```json
{
  "code": "ERROR_CODE",
  "message": "Human readable error description"
}
```

## HTTP Status Codes

| Status | Meaning | Common Scenarios |
|--------|------|----------|
| **200** | Success | Request processed normally |
| **400** | Bad Request | JSON format error, missing required parameters |
| **401** | Unauthorized | Missing or invalid API Key |
| **403** | Forbidden | API Key disabled, group has no permission, insufficient balance |
| **404** | Not Found | Model does not exist, endpoint does not exist |
| **429** | Too Many Requests | RPM limit or concurrency limit triggered |
| **500** | Internal Server Error | Upstream service exception, system error |
| **502** | Bad Gateway | Upstream service unavailable |
| **503** | Service Unavailable | All upstream accounts temporarily unavailable |

## Common Error Codes

### Authentication

| Code | Status | Description | Solution |
|--------|--------|------|----------|
| `INVALID_API_KEY` | 401 | Invalid API Key | Check if the Key is correct and has no extra spaces |
| `MISSING_API_KEY` | 401 | No API Key provided | Add `Authorization: Bearer xxx` to the Header |
| `API_KEY_DISABLED` | 403 | API Key has been disabled | Contact administrator or regenerate Key |
| `API_KEY_EXPIRED` | 403 | API Key has expired | Generate a new Key on the platform |

### Permissions & Resources

| Code | Status | Description | Solution |
|--------|--------|------|----------|
| `FORBIDDEN` | 403 | No access permission | Check group permissions and model allowlist |
| `INSUFFICIENT_BALANCE` | 403 | Insufficient balance | Recharge or purchase a subscription plan |
| `MODEL_NOT_FOUND` | 404 | Model does not exist | Check model ID spelling, confirm group allowlist |
| `ENDPOINT_NOT_FOUND` | 404 | Endpoint does not exist | Check if the URL path is correct |
| `GROUP_NOT_FOUND` | 404 | User not assigned to a group | Contact administrator to assign a group |

### Rate Limiting

| Code | Status | Description | Solution |
|--------|--------|------|----------|
| `RATE_LIMIT_EXCEEDED` | 429 | RPM limit triggered | Reduce request frequency, retry later |
| `CONCURRENCY_LIMIT_EXCEEDED` | 429 | Concurrency limit triggered | Reduce simultaneous requests |
| `TOO_MANY_REQUESTS` | 429 | Global rate limiting | Wait and retry |

### Upstream Services

| Code | Status | Description | Solution |
|--------|--------|------|----------|
| `SERVICE_UNAVAILABLE` | 503 | No upstream accounts available | Retry later, contact administrator to check account pool |
| `UPSTREAM_ERROR` | 502/504 | Upstream service error | Automatic failover in progress, retry later |
| `UPSTREAM_TIMEOUT` | 504 | Upstream response timeout | Check request parameters, reduce max_tokens or shorten request |
| `ACCOUNT_SWITCH_LIMIT` | 503 | Account switch limit exceeded | Reduce concurrent requests, or contact administrator to increase limit |

### Content

| Code | Status | Description | Solution |
|--------|--------|------|----------|
| `CONTENT_FILTERED` | 400 | Content filtered by safety checks | Modify request content, avoid sensitive topics |
| `CONTEXT_LENGTH_EXCEEDED` | 400 | Context length exceeded | Reduce message history or text length |
| `INVALID_PARAMETER` | 400 | Parameter format error | Check parameter types and ranges against documentation |

## Error Handling Best Practices

### Exponential Backoff Retry

When encountering 429 or 5xx errors, implement exponential backoff:

```python
import time
import random

def exponential_backoff(attempt):
    return min(2 ** attempt + random.uniform(0, 1), 60)

# Retry logic
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

### Check Error Types

```python
from openai import OpenAI

client = OpenAI(base_url="https://ownapi.dev/v1", api_key="YOUR_KEY")

try:
    response = client.chat.completions.create(...)
except client.error.AuthenticationError:
    print("Invalid API Key")
except client.error.RateLimitError:
    print("Rate limit triggered")
except client.error.APIConnectionError:
    print("Connection failed")
except client.error.APIError as e:
    print(f"API Error: {e.code} - {e.message}")
```

### Errors in Streaming Responses

Errors may occur mid-stream:

```python
for chunk in response:
    if chunk.choices[0].finish_reason == "error":
        print("Stream interrupted")
        break
```

## Getting Help

If you encounter an unlisted error:

1. Check the system announcements on the [OwnAPI platform](https://ownapi.dev)
2. Look at the `X-Request-ID` in the response headers and provide it to the administrator for troubleshooting
3. Check "Monitoring" → "Error Logs" in the admin panel for detailed information
