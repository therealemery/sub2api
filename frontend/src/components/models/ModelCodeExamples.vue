<template>
  <section class="model-code" :aria-labelledby="headingId">
    <div class="model-code-heading">
      <div>
        <span>{{ t('publicModels.buildTitle') }}</span>
        <p>{{ t('publicModels.buildDescription') }}</p>
      </div>
      <button type="button" class="copy-feedback-button" aria-live="polite" @click="copyCode">
        <Transition name="motion-fade" mode="out-in">
          <span :key="copied ? 'copied' : 'copy'" class="copy-feedback">
            <Icon :name="copied ? 'check' : 'copy'" size="sm" />
            {{ copied ? t('publicModels.code.copied') : t('publicModels.code.copy') }}
          </span>
        </Transition>
      </button>
    </div>

    <div class="code-tabs" role="tablist" :aria-label="t('publicModels.buildTitle')">
      <button
        v-for="tab in tabs"
        :id="`${headingId}-${tab.id}-tab`"
        :key="tab.id"
        type="button"
        role="tab"
        :aria-selected="activeTab === tab.id"
        :aria-controls="`${headingId}-${tab.id}-panel`"
        @click="activeTab = tab.id"
      >
        {{ t(tab.labelKey) }}
      </button>
    </div>

    <pre
      :id="`${headingId}-${activeTab}-panel`"
      role="tabpanel"
      :aria-labelledby="`${headingId}-${activeTab}-tab`"
    ><code>{{ activeCode }}</code></pre>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Icon from '@/components/icons/Icon.vue'

const props = defineProps<{ modelId: string; modality?: string }>()
const { t } = useI18n()
const activeTab = ref<'python' | 'typescript' | 'curl'>('python')
const copied = ref(false)
let copyResetTimer: number | undefined
const headingId = `model-code-${Math.random().toString(36).slice(2, 9)}`
const baseUrl = computed(() => `${window.location.origin}/v1`)
const isWan = computed(() => props.modelId.toLowerCase().startsWith('wan3.0-'))
const videoResolution = computed(() => isWan.value ? '480P' : '768p')
const videoFilename = computed(() => `${props.modelId.toLowerCase().replace(/[^a-z0-9.-]+/g, '-')}.mp4`)
const pythonMediaFields = computed(() => isWan.value
  ? `        "ratio": "adaptive",\n        "audio": True,\n        "seed": -1,\n        "prompt_extend": True,\n        "watermark": False,\n        # Optional reference inputs (replace with real HTTPS URLs or data URIs):\n        # "reference_images": ["<REFERENCE_IMAGE_URL>"],\n        # "reference_videos": ["<REFERENCE_VIDEO_URL>"],\n        # "reference_audios": ["<REFERENCE_AUDIO_URL>"],`
  : `        "reference_images": ["https://example.com/reference.png"],\n        "reference_videos": ["https://example.com/reference.mp4"],\n        "reference_audios": ["https://example.com/reference.mp3"],\n        "first_frame_image": "data:image/png;base64,<BASE64_PNG>",\n        "last_frame_image": "https://example.com/last-frame.png",`)
const javascriptMediaFields = computed(() => isWan.value
  ? `    ratio: "adaptive", audio: true, seed: -1,\n    prompt_extend: true, watermark: false,\n    // Optional reference inputs (replace with real HTTPS URLs or data URIs):\n    // reference_images: ["<REFERENCE_IMAGE_URL>"],\n    // reference_videos: ["<REFERENCE_VIDEO_URL>"],\n    // reference_audios: ["<REFERENCE_AUDIO_URL>"]`
  : `    reference_images: ["https://example.com/reference.png"],\n    reference_videos: ["https://example.com/reference.mp4"],\n    reference_audios: ["https://example.com/reference.mp3"],\n    first_frame_image: "data:image/png;base64,<BASE64_PNG>",\n    last_frame_image: "https://example.com/last-frame.png"`)
