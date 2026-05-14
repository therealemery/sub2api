<template>
  <div>
    <!-- Tags display -->
    <div class="flex flex-wrap gap-1.5 rounded-lg border border-gray-200 bg-[var(--bg-surface)] p-2 border-[var(--border-default)] bg-[var(--bg-surface-alt)] min-h-[2.5rem]">
      <span
        v-for="(model, idx) in models"
        :key="idx"
        class="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-sm"
        :class="getPlatformTagClass(props.platform || '')"
      >
        <img v-if="getModelLogo(model)" :src="getModelLogo(model)" :alt="getModelDisplayName(model)" class="model-tag-logo" />
        {{ model }}
        <button
          type="button"
          @click="removeModel(idx)"
          class="ml-0.5 rounded-full p-0.5 hover:bg-[var(--bg-subtle)]"
        >
          <Icon name="x" size="xs" />
        </button>
      </span>
      <input
        ref="inputRef"
        v-model="inputValue"
        type="text"
        class="flex-1 min-w-[120px] border-none bg-transparent text-sm outline-none placeholder:text-gray-400"
        :placeholder="models.length === 0 ? placeholder : ''"
        @keydown.enter.prevent="addModel"
        @keydown.tab.prevent="addModel"
        @keydown.delete="handleBackspace"
        @paste="handlePaste"
        @blur="addModel"
      />
    </div>
    <p class="mt-1 text-xs text-gray-400">
      {{ t('admin.channels.form.modelInputHint', 'Press Enter to add, supports paste for batch import.') }}
    </p>
    <div class="model-logo-picker" aria-label="Model logo suggestions">
      <button
        v-for="option in MODEL_LOGO_OPTIONS"
        :key="option.id"
        type="button"
        class="model-logo-option"
        @click="addSuggestedModel(option.sampleModels[0])"
      >
        <img :src="option.logo" :alt="option.name" />
        <span>{{ option.name }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Icon from '@/components/icons/Icon.vue'
import { getPlatformTagClass } from './types'
import { MODEL_LOGO_OPTIONS, getModelDisplayName, getModelLogo } from '@/constants/modelLogos'

const { t } = useI18n()

const props = defineProps<{
  models: string[]
  placeholder?: string
  platform?: string
}>()

const emit = defineEmits<{
  'update:models': [models: string[]]
}>()

const inputValue = ref('')
const inputRef = ref<HTMLInputElement>()

function addModel() {
  const val = inputValue.value.trim()
  if (!val) return
  if (!props.models.includes(val)) {
    emit('update:models', [...props.models, val])
  }
  inputValue.value = ''
}

function removeModel(idx: number) {
  const newModels = [...props.models]
  newModels.splice(idx, 1)
  emit('update:models', newModels)
}

function addSuggestedModel(model: string) {
  if (!props.models.includes(model)) {
    emit('update:models', [...props.models, model])
  }
}

function handleBackspace() {
  if (inputValue.value === '' && props.models.length > 0) {
    removeModel(props.models.length - 1)
  }
}

function handlePaste(e: ClipboardEvent) {
  e.preventDefault()
  const text = e.clipboardData?.getData('text') || ''
  const items = text.split(/[,\n;]+/).map(s => s.trim()).filter(Boolean)
  if (items.length === 0) return
  const unique = [...new Set([...props.models, ...items])]
  emit('update:models', unique)
  inputValue.value = ''
}
</script>

<style scoped>
.model-tag-logo {
  width: 14px;
  height: 14px;
  object-fit: contain;
}

.model-logo-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.model-logo-option {
  display: inline-flex;
  min-height: 34px;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  background: var(--bg-surface);
  padding: 0 12px;
  color: var(--text-primary);
  font-size: 12px;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}

.model-logo-option:hover {
  border-color: var(--border-strong);
  background: var(--bg-surface-alt);
}

.model-logo-option img {
  width: 18px;
  height: 18px;
  object-fit: contain;
}
</style>
