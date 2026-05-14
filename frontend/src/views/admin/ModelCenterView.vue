<template>
  <AppLayout>
    <div class="admin-model-center-page">
      <PageIntro
        title="模型中心配置"
        description="管理 /models 页面展示的模型卡片。这里只影响前台展示，不改变真实调用、渠道、分组或密钥逻辑。"
      >
        <template #actions>
          <router-link to="/models" class="btn btn-secondary">查看前台</router-link>
          <button type="button" class="btn btn-primary" :disabled="saving || loading" @click="saveConfig">
            {{ saving ? '保存中...' : '保存展示信息' }}
          </button>
        </template>
      </PageIntro>

      <section class="model-admin-panel">
        <div class="panel-heading panel-heading-actions">
          <div>
            <h3>模型展示卡片</h3>
            <p>管理前台模型中心的展示信息，不影响真实调用链路。</p>
          </div>
          <div class="add-model-control">
            <select v-model="selectedLogoId" class="input">
              <option v-for="option in logoOptions" :key="option.id" :value="option.id">
                {{ option.name }}
              </option>
            </select>
            <button type="button" class="btn btn-secondary" @click="addModel">添加模型</button>
          </div>
        </div>

        <div v-if="loading" class="model-loading-state">正在加载模型中心配置...</div>

        <div v-else class="admin-model-layout">
          <div class="admin-model-list" aria-label="模型展示列表">
          <article
            v-for="model in form.models"
            :key="model.id"
            class="admin-model-card"
            :class="{ 'is-selected': activeModel?.id === model.id }"
          >
            <button type="button" class="model-card-summary" @click="toggleModelCard(model.id)">
                <div class="model-logo-preview">
                  <img :src="model.logo" :alt="model.name" />
                </div>
                <div class="model-card-title">
                  <h4>{{ model.name || '未命名模型' }}</h4>
                  <p>{{ visibleVersions(model).join(' / ') || model.statusLabel }}</p>
                </div>
                <span class="model-card-expand-label">配置</span>
            </button>
            <div class="model-card-state">
                <span class="model-status-chip">{{ model.statusLabel }}</span>
                <label class="model-visible-toggle">
                  <input v-model="model.visible" type="checkbox" />
                  <span>显示</span>
                </label>
            </div>
          </article>
          </div>

          <aside v-if="activeModel" class="model-editor-panel">
            <div class="model-editor-header">
              <div class="model-logo-preview is-large">
                <img :src="activeModel.logo" :alt="activeModel.name" />
              </div>
              <div>
                <p class="editor-kicker">当前配置</p>
                <h3>{{ activeModel.name || '未命名模型' }}</h3>
                <p>点击左侧模型切换配置对象。这里仅修改前台模型中心的展示信息。</p>
              </div>
            </div>

            <div class="model-card-form">
              <div class="model-form-section">
                <div class="model-form-section-title">
                  <h5>基础展示</h5>
                  <p>控制前台卡片里用户直接看到的名称、状态和说明。</p>
                </div>
                <div class="model-form-grid">
                  <label>
                    <span>模型名称</span>
                    <input v-model="activeModel.name" class="input" type="text" />
                  </label>
                  <label>
                    <span>Logo</span>
                    <select v-model="activeModel.logo" class="input" @change="syncNameFromLogo(activeModel)">
                      <option v-for="option in logoOptions" :key="option.id" :value="option.logo">
                        {{ option.name }}
                      </option>
                    </select>
                  </label>
                  <label>
                    <span>展示状态</span>
                    <select v-model="activeModel.status" class="input" @change="syncStatusLabel(activeModel)">
                      <option v-for="option in statusOptions" :key="option.value" :value="option.value">
                        {{ option.label }}
                      </option>
                    </select>
                  </label>
                  <label>
                    <span>状态文案</span>
                    <input v-model="activeModel.statusLabel" class="input" type="text" />
                  </label>
                  <label class="model-card-wide">
                    <span>展示说明</span>
                    <textarea v-model="activeModel.description" class="input" rows="3"></textarea>
                  </label>
                </div>
              </div>

              <div class="model-form-section">
                <div class="model-form-section-title">
                  <h5>版本与标签</h5>
                  <p>只影响模型中心展示。真实可用范围仍由渠道、分组、账号和密钥配置决定。</p>
                </div>
                <div class="model-card-wide">
                  <span class="field-label">当前模型 / 版本</span>
                  <div class="model-version-inputs">
                    <input
                      v-for="(_, itemIndex) in activeModel.versions"
                      :key="`${activeModel.id}-version-${itemIndex}`"
                      v-model="activeModel.versions[itemIndex]"
                      class="input"
                      type="text"
                      placeholder="例如 GPT-5.5"
                    />
                  </div>
                </div>
                <div class="model-card-wide">
                  <span class="field-label">亮点标签</span>
                  <div class="highlight-inputs">
                    <input
                      v-for="(_, itemIndex) in activeModel.highlights"
                      :key="`${activeModel.id}-${itemIndex}`"
                      v-model="activeModel.highlights[itemIndex]"
                      class="input"
                      type="text"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="model-card-footer">
              <button
                type="button"
                class="btn btn-secondary"
                :disabled="form.models.length <= 1"
                @click="removeModel(activeModelIndex)"
              >
                移除
              </button>
            </div>
          </aside>
        </div>
      </section>

      <div class="model-save-bar">
        <p>保存后前台 /models 会读取同一份配置；真实模型可用性仍由渠道、分组、账号和密钥决定。</p>
        <button type="button" class="btn btn-primary" :disabled="saving || loading" @click="saveConfig">
          {{ saving ? '保存中...' : '保存展示信息' }}
        </button>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import PageIntro from '@/components/common/PageIntro.vue'