const curlMediaFields = computed(() => isWan.value
  ? `    "ratio": "adaptive",\n    "audio": true,\n    "seed": -1,\n    "prompt_extend": true,\n    "watermark": false`
  : `    "reference_images": ["https://example.com/reference.png"],\n    "reference_videos": ["https://example.com/reference.mp4"],\n    "reference_audios": ["https://example.com/reference.mp3"],\n    "first_frame_image": "data:image/png;base64,<BASE64_PNG>",\n    "last_frame_image": "https://example.com/last-frame.png"`)
const videoPrompt = computed(() => isWan.value
  ? 'A paper boat crosses a moonlit lake. Cinematic, smooth camera movement.'
  : 'Follow the reference motion and preserve the subject. No text.')

const tabs = [
  { id: 'python', labelKey: 'publicModels.code.python' },
  { id: 'typescript', labelKey: 'publicModels.code.typescript' },
  { id: 'curl', labelKey: 'publicModels.code.curl' },
] as const

const textExamples = computed(() => ({
  python: `import os\nfrom openai import OpenAI\n\nclient = OpenAI(\n    api_key=os.environ["OWNAPI_API_KEY"],\n    base_url="${baseUrl.value}"\n)\n\nresponse = client.chat.completions.create(\n    model="${props.modelId}",\n    messages=[{"role": "user", "content": "Hello"}]\n)`,
  typescript: `import OpenAI from "openai";\n\nconst client = new OpenAI({\n  apiKey: process.env.OWNAPI_API_KEY,\n  baseURL: "${baseUrl.value}"\n});\n\nconst response = await client.chat.completions.create({\n  model: "${props.modelId}",\n  messages: [{ role: "user", content: "Hello" }]\n});`,
  curl: `curl "${baseUrl.value}/chat/completions" \\\n  -H "Authorization: Bearer $OWNAPI_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "model": "${props.modelId}",\n    "messages": [{"role": "user", "content": "Hello"}]\n  }'`,
}))

