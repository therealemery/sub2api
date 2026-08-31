export function resolveApiBaseUrl(origin: string): string {
  return `${origin.replace(/\/+$/, '')}/v1`
}

export function buildHomeCodeExample(origin: string): string {
  return `from openai import OpenAI

client = OpenAI(
    api_key="YOUR_API_KEY",
    base_url="${resolveApiBaseUrl(origin)}",
)

response = client.chat.completions.create(
    model="gpt-5",
    messages=[{"role": "user", "content": "Hello!"}],
)

print(response.choices[0].message.content)`
}
