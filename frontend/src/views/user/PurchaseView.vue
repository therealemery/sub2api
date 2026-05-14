<template>
  <AppLayout>
    <div class="purchase-page mx-auto max-w-6xl space-y-6">
      <PageIntro
        eyebrow="积分支付"
        title="购买积分与套餐权益"
        description="通过 Stripe 购买平台积分，或选择适合的套餐权益。积分用于模型调用消耗，套餐用于固定周期内的额度与费率权益。"
        compact
      >
        <template #actions>
          <RouterLink to="/orders" class="btn btn-secondary">查看订单</RouterLink>
          <RouterLink to="/subscriptions" class="btn btn-secondary">套餐权益</RouterLink>
        </template>
      </PageIntro>

      <div v-if="loading" class="purchase-loading card">
        <div class="purchase-spinner" aria-hidden="true"></div>
        <p>正在加载支付配置...</p>
      </div>

      <PaymentStatusPanel
        v-else-if="paymentPhase === 'paying'"
        :order-id="paymentState.orderId"
        :qr-code="paymentState.qrCode"
        :expires-at="paymentState.expiresAt"
        :payment-type="paymentState.paymentType"
        :pay-url="paymentState.payUrl"
        :order-type="paymentState.orderType"
        @done="onPaymentDone"
        @success="onPaymentSuccess"
        @settled="onPaymentSettled"
      />

      <template v-else>
        <section class="purchase-choice-grid">
          <button
            v-if="!checkout.balance_disabled"
            type="button"
            class="purchase-choice-card"
            :class="{ 'purchase-choice-card-active': activeTab === 'points' }"
            @click="switchTab('points')"
          >
            <span class="purchase-choice-kicker">Points</span>
            <strong>购买积分</strong>
            <span>适合按需调用模型，充值后按实际消耗扣减。</span>
          </button>
          <button
            type="button"
            class="purchase-choice-card"
            :class="{ 'purchase-choice-card-active': activeTab === 'subscription' }"
            @click="switchTab('subscription')"
          >
            <span class="purchase-choice-kicker">Subscription</span>
            <strong>套餐权益</strong>
            <span>适合稳定使用，按套餐获得周期额度与费率权益。</span>
          </button>
        </section>

        <section v-if="activeTab === 'points'" class="purchase-layout">
          <div class="purchase-main-stack">
            <div v-if="enabledMethods.length === 0" class="card purchase-empty-state">
              <Icon name="creditCard" size="xl" />
              <h3>积分购买暂未开放</h3>
              <p>当前没有可用的支付方式，请稍后再试或联系管理员确认 Stripe 配置。</p>
            </div>

            <template v-else>
              <div class="card purchase-card">
                <div class="purchase-section-header">
                  <div>
                    <p class="purchase-section-kicker">Step 1</p>
                    <h3>选择积分金额</h3>
                  </div>
                  <div class="purchase-account-chip">
                    <span>当前可用积分</span>
                    <strong class="money-value">{{ currentPoints }}</strong>
                  </div>
                </div>

                <AmountInput
                  v-model="amount"
                  unit-label="RMB"
                  :amounts="[10, 20, 50, 100, 200, 500, 1000, 2000, 5000]"
                  :min="globalMinAmount"
                  :max="globalMaxAmount"
                />
                <p v-if="amountError" class="purchase-error-text">{{ amountError }}</p>
              </div>

              <div class="card purchase-card">
                <div class="purchase-section-header">
                  <div>
                    <p class="purchase-section-kicker">Step 2</p>
                    <h3>确认支付方式</h3>
                  </div>
                  <span class="purchase-method-note">目前仅保留 Stripe</span>
                </div>
                <PaymentMethodSelector
                  :methods="methodOptions"
                  :selected="selectedMethod"
                  @select="selectedMethod = $event"
                />
              </div>
            </template>
          </div>

          <aside class="card purchase-card purchase-summary-card">
            <div>
              <p class="purchase-section-kicker">Summary</p>
              <h3>积分订单确认</h3>
              <p>提交后会创建 Stripe 支付订单。支付完成后，积分到账以后台订单结果为准。</p>
            </div>

            <div class="purchase-summary-list">
              <div>
                <span>购买金额</span>
                <strong>¥{{ validAmount.toFixed(2) }}</strong>
              </div>
              <div v-if="feeRate > 0">
                <span>手续费 {{ feeRate }}%</span>
                <strong>¥{{ feeAmount.toFixed(2) }}</strong>
              </div>
              <div>
                <span>实付金额</span>
                <strong class="money-value">¥{{ totalAmount.toFixed(2) }}</strong>
              </div>
              <div v-if="balanceRechargeMultiplier !== 1">
                <span>预计到账</span>
                <strong>{{ creditedAmount.toFixed(2) }} 积分</strong>
              </div>
            </div>

            <p class="purchase-rate-note">积分说明：1 RMB = {{ balanceRechargeMultiplier.toFixed(2) }} 积分，最低 10 RMB 起。</p>

            <button
              class="btn btn-primary w-full"
              :disabled="!canSubmitPoints || submitting"
              @click="handleSubmitPoints"
            >
              <span v-if="submitting">正在创建订单...</span>
              <span v-else>确认支付 ¥{{ totalAmount.toFixed(2) }}</span>
            </button>
          </aside>
        </section>

        <section v-else class="purchase-main-stack">
          <template v-if="selectedPlan">
            <div class="card purchase-card">
              <div class="purchase-section-header">
                <div>
                  <p class="purchase-section-kicker">Selected Plan</p>
                  <h3>{{ selectedPlan.name }}</h3>
                </div>
                <span class="purchase-platform-badge">
                  {{ platformLabel(selectedPlan.group_platform || '') }}
                </span>
              </div>

              <div class="purchase-plan-confirm">
                <div>
                  <span>套餐价格</span>
                  <strong class="money-value">¥{{ selectedPlan.price }}</strong>
                  <small>/ {{ planValiditySuffix }}</small>
                </div>
                <div>
                  <span>费率</span>
                  <strong>{{ selectedPlan.rate_multiplier ?? 1 }}x</strong>
                </div>
                <div v-if="selectedPlan.daily_limit_usd != null">
                  <span>日额度</span>
                  <strong>{{ selectedPlan.daily_limit_usd }} 积分</strong>
                </div>
                <div v-if="selectedPlan.weekly_limit_usd != null">
                  <span>周额度</span>
                  <strong>{{ selectedPlan.weekly_limit_usd }} 积分</strong>
                </div>
                <div v-if="selectedPlan.monthly_limit_usd != null">
                  <span>月额度</span>
                  <strong>{{ selectedPlan.monthly_limit_usd }} 积分</strong>
                </div>
              </div>

              <p v-if="selectedPlan.description" class="purchase-plan-description">
                {{ selectedPlan.description }}
              </p>
            </div>

            <div class="card purchase-card">
              <div class="purchase-section-header">
                <div>
                  <p class="purchase-section-kicker">Payment</p>
                  <h3>支付方式</h3>
                </div>
                <span class="purchase-method-note">目前仅保留 Stripe</span>
              </div>
              <PaymentMethodSelector
                :methods="subscriptionMethodOptions"
                :selected="selectedMethod"
                @select="selectedMethod = $event"
              />
            </div>

            <div class="purchase-action-row">
              <button class="btn btn-secondary" @click="selectedPlan = null">重新选择套餐</button>
              <button
                class="btn btn-primary"
                :disabled="!canSubmitSubscription || submitting"
                @click="confirmSubscribe"
              >
                <span v-if="submitting">正在创建订单...</span>
                <span v-else>确认支付 ¥{{ subscriptionPayAmount.toFixed(2) }}</span>
              </button>
            </div>
          </template>

          <template v-else>
            <div v-if="checkout.plans.length === 0" class="card purchase-empty-state">
              <Icon name="gift" size="xl" />
              <h3>暂无可购买套餐</h3>
              <p>当前没有开放的套餐权益。你仍可以购买积分，按实际调用消耗使用。</p>
            </div>

            <div v-else :class="planGridClass">
              <SubscriptionPlanCard
                v-for="plan in checkout.plans"
                :key="plan.id"
                :plan="plan"
                :active-subscriptions="activeSubscriptions"
                @select="selectPlan"
              />
            </div>

            <div v-if="activeSubscriptions.length > 0" class="card purchase-card">
              <div class="purchase-section-header">
                <div>
                  <p class="purchase-section-kicker">Active</p>
                  <h3>当前套餐</h3>
                </div>
              </div>
              <div class="purchase-active-list">
                <div v-for="sub in activeSubscriptions" :key="sub.id" class="purchase-active-item">
                  <div>
                    <strong>{{ sub.group?.name || `权限组 #${sub.group_id}` }}</strong>
                    <span>{{ platformLabel(sub.group?.platform || '') }}</span>
                  </div>
                  <span class="badge badge-success">生效中</span>
                </div>
              </div>
            </div>
          </template>
        </section>

        <div v-if="checkout.help_text || checkout.help_image_url" class="card purchase-card">
          <div class="purchase-help-content">
            <img
              v-if="checkout.help_image_url"
              :src="checkout.help_image_url"
              alt=""
              @click="previewImage = checkout.help_image_url"
            />
            <p v-if="checkout.help_text">{{ checkout.help_text }}</p>
          </div>
        </div>
      </template>
    </div>

    <Teleport to="body">
      <Transition name="modal">
        <div v-if="previewImage" class="payment-preview-shell" @click="previewImage = ''">
          <img :src="previewImage" alt="" />
        </div>
      </Transition>
    </Teleport>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usePaymentStore } from '@/stores/payment'
