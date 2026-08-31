import { describe, expect, it } from 'vitest'
import { buildHomeCodeExample, resolveApiBaseUrl } from '../homeCodeExample'

describe('home code example', () => {
  it('builds a deployment-aware v1 API URL', () => {
    expect(resolveApiBaseUrl('https://api.example.com/')).toBe('https://api.example.com/v1')
  })

  it('uses the deployment URL in the Python example', () => {
    const example = buildHomeCodeExample('https://gateway.example.com')

    expect(example).toContain('base_url="https://gateway.example.com/v1"')
    expect(example).toContain('api_key="YOUR_API_KEY"')
    expect(example).toContain('client.chat.completions.create')
  })
})
