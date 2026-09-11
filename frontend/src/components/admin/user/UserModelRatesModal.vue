<template>
  <BaseDialog :show="show" :title="t('admin.users.modelRatesTitle')" width="wide" @close="$emit('close')">
    <div v-if="user" class="space-y-5">
      <div class="rounded-xl border border-blue-100 bg-blue-50/70 p-4 text-sm text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200">
        {{ t('admin.users.modelRatesHint', { email: user.email }) }}
      </div>

      <div>
        <label class="input-label">{{ t('admin.users.ownApiCustomerGroup') }}</label>
        <Select v-model="selectedGroupId" :options="groupOptions" :disabled="loading || saving" />
      </div>

      <div v-if="loading" class="py-10 text-center text-sm text-gray-500">{{ t('admin.users.loadingModelRates') }}</div>
      <div v-else class="max-h-[52vh] overflow-y-auto rounded-xl border border-gray-200 dark:border-dark-600">
        <div v-if="rows.length === 0" class="p-8 text-center text-sm text-gray-500">{{ t('admin.users.noConfigurableModels') }}</div>
        <div v-for="row in rows" :key="row.modelId" class="flex items-center gap-4 border-b border-gray-100 px-4 py-3 last:border-0 dark:border-dark-700">
          <div class="min-w-0 flex-1">
            <div class="truncate text-sm font-medium text-gray-900 dark:text-white">{{ row.displayName }}</div>
            <div class="truncate text-xs text-gray-500 dark:text-gray-400">{{ row.modelId }}</div>
          </div>
          <input v-model="row.value" type="number" min="0.0001" step="0.01" :placeholder="t('admin.users.inheritRate')" class="input w-28 text-right" :disabled="saving" />
          <button v-if="row.value !== ''" type="button" class="text-xs text-gray-500 hover:text-red-500" @click="row.value = ''">{{ t('admin.users.clearRate') }}</button>
        </div>
      </div>

      <div class="flex items-center justify-end gap-3">
        <button type="button" class="btn btn-secondary" :disabled="saving" @click="$emit('close')">{{ t('common.cancel') }}</button>
        <button type="button" class="btn btn-primary" :disabled="saving || loading || !selectedGroupId" @click="save">{{ saving ? t('admin.users.saving') : t('admin.users.saveModelRates') }}</button>
      </div>
    </div>
  </BaseDialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import BaseDialog from '@/components/common/BaseDialog.vue'
import Select from '@/components/common/Select.vue'
import { adminAPI } from '@/api/admin'
import type { AdminGroup, AdminUser } from '@/types'
import { verifiedModelSeedData } from '@/data/modelCatalog'
import { useAppStore } from '@/stores/app'
import { useI18n } from 'vue-i18n'

const props = defineProps<{ show: boolean; user: AdminUser | null; groups: AdminGroup[] }>()
const emit = defineEmits<{ close: []; success: [] }>()
const appStore = useAppStore()
const { t } = useI18n()
const selectedGroupId = ref<number | null>(null)
const loading = ref(false)
const saving = ref(false)
const rows = ref<Array<{ modelId: string; displayName: string; value: string | number }>>([])

const groupOptions = computed(() => props.groups
  .filter(g => g.status === 'active' && g.subscription_type === 'standard')
  .map(g => ({ value: g.id, label: `${g.name} (${g.rate_multiplier ?? 1}x)` })))

const load = async () => {
  if (!props.user || !selectedGroupId.value) return
  loading.value = true
  try {
    const overrides = await adminAPI.users.getModelRateOverrides(props.user.id, selectedGroupId.value)
    const map = new Map(overrides.map(item => [item.model_id.toLowerCase(), String(item.rate_multiplier)]))
    rows.value = verifiedModelSeedData
      .filter(seed => seed.pricingStatus === 'paid' && seed.modelId.trim())
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(seed => ({ modelId: seed.modelId, displayName: seed.displayName, value: map.get(seed.modelId.toLowerCase()) ?? '' }))
  } catch (error: any) {
    appStore.showError(error.response?.data?.detail || t('admin.users.failedToLoadModelRates'))
  } finally {
    loading.value = false
  }
}

const save = async () => {
  if (!props.user || !selectedGroupId.value) return
  saving.value = true
  try {
    const configured = rows.value.filter(row => String(row.value).trim() !== '')
    const entries = configured.map(row => ({ model_id: row.modelId, rate_multiplier: Number(row.value) }))
    if (entries.some(row => !Number.isFinite(row.rate_multiplier) || row.rate_multiplier <= 0)) {
      appStore.showError(t('admin.users.invalidModelRate'))
      return
    }
    await adminAPI.users.setModelRateOverrides(props.user.id, selectedGroupId.value, entries)
    appStore.showSuccess(t('admin.users.modelRatesSaved'))
    emit('success')
    emit('close')
  } catch (error: any) {
    appStore.showError(error.response?.data?.detail || t('admin.users.failedToSaveModelRates'))
  } finally {
    saving.value = false
  }
}

watch(() => [props.show, props.user?.id, props.groups.length] as const, () => {
  if (!props.show) return
  if (!selectedGroupId.value || !groupOptions.value.some(option => option.value === selectedGroupId.value)) {
    selectedGroupId.value = groupOptions.value[0]?.value ?? null
  }
  void load()
}, { immediate: true })
watch(selectedGroupId, () => { if (props.show) void load() })
</script>
