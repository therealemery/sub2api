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

vi.mock('@/api/admin', () => ({
  adminAPI: { users: { getModelRateOverrides, setModelRateOverrides } },
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
})
