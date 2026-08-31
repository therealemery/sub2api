<template>
  <section class="model-code" :aria-labelledby="headingId">
    <div class="model-code-heading">
      <div>
        <span>{{ t('publicModels.buildTitle') }}</span>
        <p>{{ t('publicModels.buildDescription') }}</p>
      </div>
      <button type="button" @click="copyCode">
        <Icon :name="copied ? 'check' : 'copy'" size="sm" />
        {{ copied ? t('publicModels.code.copied') : t('publicModels.code.copy') }}
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
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Icon from '@/components/icons/Icon.vue'

const props = defineProps<{ modelId: string }>()
const { t } = useI18n()
const activeTab = ref<'python' | 'typescript' | 'curl'>('python')
const copied = ref(false)
const headingId = `model-code-${Math.random().toString(36).slice(2, 9)}`
const baseUrl = computed(() => `${window.location.origin}/v1`)

const tabs = [
  { id: 'python', labelKey: 'publicModels.code.python' },
  { id: 'typescript', labelKey: 'publicModels.code.typescript' },
  { id: 'curl', labelKey: 'publicModels.code.curl' },
] as const

const examples = computed(() => ({
  python: `import os\n+from openai import OpenAI\n\nclient = OpenAI(\n    api_key=os.environ["OWNAPI_API_KEY"],\n    base_url="${baseUrl.value}"\n)\n\nresponse = client.chat.completions.create(\n    model="${props.modelId}",\n    messages=[{"role": "user", "content": "Hello"}]\n)`,
  typescript: `import OpenAI from "openai";\n\nconst client = new OpenAI({\n  apiKey: process.env.OWNAPI_API_KEY,\n  baseURL: "${baseUrl.value}"\n});\n\nconst response = await client.chat.completions.create({\n  model: "${props.modelId}",\n  messages: [{ role: "user", content: "Hello" }]\n});`,
  curl: `curl "${baseUrl.value}/chat/completions" \\\n  -H "Authorization: Bearer $OWNAPI_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "model": "${props.modelId}",\n    "messages": [{"role": "user", "content": "Hello"}]\n  }'`,
}))

const activeCode = computed(() => examples.value[activeTab.value])

async function copyCode() {
  await navigator.clipboard.writeText(activeCode.value)
  copied.value = true
  window.setTimeout(() => { copied.value = false }, 1600)
}
</script>

<style scoped>
.model-code{overflow:hidden;border:1px solid #2f2f2f;border-radius:16px;background:#0c0c0c;color:#ededed}.model-code-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:24px;padding:24px 26px;border-bottom:1px solid #2f2f2f}.model-code-heading>div{display:grid;gap:6px}.model-code-heading span{font-size:15px;font-weight:620}.model-code-heading p{margin:0;color:#929292;font-size:13px}.model-code-heading button{display:inline-flex;align-items:center;gap:8px;border:1px solid #383838;border-radius:8px;background:#181818;padding:8px 11px;color:#ddd;font-size:12px;cursor:pointer}.code-tabs{display:flex;gap:4px;padding:12px 18px 0}.code-tabs button{border:0;border-radius:7px;background:transparent;padding:8px 10px;color:#818181;font:inherit;font-size:12px;cursor:pointer}.code-tabs button[aria-selected="true"]{background:#242424;color:#fff}.model-code pre{min-height:260px;margin:0;overflow:auto;padding:24px 26px 30px}.model-code code{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:12px;line-height:1.75;white-space:pre}
@media(max-width:640px){.model-code-heading{align-items:stretch;flex-direction:column}.model-code-heading button{width:fit-content}.model-code pre{padding:20px;font-size:11px}}
</style>
