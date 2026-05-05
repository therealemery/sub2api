<template>
  <div class="model-list-container">
    <div v-if="loading" class="model-list-loading">
      <span class="loading-spinner">⏳</span>
      <span>{{ loadingText }}</span>
    </div>
    
    <div v-else-if="error" class="model-list-error">
      <p class="error-title">⚠️ {{ errorTitle }}</p>
      <p class="error-hint">{{ errorHint }}</p>
      <p class="error-detail" v-if="isDev">{{ error }}</p>
    </div>
    
    <div v-else-if="models.length === 0" class="model-list-empty">
      <p>{{ emptyText }}</p>
    </div>
    
    <table v-else class="model-list-table">
      <thead>
        <tr>
          <th class="col-id">{{ headers.id }}</th>
          <th class="col-owner">{{ headers.owner }}</th>
          <th class="col-created">{{ headers.created }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="model in models" :key="model.id">
          <td><code>{{ model.id }}</code></td>
          <td>{{ model.owned_by || 'unknown' }}</td>
          <td>{{ formatDate(model.created) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'

const props = defineProps({
  lang: {
    type: String,
    default: 'zh'
  }
})

const models = ref([])
const loading = ref(true)
const error = ref(null)

const isDev = import.meta.env.DEV

const texts = {
  zh: {
    loading: '正在加载模型列表...',
    errorTitle: '无法加载实时模型列表',
    errorHint: '此区域需要有效的 API Key 才能获取实时数据。你可以在下方的"常见模型"表格中查看支持的模型，或在代码中使用自己的 API Key 调用接口获取完整列表。',
    emptyText: '暂无可用模型',
    headers: { id: '模型 ID', owner: '归属', created: '创建时间' }
  },
  en: {
    loading: 'Loading model list...',
    errorTitle: 'Unable to load live model list',
    errorHint: 'This section requires a valid API Key to fetch live data. You can view supported models in the "Common Models" table below, or call the API with your own API Key in your code.',
    emptyText: 'No models available',
    headers: { id: 'Model ID', owner: 'Owned By', created: 'Created' }
  }
}

const t = computed(() => texts[props.lang] || texts.zh)
const loadingText = computed(() => t.value.loading)
const errorTitle = computed(() => t.value.errorTitle)
const errorHint = computed(() => t.value.errorHint)
const emptyText = computed(() => t.value.emptyText)
const headers = computed(() => t.value.headers)

function formatDate(timestamp) {
  if (!timestamp) return '-'
  try {
    return new Date(timestamp * 1000).toLocaleDateString(
      props.lang === 'zh' ? 'zh-CN' : 'en-US'
    )
  } catch {
    return '-'
  }
}

onMounted(async () => {
  try {
    const res = await fetch('https://ownapi.dev/v1/models', {
      headers: { 'Authorization': 'Bearer sk-test' }
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    models.value = data.data || []
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.model-list-container {
  margin-top: 16px;
}

.model-list-loading,
.model-list-error,
.model-list-empty {
  text-align: center;
  padding: 40px 20px;
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
}

.loading-spinner {
  display: inline-block;
  margin-right: 8px;
  animation: spin 1.5s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.error-title {
  color: var(--vp-c-danger-1);
  font-weight: 600;
  margin-bottom: 8px;
}

.error-hint {
  color: var(--vp-c-text-2);
  font-size: 14px;
  line-height: 1.6;
  max-width: 600px;
  margin: 0 auto;
}

.error-detail {
  color: var(--vp-c-text-3);
  font-size: 12px;
  margin-top: 8px;
  font-family: monospace;
}

.model-list-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.model-list-table th,
.model-list-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid var(--vp-c-divider);
}

.model-list-table th {
  font-weight: 600;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
}

.model-list-table tr:hover {
  background: var(--vp-c-bg-soft);
}

.col-id { width: 50%; }
.col-owner { width: 25%; }
.col-created { width: 25%; }
</style>
