import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import ModelCodeExamples from '../ModelCodeExamples.vue'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

describe('ModelCodeExamples', () => {
  for (const modelId of ['wan3.0-video', 'wan3.0-video-prime']) {
    it(`renders directly runnable Wan lifecycle examples for ${modelId}`, async () => {
      const wrapper = mount(ModelCodeExamples, {
        props: { modelId, modality: 'Video' },
      })

      const python = wrapper.get('code').text()
      expect(python).toContain(`"model": "${modelId}"`)
      expect(python).toContain('"audio": True')
      expect(python).toContain('"prompt_extend": True')
      expect(python).toContain('"watermark": False')
      expect(python).toContain('Optional reference inputs')
      expect(python).not.toContain('example.com')
      expect(python).not.toMatch(/\btrue\b|\bfalse\b/)

      await wrapper.findAll('[role="tab"]')[1]?.trigger('click')
      const typescript = wrapper.get('code').text()
      expect(typescript).toContain(`model: "${modelId}"`)
      expect(typescript).toContain('audio: true')
      expect(typescript).toContain('prompt_extend: true')
      expect(typescript).toContain('watermark: false')
      expect(typescript).toContain('Optional reference inputs')
      expect(typescript).not.toContain('example.com')

      await wrapper.findAll('[role="tab"]')[2]?.trigger('click')
      const curl = wrapper.get('code').text()
      expect(curl).toContain(`"model": "${modelId}"`)
      expect(curl).toContain('"audio": true')
      expect(curl).toContain('"prompt_extend": true')
      expect(curl).toContain('"watermark": false')
      expect(curl).not.toContain('example.com')
    })
  }
})
