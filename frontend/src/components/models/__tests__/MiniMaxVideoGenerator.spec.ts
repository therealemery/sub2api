import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import MiniMaxVideoGenerator from '../MiniMaxVideoGenerator.vue'

function mp4WithDuration(seconds: number): Uint8Array {
  const ftyp = new Uint8Array([0, 0, 0, 20, 102, 116, 121, 112, 105, 115, 111, 109, 0, 0, 0, 0, 105, 115, 111, 109])
  const mvhd = new Uint8Array(28)
  new DataView(mvhd.buffer).setUint32(0, 28)
  mvhd.set([109, 118, 104, 100], 4)
  new DataView(mvhd.buffer).setUint32(20, 1000)
  new DataView(mvhd.buffer).setUint32(24, seconds * 1000)
  const moov = new Uint8Array(36)
  new DataView(moov.buffer).setUint32(0, 36)
  moov.set([109, 111, 111, 118], 4)
  moov.set(mvhd, 8)
  const result = new Uint8Array(ftyp.length + moov.length)
  result.set(ftyp)
  result.set(moov, ftyp.length)
  return result
}

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
    { index: 0, name: 'reference.png', type: 'image/png', field: 'input_reference', content: new Uint8Array([1]) },
    { index: 3, name: 'reference.mp4', type: 'video/mp4', field: 'reference_videos', content: mp4WithDuration(2) },
    { index: 4, name: 'reference.mp3', type: 'audio/mpeg', field: 'reference_audios', content: new Uint8Array([1]) },
  ])('uploads H3 $field as multipart without a manual boundary', async ({ index, name, type, field, content }) => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'video_public_task', status: 'failed' }) })
    vi.stubGlobal('fetch', fetchMock)
    const wrapper = mount(MiniMaxVideoGenerator, {
      props: { modelId: 'MiniMax-H3', pricing: [{ resolution: '768p', ownApiPerSecond: 0.05597 }] },
    })
    await wrapper.get('input[type="password"]').setValue('ownapi-customer-key')
    await wrapper.get('textarea').setValue('Follow the reference')
    const file = new File([content], name, { type })
    const fileInput = wrapper.findAll('input[type="file"]')[index]!
    Object.defineProperty(fileInput.element, 'files', { configurable: true, value: [file] })
    await fileInput.trigger('change')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled())

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

  it('rejects an H3 reference-video upload longer than 15 seconds before fetch', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const wrapper = mount(MiniMaxVideoGenerator, {
      props: { modelId: 'MiniMax-H3', pricing: [{ resolution: '768p', ownApiPerSecond: 0.05597 }] },
    })
    await wrapper.get('input[type="password"]').setValue('ownapi-customer-key')
    await wrapper.get('textarea').setValue('Follow the reference')
    const file = new File([mp4WithDuration(16)], 'reference.mp4', { type: 'video/mp4' })
    const fileInput = wrapper.findAll('input[type="file"]')[3]!
    Object.defineProperty(fileInput.element, 'files', { configurable: true, value: [file] })
    await fileInput.trigger('change')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    await vi.waitFor(() => expect(wrapper.get('.generator-error').text()).toBe('publicModels.videoGenerator.h3VideoDuration'))
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