import { useSubscriptionStore } from '@/stores/subscriptions'
import { useAppStore } from '@/stores'
import { paymentAPI } from '@/api/payment'
import { extractApiErrorMessage } from '@/utils/apiError'
import { isMobileDevice } from '@/utils/device'
import type { CheckoutInfoResponse, CreateOrderResult, MethodLimit, OrderType, SubscriptionPlan } from '@/types/payment'
import AppLayout from '@/components/layout/AppLayout.vue'
import PageIntro from '@/components/common/PageIntro.vue'
import AmountInput from '@/components/payment/AmountInput.vue'
import PaymentMethodSelector from '@/components/payment/PaymentMethodSelector.vue'
import SubscriptionPlanCard from '@/components/payment/SubscriptionPlanCard.vue'
import PaymentStatusPanel from '@/components/payment/PaymentStatusPanel.vue'
import Icon from '@/components/icons/Icon.vue'
import type { PaymentMethodOption } from '@/components/payment/PaymentMethodSelector.vue'
import { getPaymentPopupFeatures } from '@/components/payment/providerConfig'
import {
  PAYMENT_RECOVERY_STORAGE_KEY,
  buildCreateOrderPayload,
  clearPaymentRecoverySnapshot,
  decidePaymentLaunch,
  getVisibleMethods,
  normalizeVisibleMethod,
  writePaymentRecoverySnapshot,
  type PaymentRecoverySnapshot,
} from '@/components/payment/paymentFlow'
import { platformLabel } from '@/utils/platformColors'

