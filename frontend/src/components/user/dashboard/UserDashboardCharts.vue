<template>
  <div class="space-y-6">
    <!-- Date Range Filter -->
    <div class="card dashboard-chart-toolbar p-4">
      <div class="mb-4">
        <h3>{{ t('dashboard.tokenUsageTrend') }}</h3>
        <p>按时间查看调用变化，下面的模型分布用于判断主要消耗来自哪里。</p>
      </div>
      <div class="flex flex-wrap items-center gap-4">
        <div class="flex items-center gap-2">
          <span class="text-sm font-medium text-gray-700">{{ t('dashboard.timeRange') }}:</span>
          <DateRangePicker :start-date="startDate" :end-date="endDate" @update:startDate="$emit('update:startDate', $event)" @update:endDate="$emit('update:endDate', $event)" @change="$emit('dateRangeChange', $event)" />
        </div>
        <button @click="$emit('refresh')" :disabled="loading" class="btn btn-secondary">
          {{ t('common.refresh') }}
        </button>
        <div class="ml-auto flex items-center gap-2">
          <span class="text-sm font-medium text-gray-700">{{ t('dashboard.granularity') }}:</span>
          <div class="w-28">
            <Select :model-value="granularity" :options="[{value:'day', label:t('dashboard.day')}, {value:'hour', label:t('dashboard.hour')}]" @update:model-value="$emit('update:granularity', $event)" @change="$emit('granularityChange')" />
          </div>
        </div>
      </div>
    </div>

    <!-- Charts Grid -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <!-- Model Distribution Chart -->
      <div class="card dashboard-chart-card relative overflow-hidden p-4">
        <div v-if="loading" class="dashboard-loading-mask absolute inset-0 z-10 flex items-center justify-center backdrop-blur-sm">
          <LoadingSpinner size="md" />
        </div>
        <div class="mb-4">
          <h3 class="text-sm font-semibold text-gray-900">{{ t('dashboard.modelDistribution') }}</h3>
          <p class="mt-1 text-xs text-gray-500">识别主要使用模型，避免把所有消耗都混在一起看。</p>
        </div>
        <div class="flex items-center gap-6">
          <div class="h-48 w-48">
            <Doughnut v-if="modelData" :data="modelData" :options="doughnutOptions" />
            <div v-else class="flex h-full items-center justify-center text-sm text-gray-500">{{ t('dashboard.noDataAvailable') }}</div>
          </div>
          <div class="max-h-48 flex-1 overflow-y-auto">
            <table class="w-full text-xs">
              <thead>
                <tr class="text-gray-500">
                  <th class="pb-2 text-left">{{ t('dashboard.model') }}</th>
                  <th class="pb-2 text-right">{{ t('dashboard.requests') }}</th>
                  <th class="pb-2 text-right">{{ t('dashboard.tokens') }}</th>
                  <th class="pb-2 text-right">{{ t('dashboard.actual') }}</th>
                  <th class="pb-2 text-right">{{ t('dashboard.standard') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="model in models" :key="model.model" class="border-t border-gray-100">
                  <td class="py-1.5 font-medium text-gray-900" :title="model.model">
                    <span class="model-table-name">
                      <img v-if="getModelLogo(model.model)" :src="getModelLogo(model.model)" :alt="getModelDisplayName(model.model)" />
                      <span>{{ model.model }}</span>
                    </span>
                  </td>
                  <td class="py-1.5 text-right text-gray-600">{{ formatNumber(model.requests) }}</td>
                  <td class="py-1.5 text-right text-gray-600">{{ formatTokens(model.total_tokens) }}</td>
                  <td class="py-1.5 text-right text-green-600">${{ formatCost(model.actual_cost) }}</td>
                  <td class="py-1.5 text-right text-gray-400">${{ formatCost(model.cost) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Token Usage Trend Chart -->
      <TokenUsageTrend :trend-data="trend" :loading="loading" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import DateRangePicker from '@/components/common/DateRangePicker.vue'
import Select from '@/components/common/Select.vue'
import { Doughnut } from 'vue-chartjs'
import TokenUsageTrend from '@/components/charts/TokenUsageTrend.vue'
import type { TrendDataPoint, ModelStat } from '@/types'
import { formatCostFixed as formatCost, formatNumberLocaleString as formatNumber, formatTokensK as formatTokens } from '@/utils/format'
import { getModelDisplayName, getModelLogo } from '@/constants/modelLogos'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js'
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler)

const props = defineProps<{ loading: boolean, startDate: string, endDate: string, granularity: string, trend: TrendDataPoint[], models: ModelStat[] }>()
defineEmits(['update:startDate', 'update:endDate', 'update:granularity', 'dateRangeChange', 'granularityChange', 'refresh'])
const { t } = useI18n()

const modelData = computed(() => !props.models?.length ? null : {
  labels: props.models.map((m: ModelStat) => m.model),
  datasets: [{
    data: props.models.map((m: ModelStat) => m.total_tokens),
    backgroundColor: [
      '#c4471a',
      '#287a4b',
      '#986b16',
      '#ef4444',
      '#9a7b63',
      '#a73c2e',
      '#BB4D1B',
      '#b8851f',
      '#6f6258',
      '#4a7c3c',
      '#716d64',
      '#a855f7'
    ].slice(0, props.models.length),
    borderWidth: 0
  }]
})

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (context: any) => `${context.label}: ${formatTokens(context.parsed)} tokens`
      }
    }
  }
}
</script>

<style scoped>
.dashboard-chart-toolbar,
.dashboard-chart-card {
  background: var(--bg-surface) !important;
}

.dashboard-loading-mask {
  background: color-mix(in srgb, var(--bg-surface) 78%, transparent);
}

.dashboard-chart-toolbar h3 {
  margin: 0;
  color: var(--text-primary);
  font-size: var(--text-body, 16px);
  font-weight: 500;
  line-height: 1.5;
}

.dashboard-chart-toolbar p {
  margin: 4px 0 0;
  color: var(--text-secondary);
  font-size: var(--text-caption, 12px);
  line-height: 1.6;
}

.dashboard-chart-card {
  border-color: var(--border-default) !important;
}

.model-table-name {
  display: inline-flex;
  max-width: 140px;
  align-items: center;
  gap: 8px;
}

.model-table-name img {
  width: 18px;
  height: 18px;
  flex: 0 0 auto;
  object-fit: contain;
}

.model-table-name span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .dashboard-chart-card :deep(.flex.items-center.gap-6) {
    align-items: stretch;
    flex-direction: column;
  }

  .dashboard-chart-card :deep(.h-48.w-48) {
    width: 100%;
  }
}
</style>
