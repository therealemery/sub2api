<template>
  <div>
    <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
      {{ t('payment.paymentMethod') }}
    </label>
    <div class="grid grid-cols-2 gap-3 sm:flex">
      <button
        v-for="method in sortedMethods"
        :key="method.type"
        type="button"
        :disabled="!method.available"
        :class="[
          'payment-method-option relative flex h-[60px] flex-col items-center justify-center rounded-lg border px-3 transition-colors sm:flex-1',
          !method.available
            ? 'payment-method-option-disabled cursor-not-allowed opacity-50'
            : selected === method.type
              ? methodSelectedClass(method.type)
              : 'payment-method-option-idle',
        ]"
        @click="method.available && emit('select', method.type)"
      >
        <span class="flex items-center gap-2">
          <img :src="methodIcon(method.type)" :alt="t(`payment.methods.${method.type}`)" class="h-7 w-7" />
          <span class="flex flex-col items-start leading-none">
            <span class="text-base font-semibold">{{ t(`payment.methods.${method.type}`) }}</span>
            <span
              v-if="method.fee_rate > 0"
              class="text-[10px] tracking-wide text-gray-500 text-[var(--text-muted)]"
            >
              {{ t('payment.fee') }} {{ method.fee_rate }}%
            </span>
          </span>
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { METHOD_ORDER } from './providerConfig'
import stripeIcon from '@/assets/icons/stripe.svg'

export interface PaymentMethodOption {
  type: string
  fee_rate: number
  available: boolean
}

const props = defineProps<{
  methods: PaymentMethodOption[]
  selected: string
}>()

const emit = defineEmits<{
  select: [type: string]
}>()

const { t } = useI18n()

const METHOD_ICONS: Record<string, string> = {
  stripe: stripeIcon,
}

const sortedMethods = computed(() => {
  const order: readonly string[] = METHOD_ORDER
  return [...props.methods].sort((a, b) => {
    const ai = order.indexOf(a.type)
    const bi = order.indexOf(b.type)
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
  })
})

function methodIcon(type: string): string {
  return METHOD_ICONS[type] || stripeIcon
}

function methodSelectedClass(_type: string): string {
  return 'payment-method-option-selected'
}
</script>

<style scoped>
.payment-method-option {
  background: var(--bg-surface);
  border-color: var(--border-default);
  color: var(--text-primary);
}

.payment-method-option-idle:hover {
  border-color: var(--border-strong);
}

.payment-method-option-selected {
  background: var(--bg-surface-alt);
  border-color: var(--text-primary);
  color: var(--text-primary);
}

.payment-method-option-disabled {
  background: var(--bg-surface-alt);
  border-color: var(--border-default);
}

:global(.dark) .payment-method-option {
  background: var(--bg-page);
  border-color: var(--border-default);
  color: var(--bg-surface);
}

:global(.dark) .payment-method-option-idle:hover {
  border-color: var(--border-strong);
}

:global(.dark) .payment-method-option-selected {
  background: var(--bg-surface);
  border-color: var(--border-default);
  color: var(--bg-surface);
}

:global(.dark) .payment-method-option-disabled {
  background: var(--bg-page);
  border-color: var(--border-default);
}
</style>
