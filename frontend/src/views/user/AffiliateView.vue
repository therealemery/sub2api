<template>
  <AppLayout>
    <div class="mx-auto max-w-6xl space-y-6">
      <PageIntro
        :title="t('affiliate.title')"
        :description="t('affiliate.description')"
        compact
      />

      <div v-if="loading" class="flex justify-center py-12">
        <div
          class="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border-focus)] border-t-transparent"
        ></div>
      </div>

      <template v-else-if="detail">
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div class="card p-5">
            <p class="flex items-center gap-1.5 text-sm text-gray-500 text-[var(--text-muted)]">
              <Icon name="dollar" size="sm" class="text-[var(--accent)]" />
              {{ t('affiliate.stats.rebateRate') }}
            </p>
            <p class="mt-2 text-2xl font-semibold text-[var(--accent)] text-[var(--accent)]">
              {{ formattedRebateRate }}<span class="ml-0.5 text-base font-medium">%</span>
            </p>
            <p class="mt-1 text-xs text-gray-400 text-[var(--text-muted)]">
              {{ t('affiliate.stats.rebateRateHint') }}
            </p>
          </div>
          <div class="card p-5">
            <p class="text-sm text-gray-500 text-[var(--text-muted)]">{{ t('affiliate.stats.invitedUsers') }}</p>
            <p class="mt-2 text-2xl font-semibold text-gray-900">
              {{ formatCount(detail.aff_count) }}
            </p>
          </div>
          <div class="card p-5">
            <p class="text-sm text-gray-500 text-[var(--text-muted)]">{{ t('affiliate.stats.availableQuota') }}</p>
            <p class="mt-2 text-2xl font-semibold text-emerald-600">
              {{ formatPoints(detail.aff_quota) }}
            </p>
          </div>
          <div class="card p-5">
            <p class="text-sm text-gray-500 text-[var(--text-muted)]">{{ t('affiliate.stats.totalQuota') }}</p>
            <p class="mt-2 text-2xl font-semibold text-gray-900">
              {{ formatPoints(detail.aff_history_quota) }}
            </p>
            <p v-if="detail.aff_frozen_quota > 0" class="mt-1 text-xs text-amber-600">
              {{ t('affiliate.stats.frozenQuota') }}: {{ formatPoints(detail.aff_frozen_quota) }}
            </p>
          </div>
        </div>

        <div class="card p-5">
          <h3 class="text-base font-semibold text-[var(--text-primary)]">积分返利闭环</h3>
          <div class="mt-3 grid gap-3 md:grid-cols-4">
            <div class="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface-alt)] p-3">
              <p class="text-sm font-bold text-[var(--text-primary)]">分享邀请码</p>
              <p class="mt-1 text-sm text-[var(--text-secondary)]">将专属邀请码或链接发送给新用户。</p>
            </div>
            <div class="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface-alt)] p-3">
              <p class="text-sm font-bold text-[var(--text-primary)]">新用户充值</p>
              <p class="mt-1 text-sm text-[var(--text-secondary)]">对方完成积分购买后，系统记录邀请关系。</p>
            </div>
            <div class="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface-alt)] p-3">
              <p class="text-sm font-bold text-[var(--text-primary)]">获得返利积分</p>
              <p class="mt-1 text-sm text-[var(--text-secondary)]">返利比例按后台配置计算，默认展示为当前比例。</p>
            </div>
            <div class="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface-alt)] p-3">
              <p class="text-sm font-bold text-[var(--text-primary)]">转入账户</p>
              <p class="mt-1 text-sm text-[var(--text-secondary)]">可用返利积分可转入账户积分，用于后续调用。</p>
            </div>
          </div>
        </div>

        <div class="card p-6">
          <h3 class="text-base font-semibold text-gray-900">{{ t('affiliate.title') }}</h3>
          <p class="mt-1 text-sm text-gray-500 text-[var(--text-muted)]">{{ t('affiliate.description') }}</p>

          <div class="mt-5 grid gap-4 md:grid-cols-2">
            <div class="space-y-2">
              <p class="text-sm font-medium text-gray-700">{{ t('affiliate.yourCode') }}</p>
              <div class="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 border-[var(--border-default)] bg-[var(--bg-surface-alt)]">
                <code class="flex-1 truncate text-sm font-semibold text-gray-900">{{ detail.aff_code }}</code>
                <button class="btn btn-secondary btn-sm" @click="copyCode">
                  <Icon name="copy" size="sm" />
                  <span>{{ t('affiliate.copyCode') }}</span>
                </button>
              </div>
            </div>

            <div class="space-y-2">
              <p class="text-sm font-medium text-gray-700">{{ t('affiliate.inviteLink') }}</p>
              <div class="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 border-[var(--border-default)] bg-[var(--bg-surface-alt)]">
                <code class="flex-1 truncate text-sm text-gray-700">{{ inviteLink }}</code>
                <button class="btn btn-secondary btn-sm" @click="copyInviteLink">
                  <Icon name="copy" size="sm" />
                  <span>{{ t('affiliate.copyLink') }}</span>
                </button>
              </div>
            </div>
          </div>

          <div class="mt-5 rounded-lg border border-[var(--border-focus)] bg-[var(--bg-surface-alt)] p-4 border-[var(--border-focus)] bg-[var(--bg-surface-alt)]">
            <p class="text-sm font-medium text-[var(--accent)] text-[var(--accent)]">{{ t('affiliate.tips.title') }}</p>
            <ul class="mt-2 space-y-1 text-sm text-[var(--accent)] text-[var(--accent)]">
              <li>1. {{ t('affiliate.tips.line1') }}</li>
              <li>2. {{ t('affiliate.tips.line2', { rate: `${formattedRebateRate}%` }) }}</li>
              <li>3. {{ t('affiliate.tips.line3') }}</li>
              <li v-if="detail.aff_frozen_quota > 0">4. {{ t('affiliate.tips.line4') }}</li>
            </ul>
          </div>
        </div>

        <div class="card p-6">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 class="text-base font-semibold text-gray-900">{{ t('affiliate.transfer.title') }}</h3>
              <p class="mt-1 text-sm text-gray-500 text-[var(--text-muted)]">{{ t('affiliate.transfer.description') }}</p>
            </div>
            <button
              class="btn btn-primary"
              :disabled="transferring || detail.aff_quota <= 0"
              @click="transferQuota"
            >
              <Icon v-if="transferring" name="refresh" size="sm" class="animate-spin" />
              <Icon v-else name="dollar" size="sm" />
              <span>{{ transferring ? t('affiliate.transfer.transferring') : t('affiliate.transfer.button') }}</span>
            </button>
          </div>
          <p v-if="detail.aff_quota <= 0" class="mt-3 text-sm text-amber-600">
            {{ t('affiliate.transfer.empty') }}
          </p>
        </div>

        <div class="card p-6">
          <h3 class="text-base font-semibold text-gray-900">{{ t('affiliate.invitees.title') }}</h3>
          <div v-if="detail.invitees.length === 0" class="mt-4 rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 border-[var(--border-default)] text-[var(--text-muted)]">
            {{ t('affiliate.invitees.empty') }}
          </div>
          <div v-else class="mt-4 overflow-x-auto">
            <table class="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr class="border-b border-gray-200 text-gray-500 border-[var(--border-default)] text-[var(--text-muted)]">
                  <th class="px-3 py-2 font-medium">{{ t('affiliate.invitees.columns.email') }}</th>
                  <th class="px-3 py-2 font-medium">{{ t('affiliate.invitees.columns.username') }}</th>
                  <th class="px-3 py-2 font-medium text-right">{{ t('affiliate.invitees.columns.rebate') }}</th>
                  <th class="px-3 py-2 font-medium">{{ t('affiliate.invitees.columns.joinedAt') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in detail.invitees"
                  :key="item.user_id"
                  class="border-b border-gray-100 last:border-b-0 border-[var(--border-default)]"
                >
                  <td class="px-3 py-3 text-gray-900">{{ item.email || '-' }}</td>
                  <td class="px-3 py-3 text-gray-700">{{ item.username || '-' }}</td>
                  <td class="px-3 py-3 text-right font-medium text-emerald-600">{{ formatPoints(item.total_rebate) }}</td>
                  <td class="px-3 py-3 text-gray-700">{{ formatDateTime(item.created_at) || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AppLayout from '@/components/layout/AppLayout.vue'
import PageIntro from '@/components/common/PageIntro.vue'
import Icon from '@/components/icons/Icon.vue'
import userAPI from '@/api/user'
import type { UserAffiliateDetail } from '@/types'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import { useClipboard } from '@/composables/useClipboard'
import { formatDateTime } from '@/utils/format'
import { extractApiErrorMessage } from '@/utils/apiError'

const { t } = useI18n()
const appStore = useAppStore()
const authStore = useAuthStore()
const { copyToClipboard } = useClipboard()

const loading = ref(true)
const transferring = ref(false)
const detail = ref<UserAffiliateDetail | null>(null)

const inviteLink = computed(() => {
  if (!detail.value) return ''
  if (typeof window === 'undefined') return `/register?aff=${encodeURIComponent(detail.value.aff_code)}`
  return `${window.location.origin}/register?aff=${encodeURIComponent(detail.value.aff_code)}`
})

// Rebate rate is a percentage in the range [0, 100]; backend already clamps it.
// Trim trailing zeros so values like 20.00 and 12.50 render as 20 and 12.5.
const formattedRebateRate = computed(() => {
  const v = detail.value?.effective_rebate_rate_percent ?? 0
  const rounded = Math.round(v * 100) / 100
  return Number.isInteger(rounded) ? String(rounded) : rounded.toString()
})

function formatCount(value: number): string {
  return value.toLocaleString()
}

function formatPoints(value: number | null | undefined): string {
  const amount = Number(value ?? 0)
  return `${amount.toLocaleString(undefined, {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2
  })} 积分`
}

async function loadAffiliateDetail(silent = false): Promise<void> {
  if (!silent) {
    loading.value = true
  }
  try {
    detail.value = await userAPI.getAffiliateDetail()
  } catch (error) {
    appStore.showError(extractApiErrorMessage(error, t('affiliate.loadFailed')))
  } finally {
    if (!silent) {
      loading.value = false
    }
  }
}

async function copyCode(): Promise<void> {
  if (!detail.value?.aff_code) return
  await copyToClipboard(detail.value.aff_code, t('affiliate.codeCopied'))
}

async function copyInviteLink(): Promise<void> {
  if (!inviteLink.value) return
  await copyToClipboard(inviteLink.value, t('affiliate.linkCopied'))
}

async function transferQuota(): Promise<void> {
  if (!detail.value || detail.value.aff_quota <= 0 || transferring.value) return
  transferring.value = true
  try {
    const resp = await userAPI.transferAffiliateQuota()
    appStore.showSuccess(t('affiliate.transfer.success', { amount: formatPoints(resp.transferred_quota) }))
    await Promise.all([
      loadAffiliateDetail(true),
      authStore.refreshUser().catch(() => undefined),
    ])
  } catch (error) {
    appStore.showError(extractApiErrorMessage(error, t('affiliate.transferFailed')))
  } finally {
    transferring.value = false
  }
}

onMounted(() => {
  void loadAffiliateDetail()
})
</script>