type PurchaseTab = 'points' | 'subscription'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const paymentStore = usePaymentStore()
const subscriptionStore = useSubscriptionStore()
const appStore = useAppStore()

const user = computed(() => authStore.user)
const activeSubscriptions = computed(() => subscriptionStore.activeSubscriptions)

const loading = ref(true)
const submitting = ref(false)
const activeTab = ref<PurchaseTab>('points')
const amount = ref<number | null>(100)
const selectedMethod = ref('stripe')
const selectedPlan = ref<SubscriptionPlan | null>(null)
const previewImage = ref('')
const paymentPhase = ref<'select' | 'paying'>('select')

const checkout = ref<CheckoutInfoResponse>({
  methods: {},
  global_min: 0,
  global_max: 0,
  plans: [],
  balance_disabled: false,
  balance_recharge_multiplier: 10,
  points_per_rmb: 10,
  recharge_fee_rate: 0,
  help_text: '',
  help_image_url: '',
  stripe_publishable_key: '',
})

function emptyPaymentState(): PaymentRecoverySnapshot {
  return {
    orderId: 0,
    amount: 0,
    qrCode: '',
    expiresAt: '',
    paymentType: '',
    payUrl: '',
    outTradeNo: '',
    clientSecret: '',
    payAmount: 0,
    orderType: '',
    paymentMode: '',
    resumeToken: '',
    createdAt: 0,
  }
}

