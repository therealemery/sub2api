<template>
  <div class="docs-code">
    <div class="code-header">
      <div class="code-tabs" role="tablist" :aria-label="t('publicDocs.startTitle')">
        <button v-for="tab in tabs" :key="tab.id" type="button" role="tab" :aria-selected="activeTab === tab.id" @click="activeTab = tab.id">{{ tab.label }}</button>
      </div>
      <button type="button" class="copy-button" @click="copyCode"><Icon :name="copied ? 'check' : 'copy'" size="sm" />{{ copied ? t('publicDocs.copied') : t('publicModels.code.copy') }}</button>
    </div>
    <pre><code>{{ activeCode }}</code></pre>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Icon from '@/components/icons/Icon.vue'

const { t } = useI18n()
const activeTab = ref<'python' | 'typescript' | 'curl'>('python')
const copied = ref(false)
const baseUrl = computed(() => `${window.location.origin}/v1`)
const tabs = [
  { id: 'python', label: 'Python' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'curl', label: 'cURL' },
] as const
const examples = computed(() => ({
  python: `import os\n+from openai import OpenAI\n\nclient = OpenAI(\n    api_key=os.environ["OWNAPI_API_KEY"],\n    base_url="${baseUrl.value}"\n)\n\nresponse = client.chat.completions.create(\n    model="gpt-5.4",\n    messages=[{"role": "user", "content": "Hello from OwnAPI"}]\n)\n\nprint(response.choices[0].message.content)`,
  typescript: `import OpenAI from "openai";\n\nconst client = new OpenAI({\n  apiKey: process.env.OWNAPI_API_KEY,\n  baseURL: "${baseUrl.value}"\n});\n\nconst response = await client.chat.completions.create({\n  model: "gpt-5.4",\n  messages: [{ role: "user", content: "Hello from OwnAPI" }]\n});\n\nconsole.log(response.choices[0].message.content);`,
  curl: `curl "${baseUrl.value}/chat/completions" \\\n  -H "Authorization: Bearer $OWNAPI_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "model": "gpt-5.4",\n    "messages": [{"role": "user", "content": "Hello from OwnAPI"}]\n  }'`,
}))
const activeCode = computed(() => examples.value[activeTab.value])

async function copyCode() {
  await navigator.clipboard.writeText(activeCode.value)
  copied.value = true
  window.setTimeout(() => { copied.value = false }, 1600)
}
</script>

<style scoped>
.docs-code{overflow:hidden;border:1px solid #303030;border-radius:14px;background:#0c0c0c;color:#ededed}.code-header{display:flex;align-items:center;justify-content:space-between;gap:18px;border-bottom:1px solid #303030;padding:12px 14px}.code-tabs{display:flex;gap:4px}.code-tabs button,.copy-button{border:0;border-radius:7px;background:transparent;padding:8px 10px;color:#858585;font:inherit;font-size:11px;cursor:pointer}.code-tabs button[aria-selected="true"]{background:#242424;color:#fff}.copy-button{display:inline-flex;align-items:center;gap:7px;border:1px solid #343434;color:#ddd}.docs-code pre{min-height:330px;margin:0;overflow:auto;padding:26px}.docs-code code{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:12px;line-height:1.75;white-space:pre}
@media(max-width:600px){.code-header{align-items:flex-start;flex-direction:column}.docs-code pre{min-height:280px;padding:20px}.docs-code code{font-size:11px}}
</style>
