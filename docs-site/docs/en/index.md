---
layout: home

hero:
  name: "OwnAPI"
  text: "Documentation"
  tagline: AI API Gateway & Quota Management Platform
  image:
    src: /logo.png
    alt: OwnAPI
  actions:
    - theme: brand
      text: Quick Start
      link: /en/guide/getting-started
    - theme: alt
      text: API Reference
      link: /en/api/openai

features:
  - title: 🚀 Multi-Platform Compatible
    details: Supports OpenAI, Anthropic Claude, and Google Gemini native API formats. Switch models with one line of code.
  - title: 🔑 Unified API Key
    details: Use a single platform-generated API Key to call all supported models. No need to manage multiple upstream accounts.
  - title: 💰 Flexible Billing
    details: Supports balance deduction, subscription plans, group multipliers, concurrency and RPM limits.
  - title: ⚡ High Availability
    details: Automatic upstream account pool scheduling with failover and load balancing.
---

## Quick Start

```bash
# Just change base_url and api_key
curl https://ownapi.dev/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

## Supported API Formats

| Platform | Endpoint | SDK |
|------|------|-----|
| OpenAI | `/v1/chat/completions` | `openai` Python/JS SDK |
| Claude | `/v1/messages` | `anthropic` Python/JS SDK |
| Gemini | `/v1beta/models/...` | Google GenAI SDK |

See [Quick Start](/en/guide/getting-started) for details.
