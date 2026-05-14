<template>
  <AppLayout>
    <div class="mx-auto max-w-4xl space-y-6">
      <PageIntro
        :title="t('redeem.title')"
        :description="t('redeem.description')"
        compact
      />

      <div class="grid gap-4 md:grid-cols-2">
        <div class="card p-5">
          <p class="text-sm font-medium text-[var(--text-muted)]">{{ t('redeem.currentBalance') }}</p>
          <p class="money-value mt-2 text-3xl font-bold">{{ formatPoints(currentPoints) }}</p>
        </div>
        <div class="card p-5">
          <p class="text-sm font-medium text-[var(--text-muted)]">{{ t('redeem.concurrency') }}</p>
          <p class="mt-2 text-3xl font-bold text-[var(--text-primary)]">
            {{ user?.concurrency || 0 }}
            <span class="text-base font-medium text-[var(--text-muted)]">{{ t('redeem.requests') }}</span>
          </p>
        </div>
      </div>

      <div class="card p-6">
        <form class="space-y-5" @submit.prevent="handleRedeem">
          <div>
            <label for="code" class="input-label">{{ t('redeem.redeemCodeLabel') }}</label>
            <div class="relative mt-1">
              <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <Icon name="gift" size="md" class="text-[var(--text-muted)]" />
              </div>
              <input
                id="code"
                v-model="redeemCode"
                type="text"
                required
                :placeholder="t('redeem.redeemCodePlaceholder')"
                :disabled="submitting"
                class="input py-3 pl-12 text-lg"
              />
            </div>
            <p class="input-hint">{{ t('redeem.redeemCodeHint') }}</p>
          </div>

          <button
            type="submit"
            :disabled="!redeemCode.trim() || submitting"
            class="btn btn-primary w-full py-3"
          >
            <Icon v-if="submitting" name="refresh" size="md" class="mr-2 animate-spin" />
            <Icon v-else name="checkCircle" size="md" class="mr-2" />
            {{ submitting ? t('redeem.redeeming') : t('redeem.redeemButton') }}
          </button>
        </form>
      </div>

      <transition name="fade">
        <div v-if="redeemResult" class="card border-emerald-200 bg-emerald-50">
          <div class="flex items-start gap-4 p-6">
            <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-100">
              <Icon name="checkCircle" size="md" class="text-emerald-700" />
            </div>
            <div class="flex-1">
              <h3 class="text-sm font-semibold text-emerald-900">{{ t('redeem.redeemSuccess') }}</h3>
              <div class="mt-2 space-y-1 text-sm text-emerald-800">
                <p>{{ redeemResult.message }}</p>
                <p v-if="redeemResult.type === 'balance'" class="font-medium">
                  {{ t('redeem.added') }}: {{ formatPoints(redeemResult.value) }}
                </p>
                <p v-else-if="redeemResult.type === 'concurrency'" class="font-medium">
                  {{ t('redeem.added') }}: {{ redeemResult.value }} {{ t('redeem.concurrentRequests') }}
                </p>
                <p v-else-if="redeemResult.type === 'subscription'" class="font-medium">
                  {{ t('redeem.subscriptionAssigned') }}
                  <span v-if="redeemResult.group_name"> - {{ redeemResult.group_name }}</span>
                  <span v-if="redeemResult.validity_days">
                    ({{ t('redeem.subscriptionDays', { days: redeemResult.validity_days }) }})
                  </span>
                </p>
                <p v-if="redeemResult.new_balance !== undefined">
                  {{ t('redeem.newBalance') }}:
                  <span class="font-semibold">{{ formatPoints(redeemResult.new_balance) }}</span>
                </p>
                <p v-if="redeemResult.new_concurrency !== undefined">
                  {{ t('redeem.newConcurrency') }}:
                  <span class="font-semibold">
                    {{ redeemResult.new_concurrency }} {{ t('redeem.requests') }}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </transition>

      <transition name="fade">
        <div v-if="errorMessage" class="card border-red-200 bg-red-50">
          <div class="flex items-start gap-4 p-6">
            <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-red-100">
              <Icon name="exclamationCircle" size="md" class="text-red-700" />
            </div>
            <div class="flex-1">
              <h3 class="text-sm font-semibold text-red-900">{{ t('redeem.redeemFailed') }}</h3>
              <p class="mt-2 text-sm text-red-800">{{ errorMessage }}</p>
            </div>
          </div>
        </div>
      </transition>

      <div class="card p-6">
        <div class="flex items-start gap-4">
          <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface-alt)]">
            <Icon name="infoCircle" size="md" class="text-[var(--text-secondary)]" />
          </div>
          <div class="flex-1">
            <h3 class="text-sm font-semibold text-[var(--text-primary)]">{{ t('redeem.aboutCodes') }}</h3>
            <ul class="mt-2 list-inside list-disc space-y-1 text-sm text-[var(--text-secondary)]">
              <li>{{ t('redeem.codeRule1') }}</li>
              <li>{{ t('redeem.codeRule2') }}</li>
              <li>
                {{ t('redeem.codeRule3') }}
                <span
                  v-if="contactInfo"
                  class="ml-1.5 inline-flex items-center rounded-md bg-[var(--bg-surface-alt)] px-2 py-0.5 text-xs font-medium text-[var(--text-primary)]"
                >
                  {{ contactInfo }}
                </span>
              </li>
              <li>{{ t('redeem.codeRule4') }}</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="border-b border-[var(--border-default)] px-6 py-4">
          <h2 class="text-lg font-semibold text-[var(--text-primary)]">{{ t('redeem.recentActivity') }}</h2>
        </div>
        <div class="p-6">
          <div v-if="loadingHistory" class="flex items-center justify-center py-8">
            <Icon name="refresh" size="md" class="animate-spin text-[var(--text-muted)]" />
          </div>

          <div v-else-if="history.length > 0" class="space-y-3">
            <div
              v-for="item in history"
              :key="item.id"
              class="flex items-center justify-between gap-4 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface-alt)] p-4"
            >
              <div class="flex min-w-0 items-center gap-4">
                <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--bg-surface)]">
                  <Icon
                    v-if="isBalanceType(item.type)"
                    name="creditCard"
                    size="md"
                    class="text-[var(--text-secondary)]"
                  />
                  <Icon
                    v-else-if="isSubscriptionType(item.type)"
                    name="badge"
                    size="md"
                    class="text-[var(--text-secondary)]"
                  />
                  <Icon v-else name="bolt" size="md" class="text-[var(--text-secondary)]" />
                </div>
                <div class="min-w-0">
                  <p class="truncate text-sm font-medium text-[var(--text-primary)]">
                    {{ getHistoryItemTitle(item) }}
                  </p>
                  <p class="text-xs text-[var(--text-muted)]">{{ formatDateTime(item.used_at) }}</p>
                </div>
              </div>
              <div class="shrink-0 text-right">
                <p :class="['text-sm font-semibold', historyValueClass(item)]">
                  {{ formatHistoryValue(item) }}
                </p>
                <p
                  v-if="!isAdminAdjustment(item.type)"
                  class="font-mono text-xs text-[var(--text-muted)]"
                >
                  {{ item.code.slice(0, 8) }}...
                </p>
                <p v-else class="text-xs text-[var(--text-muted)]">{{ t('redeem.adminAdjustment') }}</p>
              </div>
            </div>
          </div>

          <div v-else class="empty-state py-8">
            <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-[var(--bg-surface-alt)]">
              <Icon name="clock" size="xl" class="text-[var(--text-muted)]" />
            </div>
            <p class="text-sm text-[var(--text-muted)]">{{ t('redeem.historyWillAppear') }}</p>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { useSubscriptionStore } from '@/stores/subscriptions'