const paymentState = ref<PaymentRecoverySnapshot>(emptyPaymentState())

const visibleMethods = computed<Record<string, MethodLimit>>(() => {
  const methods = getVisibleMethods(checkout.value.methods)
  const stripeMethods: Record<string, MethodLimit> = {}
  if (methods.stripe) stripeMethods.stripe = methods.stripe
  return stripeMethods
})

const enabledMethods = computed(() => Object.keys(visibleMethods.value))
const validAmount = computed(() => amount.value ?? 0)
const currentPoints = computed(() => Number(user.value?.balance ?? 0).toFixed(2))
const balanceRechargeMultiplier = computed(() => {
  const multiplier = checkout.value.points_per_rmb || checkout.value.balance_recharge_multiplier
  return multiplier > 0 ? multiplier : 10
})
const creditedAmount = computed(() =>
  Math.round((validAmount.value * balanceRechargeMultiplier.value) * 100) / 100
)
const feeRate = computed(() => checkout.value.recharge_fee_rate ?? 0)
const feeAmount = computed(() =>
  feeRate.value > 0 && validAmount.value > 0
    ? Math.ceil(((validAmount.value * feeRate.value) / 100) * 100) / 100
    : 0
)
const totalAmount = computed(() =>
  feeRate.value > 0 && validAmount.value > 0
    ? Math.round((validAmount.value + feeAmount.value) * 100) / 100
    : validAmount.value
)

const globalMinAmount = computed(() => {
  const limits = Object.values(visibleMethods.value)
  if (!limits.length) return 10
  if (limits.some(limit => limit.single_min <= 0)) return 10
  return Math.max(10, Math.min(...limits.map(limit => limit.single_min)))
})

const globalMaxAmount = computed(() => {
  const limits = Object.values(visibleMethods.value)
  if (!limits.length) return 0
  if (limits.some(limit => limit.single_max <= 0)) return 0
  return Math.max(...limits.map(limit => limit.single_max))
})

function amountFitsMethod(nextAmount: number, methodType: string): boolean {
  if (nextAmount <= 0) return true
  const limit = visibleMethods.value[methodType]
  if (!limit) return false
  if (limit.single_min > 0 && nextAmount < limit.single_min) return false
  if (limit.single_max > 0 && nextAmount > limit.single_max) return false
  return true
}

function paymentErrorMessage(err: unknown, fallback: string): string {
  const record = (typeof err === 'object' && err !== null ? err : {}) as {
    status?: number
    message?: string
  }
  const rawMessage = record.message || ''
  if ((typeof record.status === 'number' && record.status >= 500) || rawMessage.includes('status code')) {
    return fallback
  }
  return extractApiErrorMessage(err, fallback)
}

const selectedLimit = computed(() => visibleMethods.value[selectedMethod.value])

const methodOptions = computed<PaymentMethodOption[]>(() =>
  enabledMethods.value.map((type) => {
    const limit = visibleMethods.value[type]
    return {
      type,
      fee_rate: limit?.fee_rate ?? 0,
      available: limit?.available !== false && amountFitsMethod(validAmount.value, type),
    }
  })
)

