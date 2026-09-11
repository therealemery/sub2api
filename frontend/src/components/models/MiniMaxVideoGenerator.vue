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
        <input type="file" accept="image/*" @change="selectReferenceFile" />
      </label>
      <div class="options-grid">
        <label><span>{{ t('publicModels.videoGenerator.firstFrameUrl') }}</span><input v-model.trim="firstFrameURL" type="url" placeholder="https://…/first.png" /></label>
        <label><span>{{ t('publicModels.videoGenerator.lastFrameUrl') }}</span><input v-model.trim="lastFrameURL" type="url" placeholder="https://…/last.png" /></label>
      </div>
      <div class="options-grid">
        <label><span>{{ t('publicModels.videoGenerator.firstFrameFile') }}</span><input type="file" accept="image/png,image/jpeg" @change="selectFirstFrameFile" /></label>
        <label><span>{{ t('publicModels.videoGenerator.lastFrameFile') }}</span><input type="file" accept="image/png,image/jpeg" @change="selectLastFrameFile" /></label>
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
const referenceDataURL = ref('')
const referenceVideoURL = ref('')
const referenceVideoDataURL = ref('')
const referenceAudioURL = ref('')
const referenceAudioDataURL = ref('')
const firstFrameURL = ref('')
const firstFrameDataURL = ref('')
const lastFrameURL = ref('')
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
  const body: Record<string, unknown> = { model: props.modelId, prompt: prompt.value, duration: duration.value, resolution: resolution.value }
  if (isWan.value) Object.assign(body, { ratio: ratio.value, seed: seed.value, audio: audio.value, prompt_extend: promptExtend.value, watermark: watermark.value })
  if (referenceDataURL.value) body.reference_images = [referenceDataURL.value]
  else if (referenceURL.value) body.reference_images = [{ url: referenceURL.value }]
  if (referenceVideoDataURL.value) body.reference_videos = [referenceVideoDataURL.value]
  else if (referenceVideoURL.value) body.reference_videos = [referenceVideoURL.value]
  if (referenceAudioDataURL.value) body.reference_audios = [referenceAudioDataURL.value]
  else if (referenceAudioURL.value) body.reference_audios = [referenceAudioURL.value]
  if (firstFrameDataURL.value) body.first_frame_image = firstFrameDataURL.value
  else if (firstFrameURL.value) body.first_frame_image = firstFrameURL.value
  if (lastFrameDataURL.value) body.last_frame_image = lastFrameDataURL.value
  else if (lastFrameURL.value) body.last_frame_image = lastFrameURL.value
  try {
    const response = await fetch('/v1/videos', { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) })
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
  const file = (event.target as HTMLInputElement).files?.[0]
  referenceDataURL.value = ''
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => { referenceDataURL.value = typeof reader.result === 'string' ? reader.result : '' }
  reader.readAsDataURL(file)
}

function readMediaFile(event: Event, target: typeof referenceVideoDataURL) {
  const file = (event.target as HTMLInputElement).files?.[0]
  target.value = ''
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => { target.value = typeof reader.result === 'string' ? reader.result : '' }
  reader.readAsDataURL(file)
}

function selectReferenceVideoFile(event: Event) { readMediaFile(event, referenceVideoDataURL) }
function selectReferenceAudioFile(event: Event) { readMediaFile(event, referenceAudioDataURL) }
function selectFirstFrameFile(event: Event) { readMediaFile(event, firstFrameDataURL) }
function selectLastFrameFile(event: Event) { readMediaFile(event, lastFrameDataURL) }

onBeforeUnmount(() => { window.clearTimeout(pollTimer); releaseVideoObjectURL() })
</script>

<style scoped>
.video-generator{margin-top:32px;border:1px solid #dedede;border-radius:18px;background:#fff;padding:28px}.generator-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin-bottom:24px}.generator-heading span{color:#777;font-size:11px}.generator-heading h2{margin:6px 0 0;font-size:25px;letter-spacing:-.04em}.generator-heading>strong{font-size:22px}.video-generator form{display:grid;gap:16px}.video-generator label{display:grid;gap:7px;color:#555;font-size:12px}.video-generator input,.video-generator textarea,.video-generator select{width:100%;box-sizing:border-box;border:1px solid #d8d8d8;border-radius:9px;background:#fafafa;padding:11px 12px;color:#171717;font:inherit}.video-generator textarea{min-height:130px;resize:vertical}.options-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.check-options{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.check-options label{display:flex;align-items:center;gap:8px}.check-options input{width:auto}.video-generator form>button{min-height:44px;border:0;border-radius:9px;background:#171717;color:#fff;font:inherit;font-weight:650;cursor:pointer}.video-generator form>button:disabled{opacity:.55}.generator-error{margin:16px 0 0;color:#b42318;font-size:12px}.task-result{display:grid;gap:12px;margin-top:22px;border-top:1px solid #e5e5e5;padding-top:20px}.task-result>div{display:flex;justify-content:space-between}.task-result video{width:100%;border-radius:10px;background:#111}.task-result a{width:fit-content;color:#171717;font-size:12px;font-weight:650}@media(max-width:620px){.video-generator{padding:20px}.generator-heading{align-items:flex-start;flex-direction:column}.options-grid,.check-options{grid-template-columns:1fr}}
</style>
