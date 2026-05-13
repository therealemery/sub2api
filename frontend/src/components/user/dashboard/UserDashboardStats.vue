<template>
  <section class="dashboard-stats">
    <div class="dashboard-primary-grid">
      <article
        v-for="item in primaryMetrics"
        :key="item.label"
        class="dashboard-primary-card"
      >
        <p>{{ item.label }}</p>
        <strong :class="{ 'money-value': item.isMoney }">{{ item.value }}</strong>
        <span>{{ item.detail }}</span>
      </article>
    </div>

    <div class="dashboard-secondary-strip">
      <div
        v-for="item in secondaryMetrics"
        :key="item.label"
        class="dashboard-secondary-item"
      >
        <span>{{ item.label }}</span>
        <strong :class="{ 'money-value': item.isMoney }">{{ item.value }}</strong>
        <small>{{ item.detail }}</small>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { UserDashboardStats as UserStatsType } from '@/api/usage'

const props = defineProps<{
  stats: UserStatsType
  balance: number
  isSimple: boolean
}>()

const { t } = useI18n()

const formatBalance = (b: number) =>
  new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(b)

const formatNumber = (n: number) => n.toLocaleString()
const formatCost = (c: number) => c.toFixed(4)
const formatTokens = (value: number) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
  return value.toString()
}
const formatDuration = (ms: number) => ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms.toFixed(0)}ms`

interface DashboardMetric {
  label: string
  value: string
  detail: string
  isMoney?: boolean
}

const primaryMetrics = computed<DashboardMetric[]>(() => {
  const base = props.isSimple
    ? []
    : [{
        label: t('dashboard.balance'),
        value: `$${formatBalance(props.balance)}`,
        detail: t('common.available'),
        isMoney: true
      }]

  return [
    ...base,
    {
      label: t('dashboard.todayRequests'),
      value: formatNumber(props.stats.today_requests || 0),
      detail: `${t('common.total')}: ${formatNumber(props.stats.total_requests || 0)}`
    },
    {
      label: t('dashboard.todayCost'),
      value: `$${formatCost(props.stats.today_actual_cost || 0)}`,
      detail: `${t('dashboard.standard')}: $${formatCost(props.stats.today_cost || 0)}`,
      isMoney: true
    },
    {
      label: t('dashboard.todayTokens'),
      value: formatTokens(props.stats.today_tokens || 0),
      detail: `${t('dashboard.input')}: ${formatTokens(props.stats.today_input_tokens || 0)} / ${t('dashboard.output')}: ${formatTokens(props.stats.today_output_tokens || 0)}`
    }
  ].slice(0, 3)
})

const secondaryMetrics = computed<DashboardMetric[]>(() => [
  {
    label: t('dashboard.apiKeys'),
    value: String(props.stats.total_api_keys || 0),
    detail: `${props.stats.active_api_keys || 0} ${t('common.active')}`
  },
  {
    label: t('dashboard.totalTokens'),
    value: formatTokens(props.stats.total_tokens || 0),
    detail: `${t('dashboard.input')}: ${formatTokens(props.stats.total_input_tokens || 0)}`
  },
  {
    label: t('dashboard.performance'),
    value: `${formatTokens(props.stats.rpm || 0)} RPM`,
    detail: `${formatTokens(props.stats.tpm || 0)} TPM`
  },
  {
    label: t('dashboard.avgResponse'),
    value: formatDuration(props.stats.average_duration_ms || 0),
    detail: t('dashboard.averageTime')
  },
  {
    label: t('common.total'),
    value: `$${formatCost(props.stats.total_actual_cost || 0)}`,
    detail: `${t('dashboard.standard')}: $${formatCost(props.stats.total_cost || 0)}`,
    isMoney: true
  }
])
</script>

<style scoped>
.dashboard-stats {
  display: grid;
  gap: 14px;
}

.dashboard-primary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.dashboard-primary-card,
.dashboard-secondary-strip {
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  background: var(--bg-surface);
}

.dashboard-primary-card {
  display: grid;
  gap: 8px;
  min-width: 0;
  padding: 20px;
}

.dashboard-primary-card p,
.dashboard-secondary-item small {
  margin: 0;
  color: var(--text-secondary);
  font-size: var(--text-caption, 12px);
  line-height: 1.5;
}

.dashboard-primary-card p,
.dashboard-secondary-item span {
  margin: 0;
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 600;
  line-height: 1.5;
}

.dashboard-primary-card strong {
  overflow: hidden;
  color: var(--text-primary);
  font-size: 28px;
  font-weight: 500;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dashboard-primary-card span {
  color: var(--text-primary);
  font-size: var(--text-body-sm, 14px);
  line-height: 1.5;
}

.dashboard-secondary-strip {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  overflow: hidden;
}

.dashboard-secondary-item {
  display: grid;
  gap: 3px;
  min-width: 0;
  background: var(--bg-surface-alt);
  padding: 14px 16px;
}

.dashboard-secondary-item + .dashboard-secondary-item {
  border-left: 1px solid var(--border-default);
}

.dashboard-secondary-item strong {
  overflow: hidden;
  color: var(--text-primary);
  font-size: 18px;
  font-weight: 600;
  line-height: 1.5;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 1100px) {
  .dashboard-primary-grid {
    grid-template-columns: 1fr;
  }

  .dashboard-secondary-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .dashboard-secondary-item + .dashboard-secondary-item {
    border-left: 0;
    border-top: 1px solid var(--border-default);
  }
}

@media (max-width: 640px) {
  .dashboard-primary-card {
    padding: 18px;
  }

  .dashboard-primary-card strong {
    font-size: 24px;
  }

  .dashboard-secondary-strip {
    grid-template-columns: 1fr;
  }
}
</style>