const subscriptionMethodOptions = computed<PaymentMethodOption[]>(() => {
  const planPrice = selectedPlan.value?.price ?? 0
  return enabledMethods.value.map((type) => {
    const limit = visibleMethods.value[type]
    return {
      type,
      fee_rate: limit?.fee_rate ?? 0,
      available: limit?.available !== false && amountFitsMethod(planPrice, type),
    }
  })
})

const amountError = computed(() => {
  if (validAmount.value <= 0) return ''
  if (!enabledMethods.value.some((method) => amountFitsMethod(validAmount.value, method))) {
    return '当前金额不在 Stripe 支付范围内，请调整金额。'
  }
  const limit = selectedLimit.value
  if (limit?.single_min && validAmount.value < limit.single_min) return `最低购买 ${limit.single_min} RMB`
  if (limit?.single_max && validAmount.value > limit.single_max) return `最高购买 ${limit.single_max} RMB`
  return ''
})

const canSubmitPoints = computed(() =>
  validAmount.value >= globalMinAmount.value
  && amountFitsMethod(validAmount.value, selectedMethod.value)
  && selectedLimit.value?.available !== false
)

const subscriptionPayAmount = computed(() => {
  const price = selectedPlan.value?.price ?? 0
  if (feeRate.value <= 0 || price <= 0) return price
  return Math.round((price + Math.ceil(((price * feeRate.value) / 100) * 100) / 100) * 100) / 100
})

const canSubmitSubscription = computed(() =>
  !!selectedPlan.value
  && amountFitsMethod(selectedPlan.value.price, selectedMethod.value)
  && selectedLimit.value?.available !== false
)

const planGridClass = computed(() => {
  const count = checkout.value.plans.length
  if (count <= 2) return 'grid grid-cols-1 gap-5 sm:grid-cols-2'
  return 'grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'
})

const planValiditySuffix = computed(() => {
  if (!selectedPlan.value) return ''
  const unit = selectedPlan.value.validity_unit || 'day'
  if (unit === 'month') return '月'
  if (unit === 'year') return '年'
  return `${selectedPlan.value.validity_days} 天`
})

watch(() => [validAmount.value, selectedMethod.value] as const, ([nextAmount, method]) => {
  if (nextAmount <= 0 || amountFitsMethod(nextAmount, method)) return
  const available = enabledMethods.value.find((item) => amountFitsMethod(nextAmount, item))
  if (available) selectedMethod.value = available
})

function switchTab(tab: PurchaseTab) {
  activeTab.value = tab
  selectedPlan.value = null
}

function selectPlan(plan: SubscriptionPlan) {
  selectedPlan.value = plan
}

function persistRecoverySnapshot(snapshot: PaymentRecoverySnapshot) {
  if (typeof window === 'undefined' || !snapshot.orderId) return
  writePaymentRecoverySnapshot(window.localStorage, snapshot, PAYMENT_RECOVERY_STORAGE_KEY)
}

function removeRecoverySnapshot() {
  if (typeof window === 'undefined') return
  clearPaymentRecoverySnapshot(window.localStorage, PAYMENT_RECOVERY_STORAGE_KEY)
}

function resetPayment() {
  paymentPhase.value = 'select'
  paymentState.value = emptyPaymentState()
  removeRecoverySnapshot()
}

function onPaymentDone() {
  const wasSubscription = paymentState.value.orderType === 'subscription'
  resetPayment()
  selectedPlan.value = null
  if (wasSubscription) {
    subscriptionStore.fetchActiveSubscriptions(true).catch(() => {})
  }
}

function onPaymentSuccess() {
  removeRecoverySnapshot()
  authStore.refreshUser()
  if (paymentState.value.orderType === 'subscription') {
    subscriptionStore.fetchActiveSubscriptions(true).catch(() => {})
  }
}

function onPaymentSettled() {
  removeRecoverySnapshot()
}

