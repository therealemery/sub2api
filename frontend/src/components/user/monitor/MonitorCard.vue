<template>
  <button
    type="button"
    class="monitor-card group text-left p-5 rounded-lg min-h-[280px] w-full border transition-colors duration-200 ease-out flex flex-col"
    @click="emit('click')"
  >
    <!-- Header: icon + name/model + status chip -->
    <div class="flex items-start gap-3">
      <span class="monitor-card-model-logo">
        <img
          v-if="primaryLogo"
          :src="primaryLogo"
          :alt="getModelDisplayName(item.primary_model)"
        />
        <ProviderIcon v-else :provider="item.provider" :size="20" />
      </span>
      <div class="flex-1 min-w-0">
        <div class="text-base font-semibold truncate text-gray-900 dark:text-gray-100">
          {{ item.name }}
        </div>
        <div class="mt-0.5 flex items-center gap-1.5 min-w-0">
          <span
            class="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium flex-shrink-0"
            :class="providerBadgeClass(item.provider)"
          >
            {{ providerLabel(item.provider) }}
          </span>
          <span class="font-mono text-xs truncate text-gray-500 dark:text-gray-400">
            {{ item.primary_model }}
          </span>
          <span
            v-if="item.group_name"
            class="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-600 bg-[var(--bg-surface-alt)] dark:text-gray-300 flex-shrink-0"
          >
            {{ item.group_name }}
          </span>
        </div>
      </div>
      <span
        class="px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0"
        :class="statusBadgeClass(item.primary_status)"
      >
        {{ statusLabel(item.primary_status) }}
      </span>
    </div>

    <div v-if="modelChips.length" class="monitor-card-models">
      <span v-for="model in modelChips" :key="model" class="monitor-card-model-chip">
        <img
          v-if="getModelLogo(model)"
          :src="getModelLogo(model)"
          :alt="getModelDisplayName(model)"
        />
        <span>{{ model }}</span>
      </span>
    </div>

    <!-- Metrics -->
    <MonitorMetricPair
      primary-icon="bolt"
      :primary-label="t('monitorCommon.dialogLatency')"
      :primary-value="formatLatency(item.primary_latency_ms)"
      primary-unit="ms"
      secondary-icon="globe"
      :secondary-label="t('monitorCommon.endpointPing')"
      :secondary-value="formatLatency(item.primary_ping_latency_ms)"
      secondary-unit="ms"
    />

    <!-- Divider -->
    <div class="mt-4 border-t border-gray-100 border-[var(--border-default)]"></div>

    <!-- Availability row -->
    <MonitorAvailabilityRow
      :window-label="availabilityLabel"
      :value="availabilityValue"
      :samples-label="extraModelsCountLabel"
    />

    <!-- Timeline -->
    <MonitorTimeline
      :buckets="item.timeline"
      :countdown-seconds="countdownSeconds"
    />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { UserMonitorView } from '@/api/channelMonitor'
import { useChannelMonitorFormat } from '@/composables/useChannelMonitorFormat'
import { getModelDisplayName, getModelLogo } from '@/constants/modelLogos'
import ProviderIcon from './ProviderIcon.vue'
import MonitorMetricPair from './MonitorMetricPair.vue'
import MonitorAvailabilityRow from './MonitorAvailabilityRow.vue'
import MonitorTimeline from './MonitorTimeline.vue'

const props = defineProps<{
  item: UserMonitorView
  window: '7d' | '15d' | '30d'
  availabilityValue: number | null
  countdownSeconds: number
}>()

const emit = defineEmits<{
  (e: 'click'): void
}>()

const { t } = useI18n()
const {
  statusLabel,
  statusBadgeClass,
  providerLabel,
  providerBadgeClass,
  formatLatency,
} = useChannelMonitorFormat()

const primaryLogo = computed(() => getModelLogo(props.item.primary_model))

const modelChips = computed(() => {
  const models = [
    props.item.primary_model,
    ...(props.item.extra_models ?? []).map((item) => item.model),
  ]
  return Array.from(new Set(models.filter(Boolean))).slice(0, 5)
})

const availabilityLabel = computed(() => {
  const win = t(`channelStatus.windowTab.${props.window}`)
  return `${t('monitorCommon.availabilityPrefix')} · ${win}`
})

const extraModelsCountLabel = computed(() => {
  const count = props.item.extra_models?.length ?? 0
  if (count === 0) return undefined
  return t('monitorCommon.extraModelsCount', { n: count })
})
</script>

<style scoped>
.monitor-card {
  border-color: var(--border-default);
  background: var(--bg-surface);
  box-shadow: none;
}

.monitor-card:hover {
  border-color: var(--border-strong);
  transform: translateY(-1px);
}

.monitor-card-model-logo {
  display: grid;
  width: 36px;
  height: 36px;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid var(--border-default);
  border-radius: 12px;
  background: var(--bg-surface-alt);
  color: var(--text-primary);
}

.monitor-card-model-logo img {
  width: 22px;
  height: 22px;
  object-fit: contain;
}

.monitor-card-models {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 16px;
  min-width: 0;
}

.monitor-card-model-chip {
  display: inline-flex;
  max-width: 100%;
  min-height: 28px;
  align-items: center;
  gap: 6px;
  overflow: hidden;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  background: var(--bg-surface-alt);
  padding: 4px 9px;
  color: var(--text-primary);
  font-size: 12px;
  font-weight: 700;
  line-height: 1.3;
}

.monitor-card-model-chip img {
  width: 14px;
  height: 14px;
  flex: 0 0 auto;
  object-fit: contain;
}

.monitor-card-model-chip span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:global(.dark) .monitor-card-model-logo,
:global(.dark) .monitor-card-model-chip {
  background: rgba(255, 255, 255, 0.06);
}

:global(.dark) .monitor-card-model-logo img,
:global(.dark) .monitor-card-model-chip img {
  filter: none;
}
</style>
