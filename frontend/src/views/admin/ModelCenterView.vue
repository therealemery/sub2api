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
            <p>选择 logo、展示状态、版本和说明。隐藏后只是不在前台模型中心显示，不影响渠道、分组和真实调用。</p>
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

        <div v-else class="admin-model-grid">
          <article
            v-for="(model, index) in form.models"
            :key="model.id"
            class="admin-model-card"
            :class="{ 'is-expanded': expandedModelId === model.id }"
          >
            <div class="model-card-header">
              <button type="button" class="model-card-summary" @click="toggleModelCard(model.id)">
                <div class="model-logo-preview">
                  <img :src="model.logo" :alt="model.name" />
                </div>
                <div class="model-card-title">
                  <h4>{{ model.name || '未命名模型' }}</h4>
                  <p>{{ visibleVersions(model).join(' / ') || model.statusLabel }}</p>
                </div>
                <span class="model-card-expand-label">
                  {{ expandedModelId === model.id ? '收起' : '配置' }}
                </span>
              </button>
              <div class="model-card-state">
                <span class="model-status-chip">{{ model.statusLabel }}</span>
                <label class="model-visible-toggle">
                  <input v-model="model.visible" type="checkbox" />
                  <span>显示</span>
                </label>
              </div>
            </div>

            <div v-show="expandedModelId === model.id" class="model-card-form">
              <div class="model-form-section">
                <div class="model-form-section-title">
                  <h5>基础展示</h5>
                  <p>控制前台卡片里用户直接看到的名称、状态和说明。</p>
                </div>
                <div class="model-form-grid">
                  <label>
                    <span>模型名称</span>
                    <input v-model="model.name" class="input" type="text" />
                  </label>
                  <label>
                    <span>Logo</span>
                    <select v-model="model.logo" class="input" @change="syncNameFromLogo(model)">
                      <option v-for="option in logoOptions" :key="option.id" :value="option.logo">
                        {{ option.name }}
                      </option>
                    </select>
                  </label>
                  <label>
                    <span>展示状态</span>
                    <select v-model="model.status" class="input" @change="syncStatusLabel(model)">
                      <option v-for="option in statusOptions" :key="option.value" :value="option.value">
                        {{ option.label }}
                      </option>
                    </select>
                  </label>
                  <label>
                    <span>状态文案</span>
                    <input v-model="model.statusLabel" class="input" type="text" />
                  </label>
                  <label class="model-card-wide">
                    <span>展示说明</span>
                    <textarea v-model="model.description" class="input" rows="2"></textarea>
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
                      v-for="(_, itemIndex) in model.versions"
                      :key="`${model.id}-version-${itemIndex}`"
                      v-model="model.versions[itemIndex]"
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
                      v-for="(_, itemIndex) in model.highlights"
                      :key="`${model.id}-${itemIndex}`"
                      v-model="model.highlights[itemIndex]"
                      class="input"
                      type="text"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div v-show="expandedModelId === model.id" class="model-card-footer">
              <button
                type="button"
                class="btn btn-secondary"
                :disabled="form.models.length <= 1"
                @click="removeModel(index)"
              >
                移除
              </button>
            </div>
          </article>
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
import { onMounted, ref } from 'vue'
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
  return model.versions.map((item) => item.trim()).filter(Boolean).slice(0, 2)
}

function toggleModelCard(modelId: string) {
  expandedModelId.value = expandedModelId.value === modelId ? null : modelId
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
  if (form.value.models.length <= 1) return
  form.value.models.splice(index, 1)
}

async function loadConfig() {
  loading.value = true
  try {
    const settings = await settingsAPI.getSettings()
    form.value = cloneModelCenterConfig(normalizeModelCenterConfig(settings.model_center_config))
    form.value.models.forEach(normalizeModelForEditing)
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

.admin-model-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
}

.admin-model-card {
  display: grid;
  gap: 0;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  background: var(--bg-surface-alt);
  color: var(--text-primary);
  overflow: hidden;
  padding: 0;
  transition: none;
}

.admin-model-card.is-expanded {
  grid-column: span 2;
  border-color: var(--border-strong);
  background: var(--bg-surface);
}

.model-card-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  padding: 12px;
}

.admin-model-card.is-expanded .model-card-header {
  border-bottom: 1px solid var(--border-subtle);
}

.model-card-summary {
  display: grid;
  width: 100%;
  min-width: 0;
  grid-template-columns: 42px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: inherit;
  cursor: pointer;
  padding: 0;
  text-align: left;
}

.model-card-summary:hover,
.model-card-summary:focus-visible {
  background: transparent;
  outline: none;
}

.model-logo-preview {
  display: flex;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  background: var(--bg-surface);
}

.model-logo-preview img {
  display: block;
  width: 26px;
  height: 26px;
  object-fit: contain;
}

.model-card-title {
  min-width: 0;
}

.admin-model-card h4 {
  overflow: hidden;
  font-size: 14px;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.admin-model-card p {
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.model-card-state {
  display: grid;
  justify-items: end;
  gap: 8px;
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
  border: 1px solid var(--border-default);
  background: var(--bg-surface);
  color: var(--text-primary);
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

.model-card-form {
  display: grid;
  gap: 12px;
  padding: 12px;
}

.model-form-section {
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  background: var(--bg-surface-alt);
  padding: 14px;
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
  gap: 12px;
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
  padding: 12px;
}

.model-save-bar {
  padding: 16px 18px;
}

@media (max-width: 980px) {
  .admin-model-card.is-expanded {
    grid-column: span 1;
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