const videoExamples = computed(() => ({
  python: `import os\nimport time\nfrom pathlib import Path\n\nimport requests\n\nbase_url = "${baseUrl.value}"\nheaders = {"Authorization": f"Bearer {os.environ['OWNAPI_API_KEY']}"}\n\n# 1. Create the asynchronous video task.\ncreate_response = requests.post(\n    f"{base_url}/videos",\n    headers={**headers, "Content-Type": "application/json"},\n    json={\n        "model": "${props.modelId}",\n        "prompt": "${videoPrompt.value}",\n        "duration": 5,\n        "resolution": "${videoResolution.value}",\n${pythonMediaFields.value}\n    },\n    timeout=60,\n)\ncreate_response.raise_for_status()\ntask_id = create_response.json()["id"]\n\n# 2. Poll the task until it completes or fails.\nwhile True:\n    status_response = requests.get(f"{base_url}/videos/{task_id}", headers=headers, timeout=30)\n    status_response.raise_for_status()\n    status = status_response.json()\n    print(f"{status.get('status')} ({status.get('progress', 0)}%)")\n    if status.get("status") in {"completed", "failed"}:\n        break\n    time.sleep(4)\n\nif status.get("status") != "completed":\n    raise RuntimeError(status.get("error", "Video generation failed"))\n\n# 3. Download the generated MP4.\nvideo_response = requests.get(f"{base_url}/videos/{task_id}/content", headers=headers, timeout=120)\nvideo_response.raise_for_status()\nPath("${videoFilename.value}").write_bytes(video_response.content)\nprint("Saved ${videoFilename.value}")`,
  typescript: `import { writeFile } from "node:fs/promises";\n\nconst baseUrl = "${baseUrl.value}";\nconst auth = { "Authorization": \`Bearer \${process.env.OWNAPI_API_KEY}\` };\nconst headers = { ...auth, "Content-Type": "application/json" };\n\n// 1. Create the asynchronous video task.\nconst createResponse = await fetch(baseUrl + "/videos", {\n  method: "POST", headers,\n  body: JSON.stringify({\n    model: "${props.modelId}",\n    prompt: "${videoPrompt.value}",\n    duration: 5, resolution: "${videoResolution.value}",\n${javascriptMediaFields.value}\n  })\n});\nif (!createResponse.ok) throw new Error(await createResponse.text());\nconst task = await createResponse.json() as { id: string; status?: string };\n\n// 2. Poll the task until it completes or fails.\nlet status = task;\nwhile (status.status !== "completed" && status.status !== "failed") {\n  await new Promise(resolve => setTimeout(resolve, 4000));\n  const statusResponse = await fetch(baseUrl + "/videos/" + task.id, { headers: auth });\n  if (!statusResponse.ok) throw new Error(await statusResponse.text());\n  status = await statusResponse.json() as typeof status;\n  console.log(status.status, status);\n}\nif (status.status !== "completed") throw new Error("Video generation failed");\n\n// 3. Download the generated MP4.\nconst videoResponse = await fetch(baseUrl + "/videos/" + task.id + "/content", { headers: auth });\nif (!videoResponse.ok) throw new Error(await videoResponse.text());\nawait writeFile("${videoFilename.value}", Buffer.from(await videoResponse.arrayBuffer()));\nconsole.log("Saved ${videoFilename.value}");`,
  curl: `# 1. Create the asynchronous video task.\ncurl "${baseUrl.value}/videos" \\\n  -H "Authorization: Bearer $OWNAPI_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "model": "${props.modelId}",\n    "prompt": "${videoPrompt.value}",\n    "duration": 5,\n    "resolution": "${videoResolution.value}",\n${curlMediaFields.value}\n  }'\n\n# 2. Replace <task_id> with the id from the create response.\ncurl "${baseUrl.value}/videos/<task_id>" \\\n  -H "Authorization: Bearer $OWNAPI_API_KEY"\n\n# 3. Download the generated MP4 after status becomes completed.\ncurl "${baseUrl.value}/videos/<task_id>/content" \\\n  -H "Authorization: Bearer $OWNAPI_API_KEY" \\\n  -o ${videoFilename.value}`,
}))

const examples = computed(() => props.modality === 'Video' ? videoExamples.value : textExamples.value)

const activeCode = computed(() => examples.value[activeTab.value])

async function copyCode() {
  await navigator.clipboard.writeText(activeCode.value)
  copied.value = true
  window.clearTimeout(copyResetTimer)
  copyResetTimer = window.setTimeout(() => { copied.value = false }, 1500)
}

onBeforeUnmount(() => window.clearTimeout(copyResetTimer))
</script>

<style scoped>
.model-code{overflow:hidden;border:1px solid #2f2f2f;border-radius:16px;background:#0c0c0c;color:#ededed}.model-code-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:24px;padding:24px 26px;border-bottom:1px solid #2f2f2f}.model-code-heading>div{display:grid;gap:6px}.model-code-heading span{font-size:15px;font-weight:620}.model-code-heading p{margin:0;color:#929292;font-size:13px}.model-code-heading button{display:inline-flex;min-inline-size:88px;align-items:center;justify-content:center;border:1px solid #383838;border-radius:8px;background:#181818;padding:8px 11px;color:#ddd;font-size:12px;cursor:pointer}.copy-feedback{display:inline-flex;align-items:center;gap:8px}.code-tabs{display:flex;gap:4px;padding:12px 18px 0}.code-tabs button{border:0;border-radius:7px;background:transparent;padding:8px 10px;color:#818181;font:inherit;font-size:12px;cursor:pointer}.code-tabs button[aria-selected="true"]{background:#242424;color:#fff}.model-code pre{min-height:260px;margin:0;overflow:auto;padding:24px 26px 30px}.model-code code{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:12px;line-height:1.75;white-space:pre}
@media(max-width:640px){.model-code-heading{align-items:stretch;flex-direction:column}.model-code-heading button{width:fit-content}.model-code pre{padding:20px;font-size:11px}}
</style>
