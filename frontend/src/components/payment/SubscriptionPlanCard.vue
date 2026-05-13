<template>
  <div class="subscription-plan-card">
    <div class="subscription-plan-card__body">
      <div class="subscription-plan-card__header">
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <h3 class="subscription-plan-card__title">{{ plan.name }}</h3>
            <span class="subscription-plan-card__badge">{{ pLabel }}</span>
          </div>
          <p v-if="plan.description" class="subscription-plan-card__description">
            {{ plan.description }}
          </p>
        </div>
        <span v-if="isRenewal" class="subscription-plan-card__state">
          {{ t('payment.activeSubscription') }}
        </span>
      </div>

      <div class="subscription-plan-card__price-row">
        <div>
          <div class="flex items-baseline gap-2">
            <span class="money-value text-3xl font-bold">¥{{ plan.price }}</span>
            <span class="text-sm text-gray-500 dark:text-gray-400">/ {{ validitySuffix }}</span>
          </div>
          <div v-if="plan.original_price" class="mt-1 flex items-center gap-2 text-sm">
            <span class="text-gray-400 line-through dark:text-gray-500">¥{{ plan.original_price }}</span>
            <span v-if="discountText" class="subscription-plan-card__discount">{{ discountText }}</span>
          </div>
        </div>
      </div>

      <div class="subscription-plan-card__metrics">
        <div class="subscription-plan-card__metric">
          <span>{{ t('payment.planCard.rate') }}</span>
          <strong>{{ rateDisplay }}</strong>
        </div>
        <div v-for="item in quotaItems" :key="item.label" class="subscription-plan-card__metric">
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
        </div>
      </div>

      <div v-if="modelScopeLabels.length > 0" class="subscription-plan-card__models">
        <span>{{ t('payment.planCard.models') }}</span>
        <div>
          <span v-for="scope in modelScopeLabels" :key="scope">{{ scope }}</span>
        </div>
      </div>

      <div v-if="featureItems.length > 0" class="subscription-plan-card__features">
        <span v-for="feature in featureItems" :key="feature">{{ feature }}</span>
      </div>

      <button type="button" class="btn btn-primary w-full" @click="emit('select', plan)">
        {{ isRenewal ? t('payment.renewNow') : t('payment.subscribeNow') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { SubscriptionPlan } from '@/types/payment'
import type { UserSubscription } from '@/types'
import { platformLabel } from '@/utils/platformColors'

const props = defineProps<{ plan: SubscriptionPlan; activeSubscriptions?: UserSubscription[] }>()
const emit = defineEmits<{ select: [plan: SubscriptionPlan] }>()
const { t } = useI18n()

const isRenewal = computed(() =>
  props.activeSubscriptions?.some(s => s.group_id === props.plan.group_id && s.status === 'active') ?? false
)

const pLabel = computed(() => platformLabel(props.plan.group_platform || ''))

const discountText = computed(() => {
  if (!props.plan.original_price || props.plan.original_price <= 0) return ''
  const pct = Math.round((1 - props.plan.price / props.plan.original_price) * 100)
  return pct > 0 ? `-${pct}%` : ''
})

const rateDisplay = computed(() => {
  const rate = props.plan.rate_multiplier ?? 1
  return `×${Number(rate.toPrecision(10))}`
})

const quotaItems = computed(() => {
  const items: Array<{ label: string; value: string }> = []
  if (props.plan.daily_limit_usd != null) {
    items.push({ label: t('payment.planCard.dailyLimit'), value: `$${props.plan.daily_limit_usd}` })
  }
  if (props.plan.weekly_limit_usd != null) {
    items.push({ label: t('payment.planCard.weeklyLimit'), value: `$${props.plan.weekly_limit_usd}` })
  }
  if (props.plan.monthly_limit_usd != null) {
    items.push({ label: t('payment.planCard.monthlyLimit'), value: `$${props.plan.monthly_limit_usd}` })
  }
  if (items.length === 0) {
    items.push({ label: t('payment.planCard.quota'), value: t('payment.planCard.unlimited') })
  }
  return items.slice(0, 2)
})

const MODEL_SCOPE_LABELS: Record<string, string> = {
  claude: 'Claude',
  gemini_text: 'Gemini',
  gemini_image: 'Imagen',
}

const modelScopeLabels = computed(() => {
  const scopes = props.plan.supported_model_scopes
  if (!scopes || scopes.length === 0) return []
  return scopes.map(s => MODEL_SCOPE_LABELS[s] || s).slice(0, 3)
})

const featureItems = computed(() => (props.plan.features || []).slice(0, 3))

const validitySuffix = computed(() => {
  const u = props.plan.validity_unit || 'day'
  if (u === 'month') return t('payment.perMonth')
  if (u === 'year') return t('payment.perYear')
  return `${props.plan.validity_days}${t('payment.days')}`
})
</script>

<style scoped>
.subscription-plan-card {
  min-width: 0;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  background: var(--bg-surface);
  transition: border-color 0.16s ease, transform 0.16s ease;
}

.subscription-plan-card:hover {
  border-color: var(--border-strong);
  transform: translateY(-1px);
}

.subscription-plan-card__body {
  display: flex;
  min-height: 100%;
  flex-direction: column;
  gap: 16px;
  padding: 18px;
}

.subscription-plan-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.subscription-plan-card__title {
  min-width: 0;
  color: var(--text-primary);
  font-size: 17px;
  font-weight: 600;
  line-height: 1.35;
}

.subscription-plan-card__badge,
.subscription-plan-card__state,
.subscription-plan-card__discount,
.subscription-plan-card__features span,
.subscription-plan-card__models span {
  border-radius: var(--radius-md);
  background: var(--bg-surface-alt);
  color: var(--text-primary);
  font-size: 12px;
  line-height: 1.35;
}

.subscription-plan-card__badge,
.subscription-plan-card__state,
.subscription-plan-card__discount {
  padding: 4px 9px;
  white-space: nowrap;
}

.subscription-plan-card__description {
  margin-top: 8px;
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.65;
}

.subscription-plan-card__price-row {
  border-top: 1px solid var(--border-default);
  padding-top: 14px;
}

.subscription-plan-card__metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.subscription-plan-card__metric {
  min-width: 0;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  background: var(--bg-surface-alt);
  padding: 10px;
}

.subscription-plan-card__metric span {
  display: block;
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.4;
}

.subscription-plan-card__metric strong {
  display: block;
  margin-top: 4px;
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 600;
  line-height: 1.35;
}

.subscription-plan-card__models {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: var(--text-secondary);
  font-size: 12px;
}

.subscription-plan-card__models > div {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
}

.subscription-plan-card__models span,
.subscription-plan-card__features span {
  padding: 5px 9px;
}

.subscription-plan-card__features {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

@media (max-width: 520px) {
  .subscription-plan-card__metrics {
    grid-template-columns: 1fr;
  }

  .subscription-plan-card__header {
    flex-direction: column;
  }
}
</style>
