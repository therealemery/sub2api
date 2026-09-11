import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createI18n } from 'vue-i18n'
import UserModelRatesModal from '../UserModelRatesModal.vue'
import en from '@/i18n/locales/en'

const { getModelRateOverrides, setModelRateOverrides, showError } = vi.hoisted(() => ({
  getModelRateOverrides: vi.fn(),
  setModelRateOverrides: vi.fn(),
  showError: vi.fn(),
}))
const listChannels = vi.hoisted(() => vi.fn())

vi.mock('@/api/admin', () => ({
  adminAPI: {
    users: { getModelRateOverrides, setModelRateOverrides },
    channels: { list: listChannels },
  },
}))
vi.mock('@/stores/app', () => ({ useAppStore: () => ({ showError, showSuccess: vi.fn() }) }))

const user = { id: 7, email: 'user@example.com' } as any
const groups = [{ id: 3, name: 'OwnAPI', status: 'active', subscription_type: 'standard', rate_multiplier: 1 }] as any

function mountModal() {
  return mount(UserModelRatesModal, {
    props: { show: true, user, groups },
    global: {
      plugins: [createI18n({ legacy: false, locale: 'en', messages: { en } })],
      stubs: { BaseDialog: { template: '<div><slot /></div>' }, Select: { template: '<div />' } },
    },
  })
}

describe('UserModelRatesModal', () => {
  beforeEach(() => {
    getModelRateOverrides.mockReset().mockResolvedValue([])
    listChannels.mockReset().mockResolvedValue({
      items: [{
        id: 9,
        name: 'OwnAPI LLM',
        group_ids: [3],
        model_pricing: [
          { models: ['gpt-5.4-mini', 'gpt-5.5'] },
        ],
      }, {
        id: 10,
        name: 'OwnAPI Secondary',
        group_ids: [3],
        model_pricing: [{ models: ['qwen3.8-max', 'GPT-5.5'] }],
      }, {
        id: 11,
        name: 'Other Group',
        group_ids: [8],
        model_pricing: [{ models: ['gpt-6-astra'] }],
      }],
      total: 1,
    })
    setModelRateOverrides.mockReset().mockResolvedValue({ message: 'ok' })
    showError.mockReset()
  })

  it('rejects an invalid configured rate instead of silently clearing it', async () => {
    const wrapper = mountModal()
    await flushPromises()
    const input = wrapper.get('input[type="number"]')
    await input.setValue('0')
    await wrapper.get('button.btn-primary').trigger('click')
    await flushPromises()

    expect(showError).toHaveBeenCalledWith('admin.users.invalidModelRate')
    expect(setModelRateOverrides).not.toHaveBeenCalled()
  })

  it('merges all selected-group channel models and adds independent MiniMax H3', async () => {
    const wrapper = mountModal()
    await flushPromises()

    const labels = wrapper.findAll('input[type="number"]').map(input => input.element.getAttribute('placeholder'))
    expect(labels).toHaveLength(4)
    expect(wrapper.text()).toContain('GPT-5.4 Mini')
    expect(wrapper.text()).toContain('GPT-5.5')
    expect(wrapper.text()).toContain('Qwen3.8 Max')
    expect(wrapper.text()).toContain('MiniMax H3')
    expect(wrapper.text()).not.toContain('GPT-6 Astra')
  })

  it('keeps an existing override visible after its model leaves the channel', async () => {
    getModelRateOverrides.mockResolvedValue([{ model_id: 'retired-model', rate_multiplier: 0.9 }])
    const wrapper = mountModal()
    await flushPromises()

    expect(wrapper.text()).toContain('retired-model')
    expect(wrapper.findAll('input[type="number"]')).toHaveLength(5)
  })
})
