<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Chart as ChartJS,
  CategoryScale,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip
} from 'chart.js'
import { Line } from 'vue-chartjs'
import type { OpsThroughputTrendPoint } from '@/api/admin/ops'
import type { ChartState } from '../types'
import { formatHistoryLabel, sumNumbers } from '../utils/opsFormatters'
import HelpTooltip from '@/components/common/HelpTooltip.vue'
import EmptyState from '@/components/common/EmptyState.vue'

ChartJS.register(Title, Tooltip, Legend, LineElement, LinearScale, PointElement, CategoryScale, Filler)

interface Props {
  points: OpsThroughputTrendPoint[]
  loading: boolean
  timeRange: string
  fullscreen?: boolean
}

const props = defineProps<Props>()
const { t } = useI18n()

const isDarkMode = computed(() => document.documentElement.classList.contains('dark'))

function getCssVar(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
}

const colors = computed(() => ({
  accent: getCssVar('--accent', '#d96941'),
  accentSoft: isDarkMode.value ? 'rgba(217, 105, 65, 0.16)' : 'rgba(217, 105, 65, 0.10)',
  grid: getCssVar('--border-default', isDarkMode.value ? '#3a3833' : '#ddd7ce'),
  surface: getCssVar('--bg-surface', isDarkMode.value ? '#252420' : '#ffffff'),
  text: getCssVar('--text-muted', isDarkMode.value ? '#a6a097' : '#7d746a'),
  title: getCssVar('--text-primary', isDarkMode.value ? '#e8e6df' : '#22201c')
}))

const totalRequests = computed(() => sumNumbers(props.points.map((p) => p.request_count)))
const totalSwitches = computed(() => sumNumbers(props.points.map((p) => p.switch_count)))

const switchRateValues = computed(() =>
  props.points.map((p) => {
    const requests = p.request_count ?? 0
    const switches = p.switch_count ?? 0
    if (requests <= 0) return 0
    return (switches / requests) * 100
  })
)

const averageSwitchRate = computed(() => {
  if (totalRequests.value <= 0) return null
  return (totalSwitches.value / totalRequests.value) * 100
})

const latestSwitchRate = computed(() => {
  const lastPoint = [...props.points].reverse().find((p) => (p.request_count ?? 0) > 0)
  if (!lastPoint) return null
  return ((lastPoint.switch_count ?? 0) / (lastPoint.request_count ?? 1)) * 100
})

const peakSwitchRate = computed(() => {
  if (!switchRateValues.value.length) return null
  return Math.max(...switchRateValues.value)
})

const activeBucketCount = computed(() => props.points.filter((p) => (p.request_count ?? 0) > 0).length)

function formatRate(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return '-'
  return `${value.toFixed(value >= 10 ? 1 : 2)}%`
}

const chartData = computed(() => {
  if (!props.points.length || totalRequests.value <= 0) return null
  return {
    labels: props.points.map((p) => formatHistoryLabel(p.bucket_start, props.timeRange)),
    datasets: [
      {
        label: t('admin.ops.switchRate'),
        data: switchRateValues.value,
        borderColor: colors.value.accent,
        backgroundColor: colors.value.accentSoft,
        fill: true,
        tension: 0.28,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHitRadius: 12,
        pointBackgroundColor: colors.value.surface,
        pointBorderColor: colors.value.accent,
        pointBorderWidth: 2
      }
    ]
  }
})

const state = computed<ChartState>(() => {
  if (chartData.value) return 'ready'
  if (props.loading) return 'loading'
  return 'empty'
})

const options = computed(() => {
  const c = colors.value
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' as const },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: c.surface,
        titleColor: c.title,
        bodyColor: c.text,
        borderColor: c.grid,
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: (context: any) => {
            const value = typeof context?.parsed?.y === 'number' ? context.parsed.y : 0
            return `${t('admin.ops.switchRate')}: ${formatRate(value)}`
          }
        }
      }
    },
    scales: {
      x: {
        type: 'category' as const,
        grid: { display: false },
        ticks: {
          color: c.text,
          font: { size: 10 },
          maxTicksLimit: 8,
          autoSkip: true,
          autoSkipPadding: 10
        }
      },
      y: {
        type: 'linear' as const,
        beginAtZero: true,
        suggestedMax: Math.max(1, (peakSwitchRate.value ?? 0) * 1.25),
        display: true,
        position: 'left' as const,
        grid: { color: c.grid },
        border: { display: false },
        ticks: {
          color: c.text,
          font: { size: 10 },
          maxTicksLimit: 5,
          callback: (value: any) => formatRate(Number(value))
        }
      }
    }
  }
})
</script>

<template>
  <div class="flex h-full flex-col rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface-alt)] p-4">
    <div class="mb-4 flex shrink-0 flex-col gap-3">
      <div class="flex items-start justify-between gap-3">
        <div>
          <h3 class="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-[var(--text-inverse)]">
        <svg class="h-4 w-4 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h10M7 12h6m-6 5h3" />
        </svg>
        {{ t('admin.ops.switchRateTrend') }}
        <HelpTooltip v-if="!props.fullscreen" :content="t('admin.ops.tooltips.switchRateTrend')" />
      </h3>
          <p class="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
            观察账号切换是否异常升高，用于判断上游账号池是否稳定。
          </p>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-2">
        <div class="rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2">
          <div class="text-[10px] font-medium uppercase tracking-wide text-gray-400">当前</div>
          <div class="mt-1 text-sm font-semibold text-gray-900 dark:text-[var(--text-inverse)]">{{ formatRate(latestSwitchRate) }}</div>
        </div>
        <div class="rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2">
          <div class="text-[10px] font-medium uppercase tracking-wide text-gray-400">平均</div>
          <div class="mt-1 text-sm font-semibold text-[var(--accent)]">{{ formatRate(averageSwitchRate) }}</div>
        </div>
        <div class="rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2">
          <div class="text-[10px] font-medium uppercase tracking-wide text-gray-400">峰值</div>
          <div class="mt-1 text-sm font-semibold text-gray-900 dark:text-[var(--text-inverse)]">{{ formatRate(peakSwitchRate) }}</div>
        </div>
      </div>
    </div>

    <div class="min-h-0 flex-1 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] p-3">
      <Line v-if="state === 'ready' && chartData" :data="chartData" :options="options" />
      <div v-else class="flex h-full items-center justify-center">
        <div v-if="state === 'loading'" class="animate-pulse text-sm text-gray-400">{{ t('common.loading') }}</div>
        <EmptyState v-else :title="t('common.noData')" :description="t('admin.ops.charts.emptyRequest')" />
      </div>
    </div>

    <div v-if="state === 'ready'" class="mt-3 text-[11px] text-gray-500 dark:text-gray-400">
      已统计 {{ activeBucketCount }} 个有效时间段，数值越高表示账号池切换越频繁。
    </div>
  </div>
</template>
