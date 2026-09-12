<template>
  <section class="video-generator">
    <div class="generator-heading">
      <div><span>{{ t('publicModels.videoGenerator.eyebrow') }}</span><h2>{{ t('publicModels.videoGenerator.title', { model: modelId }) }}</h2></div>
      <strong>{{ estimatedPrice }}</strong>
    </div>
    <form @submit.prevent="generate">
      <label>
        <span>{{ t('publicModels.videoGenerator.apiKey') }}</span>
        <input v-model.trim="apiKey" type="password" autocomplete="off" required placeholder="sk-…" />
      </label>
      <label class="prompt-field">
        <span>{{ t('publicModels.videoGenerator.prompt') }}</span>
        <textarea v-model.trim="prompt" :required="!isWan" :maxlength="isWan ? 20000 : 100000" :placeholder="t('publicModels.videoGenerator.promptPlaceholder')"></textarea>
      </label>
      <div class="options-grid">
        <label><span>{{ t('publicModels.videoGenerator.duration') }}</span><select v-model.number="duration"><option v-for="value in durationOptions" :key="value" :value="value">{{ value }}s</option></select></label>
        <label><span>{{ t('publicModels.videoGenerator.resolution') }}</span><select v-model="resolution"><option v-for="tier in pricing" :key="tier.resolution" :value="tier.resolution">{{ tier.resolution }}</option></select></label>
      </div>
      <template v-if="isWan">
        <div class="options-grid">
          <label><span>{{ t('publicModels.videoGenerator.ratio') }}</span><select v-model="ratio"><option v-for="value in ['adaptive','16:9','4:3','1:1','3:4','9:16']" :key="value">{{ value }}</option></select></label>
          <label><span>{{ t('publicModels.videoGenerator.seed') }}</span><input v-model.number="seed" type="number" min="-1" max="2147483647" /></label>
        </div>
        <div class="check-options">
          <label><input v-model="audio" type="checkbox" /><span>{{ t('publicModels.videoGenerator.audio') }}</span></label>
          <label><input v-model="promptExtend" type="checkbox" /><span>{{ t('publicModels.videoGenerator.promptExtend') }}</span></label>
          <label><input v-model="watermark" type="checkbox" /><span>{{ t('publicModels.videoGenerator.watermark') }}</span></label>
        </div>
      </template>
      <label>
        <span>{{ t('publicModels.videoGenerator.referenceUrl') }}</span>
        <input v-model.trim="referenceURL" type="url" placeholder="https://…" />
      </label>
      <label>
        <span>{{ t('publicModels.videoGenerator.referenceFile') }}</span>
        <input type="file" accept="image/png,image/jpeg" @change="selectReferenceFile" />
      </label>
      <div class="options-grid">
        <label><span>{{ t('publicModels.videoGenerator.firstFrameUrl') }}</span><input v-model.trim="firstFrameURL" type="url" placeholder="https://…/first.png" /></label>
        <label><span>{{ t('publicModels.videoGenerator.lastFrameUrl') }}</span><input v-model.trim="lastFrameURL" type="url" placeholder="https://…/last.png" /></label>
      </div>
      <div class="options-grid">
        <label><span>{{ t('publicModels.videoGenerator.firstFrameFile') }}</span><input type="file" :accept="isWan ? 'image/png,image/jpeg' : 'image/png'" @change="selectFirstFrameFile" /></label>
        <label><span>{{ t('publicModels.videoGenerator.lastFrameFile') }}</span><input type="file" :accept="isWan ? 'image/png,image/jpeg' : 'image/png'" @change="selectLastFrameFile" /></label>
      </div>
      <label>
        <span>{{ t('publicModels.videoGenerator.referenceVideoUrl') }}</span>
        <input v-model.trim="referenceVideoURL" type="url" placeholder="https://…/reference.mp4" />
      </label>
      <label>
        <span>{{ t('publicModels.videoGenerator.referenceVideoFile') }}</span>
        <input type="file" accept="video/mp4,video/*" @change="selectReferenceVideoFile" />
      </label>
      <label>
        <span>{{ t('publicModels.videoGenerator.referenceAudioUrl') }}</span>
        <input v-model.trim="referenceAudioURL" type="url" placeholder="https://…/reference.mp3" />
      </label>
      <label>
        <span>{{ t('publicModels.videoGenerator.referenceAudioFile') }}</span>
        <input type="file" accept="audio/mpeg,audio/*" @change="selectReferenceAudioFile" />
      </label>
      <button type="submit" :disabled="submitting">{{ submitting ? t('publicModels.videoGenerator.submitting') : t('publicModels.videoGenerator.submit') }}</button>
    </form>
    <p v-if="error" class="generator-error">{{ error }}</p>
    <div v-if="task" class="task-result" aria-live="polite">
      <div><span>{{ t('publicModels.videoGenerator.status') }}</span><strong>{{ task.status }}</strong></div>
      <progress v-if="task.status !== 'completed' && task.status !== 'failed'" :value="task.progress || 0" max="100"></progress>
      <video v-if="videoObjectURL" :src="videoObjectURL" controls playsinline></video>
      <a v-if="videoObjectURL" :href="videoObjectURL" :download="videoFilename">{{ t('publicModels.videoGenerator.download') }}</a>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'

