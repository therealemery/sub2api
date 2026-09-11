import { describe, expect, it } from 'vitest'
import {
  DC_API_BASE_URL,
  DC_API_VIDEO_MODEL,
  ALIBABA_VIDEO_MODELS,
  applyManagedUpstreamCredentials,
  applyManagedUpstreamExtra,
  isManagedVideoProvider,
  normalizeAlibabaVideoBaseURL,
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

  it('normalizes Alibaba Workspace URLs and locks the exact Wan models', () => {
    const compatible = 'https://ws-example.us-east-1.maas.aliyuncs.com/compatible-mode/v1'
    const root = 'https://ws-example.us-east-1.maas.aliyuncs.com/api/v1'
    expect(normalizeAlibabaVideoBaseURL(compatible)).toBe(root)
    expect(normalizeAlibabaVideoBaseURL(`${root}/services/aigc/video-generation/video-synthesis`)).toBe(root)
    expect(applyManagedUpstreamCredentials('alibaba-video', {
      base_url: compatible,
      api_key: 'keep-secret',
      model: 'old',
      compact_model_mapping: { old: 'old' }
    })).toEqual({
      base_url: root,
      api_key: 'keep-secret',
      model_mapping: Object.fromEntries(ALIBABA_VIDEO_MODELS.map(model => [model, model]))
    })
  })

  it('treats Alibaba and DC-API as managed video providers', () => {
    expect(isManagedVideoProvider('alibaba-video')).toBe(true)
    expect(isManagedVideoProvider('dc-api')).toBe(true)
    expect(isManagedVideoProvider('packyapi')).toBe(false)
    expect(applyManagedUpstreamExtra('alibaba-video', {
      openai_passthrough: true,
      openai_ws_enabled: true,
      quota_limit: 2
    })).toEqual({ upstream_provider: 'alibaba-video', quota_limit: 2 })
  })
})
