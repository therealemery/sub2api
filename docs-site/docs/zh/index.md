---
layout: home

hero:
  name: "OwnAPI"
  text: "开发者文档"
  tagline: AI API 中转与配额管理平台接入指南
  image:
    src: /logo.svg
    alt: OwnAPI
  actions:
    - theme: brand
      text: 快速开始
      link: /zh/guide/getting-started
    - theme: alt
      text: API 参考
      link: /zh/api/openai

features:
  - title: 🚀 多平台兼容
    details: 支持 OpenAI、Anthropic Claude、Google Gemini 原生 API 格式，一行代码切换模型。
  - title: 🔑 统一 API Key
    details: 通过平台生成的 API Key 即可调用所有支持的模型，无需管理多个上游账号。
  - title: 💰 灵活计费
    details: 支持余额扣费、订阅套餐、分组倍率、并发和 RPM 限制。
  - title: ⚡ 高可用调度
    details: 上游账号池自动调度，支持故障转移和负载均衡。
---

## 快速接入

```bash
# 只需修改 base_url 和 api_key
curl https://ownapi.dev/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-5.5",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

## 支持的 API 格式

| 平台 | 端点 | SDK |
|------|------|-----|
| OpenAI | `/v1/chat/completions` | `openai` Python/JS SDK |
| Claude | `/v1/messages` | `anthropic` Python/JS SDK |
| Gemini | `/v1beta/models/...` | Google GenAI SDK |

更多详情请参阅 [快速开始](/zh/guide/getting-started)。