interface VideoTask { id: string; status: string; progress?: number; url?: string }
interface VideoPricing { resolution: string; ownApiPerSecond: number }
const props = defineProps<{ modelId: string; pricing: VideoPricing[] }>()
const { t } = useI18n()
const apiKey = ref('')
const prompt = ref('')
const duration = ref(5)
const resolution = ref(props.pricing[0]?.resolution || '768p')
const ratio = ref('adaptive')
const seed = ref(-1)
const audio = ref(true)
const promptExtend = ref(true)
const watermark = ref(false)
const referenceURL = ref('')
const referenceFile = ref<File | null>(null)
const referenceDataURL = ref('')
const referenceVideoURL = ref('')
const referenceVideoFile = ref<File | null>(null)
const referenceVideoDataURL = ref('')
const referenceAudioURL = ref('')
const referenceAudioFile = ref<File | null>(null)
const referenceAudioDataURL = ref('')
const firstFrameURL = ref('')
const firstFrameFile = ref<File | null>(null)
const firstFrameDataURL = ref('')
const lastFrameURL = ref('')
const lastFrameFile = ref<File | null>(null)
const lastFrameDataURL = ref('')
const submitting = ref(false)
const error = ref('')
const task = ref<VideoTask | null>(null)
const videoObjectURL = ref('')
let pollTimer: number | undefined
const isWan = computed(() => props.modelId.toLowerCase().startsWith('wan3.0-'))
const durationOptions = computed(() => isWan.value ? [2, 5, 10, 15, 20, 30] : [5, 10])
const estimatedPrice = computed(() => `$${(duration.value * (props.pricing.find(tier => tier.resolution === resolution.value)?.ownApiPerSecond || 0)).toFixed(6).replace(/0+$/, '').replace(/\.$/, '')}`)
const videoFilename = computed(() => `${props.modelId.toLowerCase().replace(/[^a-z0-9.-]+/g, '-')}.mp4`)

async function generate() {
  window.clearTimeout(pollTimer)
  submitting.value = true
  error.value = ''
  task.value = null
  releaseVideoObjectURL()
  const { body, headers } = buildCreateRequest()
  try {
    const response = await fetch('/v1/videos', { method: 'POST', headers, body })
    const data = await response.json()
    if (!response.ok) throw new Error(data?.error?.message || t('publicModels.videoGenerator.failed'))
    task.value = data
    if (task.value?.status === 'completed') await loadVideo()
    else schedulePoll()
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : t('publicModels.videoGenerator.failed')
  } finally {
    submitting.value = false
  }
}

function schedulePoll() {
  if (!task.value || ['completed', 'failed'].includes(task.value.status)) return
  pollTimer = window.setTimeout(poll, 4000)
}

async function poll() {
  if (!task.value) return
  try {
    const response = await fetch(`/v1/videos/${encodeURIComponent(task.value.id)}`, { headers: authHeaders() })
    const data = await response.json()
    if (!response.ok) throw new Error(data?.error?.message || t('publicModels.videoGenerator.failed'))
    task.value = data
    if (task.value?.status === 'completed') await loadVideo()
    else schedulePoll()
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : t('publicModels.videoGenerator.failed')
  }
}

function authHeaders() { return { Authorization: `Bearer ${apiKey.value}`, 'Content-Type': 'application/json' } }

