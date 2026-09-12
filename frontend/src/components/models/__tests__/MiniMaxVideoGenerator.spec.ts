import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import MiniMaxVideoGenerator from '../MiniMaxVideoGenerator.vue'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

describe('MiniMaxVideoGenerator', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('creates a Wan task with OwnAPI credentials and downloads through OwnAPI', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'video_public_task', status: 'completed' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        blob: async () => new Blob(['mp4'], { type: 'video/mp4' }),
      })
    vi.stubGlobal('fetch', fetchMock)
    const createObjectURL = vi.fn(() => 'blob:ownapi-video')
    const revokeObjectURL = vi.fn()
    Object.defineProperty(window.URL, 'createObjectURL', { configurable: true, value: createObjectURL })
    Object.defineProperty(window.URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL })

    const wrapper = mount(MiniMaxVideoGenerator, {
      props: {
        modelId: 'wan3.0-video',
        pricing: [
          { resolution: '480P', ownApiPerSecond: 0.0330048 },
          { resolution: '720P', ownApiPerSecond: 0.0660104 },
        ],
      },
    })
    await wrapper.get('input[type="password"]').setValue('ownapi-customer-key')
    await wrapper.get('textarea').setValue('A paper boat crosses the lake')
    await wrapper.findAll('select')[0]?.setValue('2')
    await wrapper.findAll('select')[1]?.setValue('480P')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(fetchMock).toHaveBeenCalledTimes(2)
    const [createURL, createInit] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(createURL).toBe('/v1/videos')
    expect(createInit.headers).toEqual({
      Authorization: 'Bearer ownapi-customer-key',
      'Content-Type': 'application/json',
    })
    expect(JSON.parse(String(createInit.body))).toMatchObject({
      model: 'wan3.0-video',
      prompt: 'A paper boat crosses the lake',
      duration: 2,
      resolution: '480P',
      ratio: 'adaptive',
      seed: -1,
      audio: true,
      prompt_extend: true,
      watermark: false,
    })
    expect(fetchMock.mock.calls[1]?.[0]).toBe('/v1/videos/video_public_task/content')
    expect(fetchMock.mock.calls[1]?.[1]?.headers).toEqual({
      Authorization: 'Bearer ownapi-customer-key',
      'Content-Type': 'application/json',
    })
    expect(createObjectURL).toHaveBeenCalledOnce()
    expect(wrapper.get('video').attributes('src')).toBe('blob:ownapi-video')
    expect(wrapper.get('a[download]').attributes('download')).toBe('wan3.0-video.mp4')

    wrapper.unmount()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:ownapi-video')
  })

  it.each([
    { index: 0, name: 'reference.png', type: 'image/png', field: 'input_reference' },
    { index: 3, name: 'reference.mp4', type: 'video/mp4', field: 'reference_videos' },
    { index: 4, name: 'reference.mp3', type: 'audio/mpeg', field: 'reference_audios' },
  ])('uploads H3 $field as multipart without a manual boundary', async ({ index, name, type, field }) => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'video_public_task', status: 'failed' }) })
    vi.stubGlobal('fetch', fetchMock)
    const wrapper = mount(MiniMaxVideoGenerator, {
      props: { modelId: 'MiniMax-H3', pricing: [{ resolution: '768p', ownApiPerSecond: 0.05597 }] },
    })
    await wrapper.get('input[type="password"]').setValue('ownapi-customer-key')
    await wrapper.get('textarea').setValue('Follow the reference')
    const file = new File(['media'], name, { type })
    const fileInput = wrapper.findAll('input[type="file"]')[index]!
    Object.defineProperty(fileInput.element, 'files', { configurable: true, value: [file] })
    await fileInput.trigger('change')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit
    expect(init.headers).toEqual({ Authorization: 'Bearer ownapi-customer-key' })
    expect(init.body).toBeInstanceOf(FormData)
    expect((init.body as FormData).get(field)).toBe(file)
  })

  it('keeps text-only H3 requests on JSON', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'video_public_task', status: 'failed' }) })
    vi.stubGlobal('fetch', fetchMock)
    const wrapper = mount(MiniMaxVideoGenerator, {
      props: { modelId: 'MiniMax-H3', pricing: [{ resolution: '2K', ownApiPerSecond: 0.089552 }] },
    })
    await wrapper.get('input[type="password"]').setValue('ownapi-customer-key')
    await wrapper.get('textarea').setValue('A paper boat')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit
    expect(init.headers).toEqual({ Authorization: 'Bearer ownapi-customer-key', 'Content-Type': 'application/json' })
    expect(JSON.parse(String(init.body))).toMatchObject({ model: 'MiniMax-H3', resolution: '2K' })
  })
})
