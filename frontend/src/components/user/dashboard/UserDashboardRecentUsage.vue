<template>
  <div class="card">
    <div class="flex items-center justify-between border-b border-gray-100 px-6 py-4 border-[var(--border-default)]">
      <h2 class="text-lg font-semibold text-gray-900">{{ t('dashboard.recentUsage') }}</h2>
      <span class="badge badge-gray">{{ t('dashboard.last7Days') }}</span>
    </div>
    <div class="p-6">
      <div v-if="loading" class="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
      <div v-else-if="data.length === 0" class="py-8">
        <EmptyState :title="t('dashboard.noUsageRecords')" :description="t('dashboard.startUsingApi')" />
      </div>
      <div v-else class="space-y-3">
        <div v-for="log in data" :key="log.id" class="recent-usage-row">
          <div class="flex items-center gap-4">
            <div class="recent-model-logo">
              <img v-if="getModelLogo(log.model)" :src="getModelLogo(log.model)" :alt="getModelDisplayName(log.model)" />
              <Icon v-else name="beaker" size="md" />
            </div>
            <div>
              <p class="text-sm font-medium text-gray-900">{{ log.model }}</p>
              <p class="text-xs text-gray-500 text-[var(--text-muted)]">{{ formatDateTime(log.created_at) }}</p>
            </div>
          </div>
          <div class="text-right">
            <p class="text-sm font-semibold">
              <span class="money-value" :title="t('dashboard.actual')">${{ formatCost(log.actual_cost) }}</span>
              <span class="font-normal text-gray-400" :title="t('dashboard.standard')"> / ${{ formatCost(log.total_cost) }}</span>
            </p>
            <p class="text-xs text-gray-500 text-[var(--text-muted)]">{{ (log.input_tokens + log.output_tokens).toLocaleString() }} tokens</p>
          </div>
        </div>

        <router-link to="/usage" class="flex items-center justify-center gap-2 py-3 text-sm font-medium text-gray-700 transition-colors hover:text-gray-900">
          {{ t('dashboard.viewAllUsage') }}
          <Icon name="arrowRight" size="sm" />
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import Icon from '@/components/icons/Icon.vue'
import { formatDateTime } from '@/utils/format'
import { getModelDisplayName, getModelLogo } from '@/constants/modelLogos'
import type { UsageLog } from '@/types'

defineProps<{
  data: UsageLog[]
  loading: boolean
}>()
const { t } = useI18n()
const formatCost = (c: number) => c.toFixed(4)
</script>

<style scoped>
.recent-usage-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border: 1px solid var(--border-default);
  border-radius: 16px;
  background: var(--bg-surface-alt);
  padding: 14px;
  transition: background-color 0.15s ease;
}

.recent-usage-row:hover {
  background: var(--bg-surface-alt);
}

.recent-model-logo {
  display: flex;
  width: 42px;
  height: 42px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-default);
  border-radius: 14px;
  background: var(--bg-surface-alt);
  color: var(--text-primary);
}

.recent-model-logo img {
  display: block;
  width: 24px;
  height: 24px;
  object-fit: contain;
}

@media (max-width: 640px) {
  .recent-usage-row {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