function buildCreateRequest(): { body: BodyInit; headers: Record<string, string> } {
  const payload: Record<string, unknown> = { model: props.modelId, prompt: prompt.value, duration: duration.value, resolution: resolution.value }
  if (isWan.value) Object.assign(payload, { ratio: ratio.value, seed: seed.value, audio: audio.value, prompt_extend: promptExtend.value, watermark: watermark.value })
  if (isWan.value && referenceDataURL.value) payload.reference_images = [referenceDataURL.value]
  else if (referenceURL.value) payload.reference_images = [{ url: referenceURL.value }]
  if (isWan.value && referenceVideoDataURL.value) payload.reference_videos = [referenceVideoDataURL.value]
  else if (referenceVideoURL.value) payload.reference_videos = [referenceVideoURL.value]
  if (isWan.value && referenceAudioDataURL.value) payload.reference_audios = [referenceAudioDataURL.value]
  else if (referenceAudioURL.value) payload.reference_audios = [referenceAudioURL.value]
  if (isWan.value && firstFrameDataURL.value) payload.first_frame_image = firstFrameDataURL.value
  else if (firstFrameURL.value) payload.first_frame_image = firstFrameURL.value
  if (isWan.value && lastFrameDataURL.value) payload.last_frame_image = lastFrameDataURL.value
  else if (lastFrameURL.value) payload.last_frame_image = lastFrameURL.value

  const hasLocalFiles = !isWan.value && [referenceFile, referenceVideoFile, referenceAudioFile, firstFrameFile, lastFrameFile].some(item => item.value)
  if (!hasLocalFiles) return { body: JSON.stringify(payload), headers: authHeaders() }

  const form = new FormData()
  form.append('model', props.modelId)
  form.append('prompt', prompt.value)
  form.append('duration', String(duration.value))
  form.append('resolution', resolution.value)
  if (referenceFile.value) form.append('input_reference', referenceFile.value)
  else if (referenceURL.value) form.append('input_reference', referenceURL.value)
  if (referenceVideoFile.value) form.append('reference_videos', referenceVideoFile.value)
  else if (referenceVideoURL.value) form.append('reference_videos', referenceVideoURL.value)
  if (referenceAudioFile.value) form.append('reference_audios', referenceAudioFile.value)
  else if (referenceAudioURL.value) form.append('reference_audios', referenceAudioURL.value)
  if (firstFrameFile.value) form.append('first_frame', firstFrameFile.value)
  else if (firstFrameURL.value) form.append('first_frame', firstFrameURL.value)
  if (lastFrameFile.value) form.append('last_frame', lastFrameFile.value)
  else if (lastFrameURL.value) form.append('last_frame', lastFrameURL.value)
  return { body: form, headers: { Authorization: `Bearer ${apiKey.value}` } }
}

async function loadVideo() {
  if (!task.value) return
  const response = await fetch(`/v1/videos/${encodeURIComponent(task.value.id)}/content`, { headers: authHeaders() })
  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(data?.error?.message || t('publicModels.videoGenerator.failed'))
  }
  releaseVideoObjectURL()
  videoObjectURL.value = window.URL.createObjectURL(await response.blob())
}

function releaseVideoObjectURL() {
  if (!videoObjectURL.value) return
  window.URL.revokeObjectURL(videoObjectURL.value)
  videoObjectURL.value = ''
}

function selectReferenceFile(event: Event) {
  readMediaFile(event, referenceFile, referenceDataURL)
}

function readMediaFile(event: Event, fileTarget: typeof referenceVideoFile, dataTarget: typeof referenceVideoDataURL) {
  const file = (event.target as HTMLInputElement).files?.[0] || null
  fileTarget.value = file
  dataTarget.value = ''
  if (!file || !isWan.value) return
  const reader = new FileReader()
  reader.onload = () => { dataTarget.value = typeof reader.result === 'string' ? reader.result : '' }
  reader.readAsDataURL(file)
}

function selectReferenceVideoFile(event: Event) { readMediaFile(event, referenceVideoFile, referenceVideoDataURL) }
function selectReferenceAudioFile(event: Event) { readMediaFile(event, referenceAudioFile, referenceAudioDataURL) }
function selectFirstFrameFile(event: Event) { readMediaFile(event, firstFrameFile, firstFrameDataURL) }
function selectLastFrameFile(event: Event) { readMediaFile(event, lastFrameFile, lastFrameDataURL) }

onBeforeUnmount(() => { window.clearTimeout(pollTimer); releaseVideoObjectURL() })
</script>

<style scoped>
.video-generator{margin-top:32px;border:1px solid #dedede;border-radius:18px;background:#fff;padding:28px}.generator-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin-bottom:24px}.generator-heading span{color:#777;font-size:11px}.generator-heading h2{margin:6px 0 0;font-size:25px;letter-spacing:-.04em}.generator-heading>strong{font-size:22px}.video-generator form{display:grid;gap:16px}.video-generator label{display:grid;gap:7px;color:#555;font-size:12px}.video-generator input,.video-generator textarea,.video-generator select{width:100%;box-sizing:border-box;border:1px solid #d8d8d8;border-radius:9px;background:#fafafa;padding:11px 12px;color:#171717;font:inherit}.video-generator textarea{min-height:130px;resize:vertical}.options-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.check-options{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.check-options label{display:flex;align-items:center;gap:8px}.check-options input{width:auto}.video-generator form>button{min-height:44px;border:0;border-radius:9px;background:#171717;color:#fff;font:inherit;font-weight:650;cursor:pointer}.video-generator form>button:disabled{opacity:.55}.generator-error{margin:16px 0 0;color:#b42318;font-size:12px}.task-result{display:grid;gap:12px;margin-top:22px;border-top:1px solid #e5e5e5;padding-top:20px}.task-result>div{display:flex;justify-content:space-between}.task-result video{width:100%;border-radius:10px;background:#111}.task-result a{width:fit-content;color:#171717;font-size:12px;font-weight:650}@media(max-width:620px){.video-generator{padding:20px}.generator-heading{align-items:flex-start;flex-direction:column}.options-grid,.check-options{grid-template-columns:1fr}}
</style>