import { settingsAPI } from '@/api/admin/settings'
import { useAppStore } from '@/stores/app'
import { MODEL_LOGO_OPTIONS } from '@/constants/modelLogos'
import {
  cloneModelCenterConfig,
  createModelCenterModel,
  normalizeModelCenterConfig,
  type ModelCenterConfig,
  type ModelCenterModel,
  type ModelCenterStatus,
} from '@/constants/modelCenter'

const appStore = useAppStore()

const logoOptions = MODEL_LOGO_OPTIONS
const statusOptions: Array<{ value: ModelCenterStatus; label: string }> = [
  { value: 'featured', label: '主推' },
  { value: 'available', label: '已接入' },
  { value: 'ecosystem', label: '生态展示' },
]

const loading = ref(false)
const saving = ref(false)
const selectedLogoId = ref(logoOptions[0]?.id ?? '')
const expandedModelId = ref<string | null>(null)
const form = ref<ModelCenterConfig>(cloneModelCenterConfig(normalizeModelCenterConfig(null)))

const activeModel = computed(() =>
  form.value.models.find((model) => model.id === expandedModelId.value) ?? form.value.models[0] ?? null
)
const activeModelIndex = computed(() =>
  activeModel.value ? form.value.models.findIndex((model) => model.id === activeModel.value?.id) : -1
)

function normalizeHighlights(model: ModelCenterModel) {
  const next = model.highlights
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 4)

  while (next.length < 3) {
    next.push('')
  }

  model.highlights = next
}

function normalizeVersions(model: ModelCenterModel) {
  const next = model.versions
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 6)

  while (next.length < 6) {
    next.push('')
  }

  model.versions = next
}

function normalizeModelForEditing(model: ModelCenterModel) {
  normalizeVersions(model)
  normalizeHighlights(model)
}

function syncStatusLabel(model: ModelCenterModel) {
  const option = statusOptions.find((item) => item.value === model.status)
  if (option) {
    model.statusLabel = option.label
  }
}

function syncNameFromLogo(model: ModelCenterModel) {
  const option = logoOptions.find((item) => item.logo === model.logo)
  if (option && !model.name.trim()) {
    model.name = option.name
  }
}

function visibleVersions(model: ModelCenterModel) {
  return model.versions.map((item) => item.trim()).filter(Boolean).slice(0, 3)
}