import { authAPI, redeemAPI, type RedeemHistoryItem } from '@/api'
import AppLayout from '@/components/layout/AppLayout.vue'
import PageIntro from '@/components/common/PageIntro.vue'
import Icon from '@/components/icons/Icon.vue'
import { formatDateTime } from '@/utils/format'

const { t } = useI18n()
const authStore = useAuthStore()
const appStore = useAppStore()
const subscriptionStore = useSubscriptionStore()

const user = computed(() => authStore.user)
const currentPoints = computed(() => user.value?.points ?? user.value?.balance ?? 0)

const redeemCode = ref('')
const submitting = ref(false)
const redeemResult = ref<{
  message: string
  type: string
  value: number
  new_balance?: number
  new_concurrency?: number
  group_name?: string
  validity_days?: number
} | null>(null)
const errorMessage = ref('')
const history = ref<RedeemHistoryItem[]>([])
const loadingHistory = ref(false)
const contactInfo = ref('')

function formatPoints(value: number | null | undefined): string {
  const amount = Number(value ?? 0)
  return `${amount.toLocaleString(undefined, {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2
  })} 积分`
}

function isBalanceType(type: string): boolean {
  return type === 'balance' || type === 'admin_balance' || type === 'affiliate_balance' || type === 'points'
}

function isSubscriptionType(type: string): boolean {
  return type === 'subscription'
}

