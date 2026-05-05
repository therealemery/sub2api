# Gemini Compatible API

OwnAPI provides interfaces compatible with the Google Gemini API, supporting direct integration using the Google GenAI SDK.

## Base URL

```
https://ownapi.dev/v1beta
```

## Authentication

Gemini endpoints also use Bearer Token authentication:

```
Authorization: Bearer YOUR_API_KEY
```

Or as a query parameter:

```
https://ownapi.dev/v1beta/models/gemini-1.5-pro:generateContent?key=YOUR_API_KEY
```

::: tip Recommendation
We recommend using the Header method to pass the API Key for better security.
:::

## Generate Content

```bash
curl "https://ownapi.dev/v1beta/models/gemini-1.5-pro:generateContent" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [
      {
        "role": "user",
        "parts": [
          {"text": "Explain how AI works"}
        ]
      }
    ]
  }'
```

### Request Parameters

| Parameter | Type | Required | Description |
|------|------|------|------|
| `contents` | array | Yes | List of contents with `role` and `parts` |
| `generationConfig` | object | No | Generation configuration |
| `safetySettings` | array | No | Safety settings |

### Content Format

```json
{
  "contents": [
    {
      "role": "user",
      "parts": [
        {"text": "Hello, how are you?"}
      ]
    }
  ],
  "generationConfig": {
    "temperature": 0.7,
    "maxOutputTokens": 1024,
    "topP": 0.95,
    "topK": 40
  }
}
```

### Response

```json
{
  "candidates": [
    {
      "content": {
        "role": "model",
        "parts": [
          {"text": "I'm doing well, thank you for asking! How can I help you today?"}
        ]
      },
      "finishReason": "STOP",
      "index": 0,
      "safetyRatings": [...]
    }
  ],
  "usageMetadata": {
    "promptTokenCount": 8,
    "candidatesTokenCount": 15,
    "totalTokenCount": 23
  }
}
```

## Streaming Generation

Add `?alt=sse` or use `streamGenerateContent`:

```bash
curl "https://ownapi.dev/v1beta/models/gemini-1.5-pro:streamGenerateContent" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{"role": "user", "parts": [{"text": "Count to 10"}]}]
  }'
```

## Models List

### List All Models

```bash
curl "https://ownapi.dev/v1beta/models" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Get Model Details

```bash
curl "https://ownapi.dev/v1beta/models/gemini-1.5-pro" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Response Example

```json
{
  "models": [
    {
      "name": "models/gemini-1.5-pro",
      "version": "001",
      "displayName": "Gemini 1.5 Pro",
      "description": "Mid-size multimodal model",
      "inputTokenLimit": 1048576,
      "outputTokenLimit": 8192,
      "supportedGenerationMethods": [
        "generateContent",
        "countTokens"
      ]
    }
  ]
}
```

## Multimodal Input

Gemini supports text, image, audio, and video input:

```json
{
  "contents": [
    {
      "role": "user",
      "parts": [
        {
          "inlineData": {
            "mimeType": "image/jpeg",
            "data": "/9j/4AAQSkZJRg..."
          }
        },
        {
          "text": "Describe this image"
        }
      ]
    }
  ]
}
```

## Supported Operations

All operations under `/v1beta/models/*` are handled by the `GeminiV1BetaModels` processor, supporting:

- `:generateContent` - Generate content
- `:streamGenerateContent` - Stream generation
- `:countTokens` - Count tokens
- `:embedContent` - Embed content
- `:batchEmbedContents` - Batch embedding

## Notes

- Gemini endpoints use the `/v1beta` prefix, different from OpenAI/Claude's `/v1`
- The API Key must belong to a Google platform group to call Gemini endpoints
- Supports both Google AI Studio and Vertex AI access methods
- Streaming responses use SSE format