function toggleModelCard(modelId: string) {
  expandedModelId.value = modelId
}

function addModel() {
  const option = logoOptions.find((item) => item.id === selectedLogoId.value) ?? logoOptions[0]
  if (!option) return

  const model = createModelCenterModel(option, String(Date.now()))
  normalizeModelForEditing(model)
  form.value.models.push(model)
  expandedModelId.value = model.id
}

function removeModel(index: number) {
  if (index < 0 || form.value.models.length <= 1) return
  form.value.models.splice(index, 1)
  expandedModelId.value = form.value.models[0]?.id ?? null
}

async function loadConfig() {
  loading.value = true
  try {
    const settings = await settingsAPI.getSettings()
    form.value = cloneModelCenterConfig(normalizeModelCenterConfig(settings.model_center_config))
    form.value.models.forEach(normalizeModelForEditing)
    expandedModelId.value = form.value.models[0]?.id ?? null
  } catch (error) {
    appStore.showToast('error', '模型中心配置加载失败')
  } finally {
    loading.value = false
  }
}

async function saveConfig() {
  saving.value = true
  try {
    form.value.models.forEach(normalizeModelForEditing)
    const updated = await settingsAPI.updateModelCenterConfig(cloneModelCenterConfig(form.value))
    form.value = cloneModelCenterConfig(normalizeModelCenterConfig(updated))
    form.value.models.forEach(normalizeModelForEditing)
    await appStore.fetchPublicSettings(true)
    appStore.showToast('success', '模型中心展示信息已保存')
  } catch (error) {
    appStore.showToast('error', '模型中心展示信息保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(loadConfig)
</script>

<style scoped>
.admin-model-center-page {
  display: grid;
  gap: 22px;
  width: 100%;
  max-width: 1240px;
  margin: 0 auto;
}

.model-admin-panel,
.model-save-bar {
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  background: var(--bg-surface);
  color: var(--text-primary);
}

.model-admin-panel {
  padding: 24px;
}

.panel-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-subtle);
}

.panel-heading-actions {
  align-items: center;
}

.panel-heading h3,
.admin-model-card h4,
.model-form-section-title h5 {
  margin: 0;
  color: var(--text-primary);
  font-weight: 700;
  letter-spacing: 0;
}

.panel-heading h3 {
  font-size: 18px;
  line-height: 1.35;
}

.panel-heading p,
.admin-model-card p,
.model-form-section-title p,
.model-save-bar p {
  margin: 7px 0 0;
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.7;
}

.model-card-wide {
  grid-column: 1 / -1;
}

.model-form-grid label {
  display: grid;
  gap: 8px;
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 700;
}

.field-label {
  display: block;
  margin-bottom: 8px;
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 700;
}

.add-model-control {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 10px;
}

.add-model-control .input {
  width: 190px;
}

.model-loading-state {
  border: 1px dashed var(--border-default);
  border-radius: var(--radius-lg);
  padding: 34px;
  color: var(--text-secondary);
  text-align: center;
}

.admin-model-layout {
  display: grid;
  grid-template-columns: minmax(280px, 340px) minmax(0, 1fr);
  gap: 18px;
  align-items: start;
}

.admin-model-list {
  display: grid;
  gap: 10px;
}

.admin-model-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 70px;
  gap: 8px;
  align-items: stretch;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  background: var(--bg-surface);
  color: var(--text-primary);
  overflow: hidden;
  padding: 8px;
  transition: none;
}

.admin-model-card.is-selected {
  border-color: var(--border-strong);
  background: var(--bg-surface);
}

.model-card-summary {
  display: grid;
  width: 100%;
  min-width: 0;
  grid-template-columns: 36px minmax(0, 1fr) auto;
  gap: 9px;
  align-items: start;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  background: var(--bg-surface);
  color: inherit;
  cursor: pointer;
  padding: 8px;
  text-align: left;
}

.model-card-summary:hover,
.model-card-summary:focus-visible {
  background: var(--bg-surface);
  outline: none;
}

.model-logo-preview {
  display: flex;
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  background: var(--bg-surface);
}

