import { describe, expect, it } from 'vitest'
import {
  DC_API_BASE_URL,
  DC_API_VIDEO_MODEL,
  applyManagedUpstreamCredentials,
  applyManagedUpstreamExtra,
  normalizeDCAPIBaseURL
} from '../managedUpstream'

describe('managed upstream credentials', () => {
  it('normalizes legacy DC-API video resource URLs to the service root', () => {
    expect(normalizeDCAPIBaseURL('https://console.dc-api.com/v1/videos')).toBe(DC_API_BASE_URL)
    expect(normalizeDCAPIBaseURL('https://console.dc-api.com/v1/videos/')).toBe(DC_API_BASE_URL)
    expect(normalizeDCAPIBaseURL(DC_API_BASE_URL)).toBe(DC_API_BASE_URL)
  })

  it('locks DC-API accounts to the H3 service root and exact model', () => {
    expect(applyManagedUpstreamCredentials('dc-api', {
      base_url: 'https://wrong.example/v1/videos',
      api_key: 'keep-secret',
      compact_model_mapping: { old: 'old' }
    })).toEqual({
      base_url: DC_API_BASE_URL,
      api_key: 'keep-secret',
      model: DC_API_VIDEO_MODEL,
      model_mapping: { [DC_API_VIDEO_MODEL]: DC_API_VIDEO_MODEL }
    })
  })

  it('removes only the DC-API dedicated model when changing provider', () => {
    expect(applyManagedUpstreamCredentials('', {
      base_url: DC_API_BASE_URL,
      api_key: 'keep-secret',
      model: DC_API_VIDEO_MODEL,
      model_mapping: { [DC_API_VIDEO_MODEL]: DC_API_VIDEO_MODEL },
      pool_mode: true
    }, 'dc-api')).toEqual({
      base_url: DC_API_BASE_URL,
      api_key: 'keep-secret',
      model_mapping: { [DC_API_VIDEO_MODEL]: DC_API_VIDEO_MODEL },
      pool_mode: true
    })
  })

  it('removes unrelated OpenAI features from DC-API account metadata', () => {
    expect(applyManagedUpstreamExtra('dc-api', {
      upstream_provider: 'packyapi',
      openai_passthrough: true,
      openai_oauth_passthrough: true,
      openai_compact_mode: 'force_on',
      openai_apikey_responses_websockets_v2_mode: 'passthrough',
      openai_apikey_responses_websockets_v2_enabled: true,
      codex_image_generation_bridge: true,
      quota_limit: 1
    })).toEqual({
      upstream_provider: 'dc-api',
      quota_limit: 1
    })
  })
})
