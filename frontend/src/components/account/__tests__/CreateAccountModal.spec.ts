import { describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'

const { createAccountMock } = vi.hoisted(() => ({
  createAccountMock: vi.fn()
}))

vi.mock('@/stores/app', () => ({
  useAppStore: () => ({
    showError: vi.fn(),
    showSuccess: vi.fn(),
    showInfo: vi.fn()
  })
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ isSimpleMode: true })
}))

vi.mock('@/api/admin', () => ({
  adminAPI: {
    accounts: {
      create: createAccountMock,
      checkMixedChannelRisk: vi.fn().mockResolvedValue({ has_risk: false })
    },
    settings: {
      getWebSearchEmulationConfig: vi.fn().mockResolvedValue({ enabled: false, providers: [] }),
      getSettings: vi.fn().mockResolvedValue({})
    },
    tlsFingerprintProfiles: {
      list: vi.fn().mockResolvedValue([])
    }
  }
}))

vi.mock('@/api/admin/accounts', () => ({
  getAntigravityDefaultModelMapping: vi.fn().mockResolvedValue({})
}))

vi.mock('vue-i18n', async () => {
  const actual = await vi.importActual<typeof import('vue-i18n')>('vue-i18n')
  return {
    ...actual,
    useI18n: () => ({ t: (key: string) => key })
  }
})

import CreateAccountModal from '../CreateAccountModal.vue'

const BaseDialogStub = defineComponent({
  name: 'BaseDialog',
  props: { show: { type: Boolean, default: false } },
  template: '<div v-if="show"><slot /><slot name="footer" /></div>'
})

const ModelWhitelistSelectorStub = defineComponent({
  name: 'ModelWhitelistSelector',
  props: { modelValue: { type: Array, default: () => [] } },
  emits: ['update:modelValue'],
  template: '<div data-testid="model-whitelist-value">{{ modelValue.join(",") }}</div>'
})

const SelectStub = defineComponent({
  name: 'SelectStub',
  props: {
    modelValue: { type: [String, Number, Boolean, null], default: '' },
    options: { type: Array, default: () => [] }
  },
  emits: ['update:modelValue'],
  template: '<select v-bind="$attrs" :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><option v-for="option in options" :key="option.value" :value="option.value">{{ option.label }}</option></select>'
})

function mountModal() {
  return mount(CreateAccountModal, {
    props: { show: true, proxies: [], groups: [] },
    global: {
      stubs: {
        BaseDialog: BaseDialogStub,
        ConfirmDialog: true,
        Select: SelectStub,
        Icon: true,
        ProxySelector: true,
        GroupSelector: true,
        ModelWhitelistSelector: ModelWhitelistSelectorStub,
        QuotaLimitCard: true,
        OAuthAuthorizationFlow: true
      }
    }
  })
}

describe('CreateAccountModal', () => {
  it('creates a model-locked DC-API MiniMax H3 account', async () => {
    createAccountMock.mockReset()
    createAccountMock.mockResolvedValue({})
    const wrapper = mountModal()

    await wrapper.get('input[data-tour="account-form-name"]').setValue('minimax-h3')
    await wrapper.get('[data-testid="platform-openai"]').trigger('click')
    await wrapper.get('[data-testid="account-type-apikey"]').trigger('click')
    await wrapper.get('[data-testid="managed-upstream-provider"]').setValue('dc-api')
    await flushPromises()

    expect((wrapper.get('[data-testid="api-key-base-url"]').element as HTMLInputElement).value)
      .toBe('https://console.dc-api.com')
    expect(wrapper.get('[data-testid="dc-api-model-lock"]').text()).toContain('MiniMax-H3')

    await wrapper.get('[data-testid="api-key-value"]').setValue('test-dc-secret')
    await wrapper.get('form#create-account-form').trigger('submit.prevent')
    await flushPromises()

    expect(createAccountMock).toHaveBeenCalledTimes(1)
    const payload = createAccountMock.mock.calls[0]?.[0]
    expect(payload.extra).toEqual({ upstream_provider: 'dc-api' })
    expect(payload.credentials).toEqual({
      api_key: 'test-dc-secret',
      base_url: 'https://console.dc-api.com',
      model: 'MiniMax-H3',
      model_mapping: { 'MiniMax-H3': 'MiniMax-H3' }
    })
  })

  it('creates an Alibaba Workspace account locked to both Wan models', async () => {
    createAccountMock.mockReset().mockResolvedValue({})
    const wrapper = mountModal()

    await wrapper.get('input[data-tour="account-form-name"]').setValue('wan-video')
    await wrapper.get('[data-testid="platform-openai"]').trigger('click')
    await wrapper.get('[data-testid="account-type-apikey"]').trigger('click')
    await wrapper.get('[data-testid="managed-upstream-provider"]').setValue('alibaba-video')
    await flushPromises()

    expect(wrapper.get('[data-testid="alibaba-video-model-lock"]').text()).toContain('wan3.0-video-prime')
    await wrapper.get('[data-testid="api-key-base-url"]').setValue('https://ws-example.us-east-1.maas.aliyuncs.com/compatible-mode/v1')
    await wrapper.get('[data-testid="api-key-value"]').setValue('test-alibaba-secret')
    await wrapper.get('form#create-account-form').trigger('submit.prevent')
    await flushPromises()

    expect(createAccountMock).toHaveBeenCalledTimes(1)
    expect(createAccountMock.mock.calls[0]?.[0]).toMatchObject({
      extra: { upstream_provider: 'alibaba-video' },
      credentials: {
        api_key: 'test-alibaba-secret',
        base_url: 'https://ws-example.us-east-1.maas.aliyuncs.com/api/v1',
        model_mapping: {
          'wan3.0-video': 'wan3.0-video',
          'wan3.0-video-prime': 'wan3.0-video-prime'
        }
      }
    })
  })
})