async function handleSubmitPoints() {
  if (!canSubmitPoints.value || submitting.value) return
  await createOrder(validAmount.value, 'points')
}

async function confirmSubscribe() {
  if (!selectedPlan.value || submitting.value) return
  await createOrder(selectedPlan.value.price, 'subscription', selectedPlan.value.id)
}

async function createOrder(orderAmount: number, orderType: OrderType, planId?: number) {
  submitting.value = true
  try {
    const visibleMethod = normalizeVisibleMethod(selectedMethod.value) || selectedMethod.value
    const payload = buildCreateOrderPayload({
      amount: orderAmount,
      paymentType: visibleMethod,
      orderType,
      planId,
      origin: typeof window !== 'undefined' ? window.location.origin : '',
      isMobile: isMobileDevice(),
      isWechatBrowser: typeof window !== 'undefined' && /MicroMessenger/i.test(window.navigator.userAgent),
    })
    const result = await paymentStore.createOrder(payload) as CreateOrderResult & { resume_token?: string }
    const stripeRouteUrl = result.client_secret
      ? router.resolve({
        path: '/payment/stripe',
        query: {
          order_id: String(result.order_id),
          client_secret: result.client_secret,
          resume_token: result.resume_token || undefined,
        },
      }).href
      : ''
    const decision = decidePaymentLaunch(result, {
      visibleMethod,
      orderType,
      isMobile: isMobileDevice(),
      isWechatBrowser: typeof window !== 'undefined' && /MicroMessenger/i.test(window.navigator.userAgent),
      stripePopupUrl: stripeRouteUrl,
      stripeRouteUrl,
    })

    if (decision.kind === 'unhandled') {
      appStore.showError('支付订单已创建，但当前支付配置无法展示。请联系管理员检查 Stripe 配置。')
      return
    }

    paymentState.value = decision.paymentState
    persistRecoverySnapshot(decision.recovery)

    if (decision.kind === 'stripe_route') {
      window.location.href = decision.paymentState.payUrl
      return
    }
    if (decision.kind === 'stripe_popup') {
      const win = window.open(decision.paymentState.payUrl, 'paymentPopup', getPaymentPopupFeatures())
      if (!win || win.closed) window.location.href = decision.paymentState.payUrl
      return
    }
    if (decision.kind === 'redirect_waiting' && decision.paymentState.payUrl) {
      window.location.href = decision.paymentState.payUrl
      return
    }

    paymentPhase.value = 'paying'
  } catch (err: unknown) {
    appStore.showError(paymentErrorMessage(err, '创建支付订单失败，请稍后重试，或联系管理员确认 Stripe 配置。'))
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  try {
    const response = await paymentAPI.getCheckoutInfo()
    checkout.value = response.data
    if (checkout.value.balance_disabled) activeTab.value = 'subscription'
    if (route.query.tab === 'subscription') activeTab.value = 'subscription'
    if (enabledMethods.value.length) selectedMethod.value = enabledMethods.value[0]
    await subscriptionStore.fetchActiveSubscriptions()
  } catch (err: unknown) {
    appStore.showError(paymentErrorMessage(err, '支付配置暂不可用，请稍后再试，或联系管理员确认 Stripe 配置。'))
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.purchase-loading,
.purchase-empty-state {
  display: grid;
  min-height: 260px;
  place-items: center;
  gap: 12px;
  padding: 32px;
  text-align: center;
}

.purchase-loading p,
.purchase-empty-state p {
  color: var(--text-secondary);
}

.purchase-spinner {
  width: 34px;
  height: 34px;
  border: 3px solid var(--border-default);
  border-top-color: var(--accent);
  border-radius: 999px;
  animation: purchase-spin 0.8s linear infinite;
}

.purchase-choice-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.purchase-choice-card {
  display: grid;
  gap: 8px;
  min-height: 128px;
  padding: 22px;
  text-align: left;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  background: var(--bg-surface);
  color: var(--text-primary);
}

.purchase-choice-card:hover,
.purchase-choice-card-active {
  border-color: var(--accent);
  background: var(--bg-surface);
}

.purchase-choice-card strong {
  font-size: 20px;
  line-height: 1.3;
}

.purchase-choice-card span:last-child {
  color: var(--text-secondary);
  line-height: 1.65;
}

.purchase-choice-kicker,
.purchase-section-kicker {
  color: var(--accent);
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.purchase-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 18px;
  align-items: start;
}

.purchase-main-stack {
  display: grid;
  gap: 18px;
}

.purchase-card {
  padding: 24px;
}

.purchase-section-header {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: flex-start;
  margin-bottom: 20px;
}

.purchase-section-header h3,
.purchase-summary-card h3 {
  margin: 4px 0 0;
  color: var(--text-primary);
  font-size: 20px;
  font-weight: 700;
  line-height: 1.35;
}

.purchase-account-chip,
.purchase-method-note,
.purchase-platform-badge {
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  background: var(--bg-surface-alt);
  padding: 9px 12px;
  color: var(--text-secondary);
  font-size: 12px;
}

.purchase-account-chip {
  display: grid;
  gap: 4px;
  min-width: 150px;
  text-align: right;
}

.purchase-account-chip strong {
  font-size: 18px;
}

.purchase-error-text {
  margin-top: 10px;
  color: var(--status-warning);
  font-size: 13px;
}

.purchase-summary-card {
  position: sticky;
  top: 88px;
  display: grid;
  gap: 20px;
}

.purchase-summary-card p {
  margin-top: 8px;
  color: var(--text-secondary);
  line-height: 1.65;
}

.purchase-summary-list {
  display: grid;
  gap: 12px;
  padding: 16px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  background: var(--bg-surface-alt);
}

.purchase-summary-list div {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  color: var(--text-secondary);
  font-size: 14px;
}

.purchase-summary-list strong {
  color: var(--text-primary);
  font-weight: 700;
}

.purchase-rate-note {
  border-top: 1px solid var(--border-default);
  padding-top: 14px;
  color: var(--text-secondary);
  font-size: 13px;
}

.purchase-plan-confirm {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.purchase-plan-confirm div {
  display: grid;
  gap: 6px;
  min-height: 86px;
  padding: 14px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  background: var(--bg-surface-alt);
}

.purchase-plan-confirm span,
.purchase-plan-confirm small {
  color: var(--text-secondary);
  font-size: 12px;
}

.purchase-plan-confirm strong {
  color: var(--text-primary);
  font-size: 17px;
  line-height: 1.35;
}

.purchase-plan-description {
  margin-top: 18px;
  color: var(--text-secondary);
  line-height: 1.65;
}

.purchase-action-row {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.purchase-active-list {
  display: grid;
  gap: 10px;
}

.purchase-active-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  background: var(--bg-surface-alt);
}

.purchase-active-item div {
  display: grid;
  gap: 4px;
}

.purchase-active-item span:not(.badge) {
  color: var(--text-secondary);
  font-size: 12px;
}

.purchase-help-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18px;
  color: var(--text-secondary);
  text-align: center;
}

.purchase-help-content img {
  max-height: 160px;
  max-width: 240px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  cursor: pointer;
  object-fit: contain;
}

.payment-preview-shell {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: var(--backdrop-bg);
}

.payment-preview-shell img {
  max-width: 90vw;
  max-height: 86vh;
  border-radius: var(--radius-lg);
  object-fit: contain;
}

@keyframes purchase-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 960px) {
  .purchase-layout {
    grid-template-columns: 1fr;
  }

  .purchase-summary-card {
    position: static;
  }
}

@media (max-width: 640px) {
  .purchase-choice-grid,
  .purchase-plan-confirm {
    grid-template-columns: 1fr;
  }

  .purchase-section-header,
  .purchase-action-row,
  .purchase-help-content {
    flex-direction: column;
    align-items: stretch;
  }

  .purchase-account-chip {
    text-align: left;
  }
}
</style>