.model-logo-preview img {
  display: block;
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.model-logo-preview.is-large {
  width: 62px;
  height: 62px;
  flex: 0 0 auto;
}

.model-logo-preview.is-large img {
  width: 42px;
  height: 42px;
}

.model-card-title {
  min-width: 0;
  grid-column: 2;
}

.admin-model-card h4 {
  font-size: 14px;
  line-height: 1.35;
}

.admin-model-card p {
  margin-top: 4px;
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
}

.model-card-state {
  display: flex;
  width: 70px;
  min-width: 70px;
  align-items: center;
  flex-direction: column;
  justify-content: space-between;
  gap: 6px;
  min-height: 100%;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  background: var(--bg-surface-alt);
  padding: 7px 8px;
}

.model-card-expand-label,
.model-status-chip {
  display: inline-flex;
  min-height: 26px;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  padding: 0 9px;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.model-card-expand-label {
  align-self: start;
  border: 1px solid var(--border-default);
  background: var(--bg-surface);
  color: var(--text-primary);
  grid-column: 3;
  grid-row: 1;
  justify-self: end;
  margin-top: 0;
}

.model-status-chip {
  border: 1px solid var(--accent);
  background: var(--accent-soft);
  color: var(--accent);
}

.model-visible-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 700;
}

.model-editor-panel {
  position: sticky;
  top: 86px;
  display: grid;
  gap: 0;
  max-height: calc(100vh - 120px);
  overflow: auto;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  background: var(--bg-surface);
  color: var(--text-primary);
}

.model-editor-header {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  padding: 20px;
  border-bottom: 1px solid var(--border-default);
  background: var(--bg-surface);
}

.model-editor-header h3 {
  margin: 4px 0 0;
  color: var(--text-primary);
  font-size: 20px;
  font-weight: 800;
  line-height: 1.35;
}

.model-editor-header p {
  margin: 6px 0 0;
  color: var(--text-secondary);
  line-height: 1.65;
}

.editor-kicker {
  margin: 0 !important;
  color: var(--accent) !important;
  font-family: var(--font-mono);
  font-size: 12px !important;
  font-weight: 800;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.model-card-form {
  display: grid;
  gap: 14px;
  padding: 18px;
}

.model-form-section {
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  background: var(--bg-surface-alt);
  padding: 18px;
}

.model-form-section-title {
  margin-bottom: 14px;
}

.model-form-section-title h5 {
  font-size: 14px;
}

.model-form-grid,
.model-version-inputs,
.highlight-inputs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.model-card-footer,
.model-save-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.model-card-footer {
  border-top: 1px solid var(--border-subtle);
  padding: 16px 18px;
}

.model-save-bar {
  padding: 16px 18px;
}

:global(.app-shell .admin-model-card.is-expanded) {
  grid-column: auto !important;
}

:global(.app-shell .admin-model-card:hover),
:global(.app-shell .admin-model-card.is-selected:hover) {
  background: var(--bg-surface) !important;
  border-color: var(--border-strong) !important;
}

:global(.app-shell .admin-model-card.is-selected) {
  border-color: var(--border-strong) !important;
  background: var(--bg-surface) !important;
}

:global(.app-shell .admin-model-card .model-card-summary),
:global(.app-shell .admin-model-card .model-card-summary:hover),
:global(.app-shell .admin-model-card .model-card-summary:focus-visible) {
  background: var(--bg-surface) !important;
  box-shadow: none !important;
}

@media (max-width: 1100px) {
  .admin-model-layout {
    grid-template-columns: 1fr;
  }

  .model-editor-panel {
    position: static;
    max-height: none;
  }
}

@media (max-width: 760px) {
  .panel-heading,
  .panel-heading-actions,
  .add-model-control,
  .model-save-bar {
    align-items: stretch;
    flex-direction: column;
  }

  .add-model-control .input {
    width: 100%;
  }

  .model-form-grid,
  .model-version-inputs,
  .highlight-inputs {
    grid-template-columns: 1fr;
  }
}
</style>