function isAdminAdjustment(type: string): boolean {
  return type === 'admin_balance' || type === 'admin_concurrency'
}

function getHistoryItemTitle(item: RedeemHistoryItem): string {
  if (item.type === 'balance' || item.type === 'points') return t('redeem.balanceAddedRedeem')
  if (item.type === 'affiliate_balance') return '邀请返利转入'
  if (item.type === 'admin_balance') {
    return item.value >= 0 ? t('redeem.balanceAddedAdmin') : t('redeem.balanceDeductedAdmin')
  }
  if (item.type === 'concurrency') return t('redeem.concurrencyAddedRedeem')
  if (item.type === 'admin_concurrency') {
    return item.value >= 0 ? t('redeem.concurrencyAddedAdmin') : t('redeem.concurrencyReducedAdmin')
  }
  if (item.type === 'subscription') return t('redeem.subscriptionAssigned')
  return t('common.unknown')
}

function formatHistoryValue(item: RedeemHistoryItem): string {
  if (isBalanceType(item.type)) {
    const sign = item.value >= 0 ? '+' : ''
    return `${sign}${formatPoints(item.value)}`
  }
  if (isSubscriptionType(item.type)) {
    const days = item.validity_days || Math.round(item.value)
    const groupName = item.group?.name || ''
    return groupName ? `${days}${t('redeem.days')} - ${groupName}` : `${days}${t('redeem.days')}`
  }
  const sign = item.value >= 0 ? '+' : ''
  return `${sign}${item.value} ${t('redeem.requests')}`
}

function historyValueClass(item: RedeemHistoryItem): string {
  if (isBalanceType(item.type)) {
    return item.value >= 0 ? 'text-emerald-700' : 'text-red-700'
  }
  if (isSubscriptionType(item.type)) return 'text-[var(--accent)]'
  return item.value >= 0 ? 'text-[var(--text-primary)]' : 'text-red-700'
}

async function fetchHistory(): Promise<void> {
  loadingHistory.value = true
  try {
    history.value = await redeemAPI.getHistory()
  } catch (error) {
    console.error('Failed to fetch redeem history:', error)
  } finally {
    loadingHistory.value = false
  }
}

async function handleRedeem(): Promise<void> {
  const code = redeemCode.value.trim()
  if (!code) {
    appStore.showError(t('redeem.pleaseEnterCode'))
    return
  }

  submitting.value = true
  errorMessage.value = ''
  redeemResult.value = null

  try {
    const result = await redeemAPI.redeem(code)
    redeemResult.value = result
    await authStore.refreshUser()

    if (result.type === 'subscription') {
      try {
        await subscriptionStore.fetchActiveSubscriptions(true)
      } catch (error) {
        console.error('Failed to refresh subscriptions after redeem:', error)
        appStore.showWarning(t('redeem.subscriptionRefreshFailed'))
      }
    }

    redeemCode.value = ''
    await fetchHistory()
    appStore.showSuccess(t('redeem.codeRedeemSuccess'))
  } catch (error: any) {
    errorMessage.value = error.response?.data?.detail || t('redeem.failedToRedeem')
    appStore.showError(t('redeem.redeemFailed'))
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  void fetchHistory()
  try {
    const settings = await authAPI.getPublicSettings()
    contactInfo.value = settings.contact_info || ''
  } catch (error) {
    console.error('Failed to load public settings:', error)
  }
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--duration-fast) var(--ease-standard);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
