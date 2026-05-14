<template>
  <AppLayout>
    <div class="mx-auto grid max-w-3xl gap-6">
      <PageIntro
        title="支付跳转"
        description="系统正在跳转到统一的积分购买与订阅套餐页面，请在新页面完成支付或查看可选套餐。"
      />
      <section class="card payment-redirect-card">
        <p class="payment-redirect-kicker">Payment</p>
        <h1>正在打开支付页面</h1>
        <p>系统已统一到新的积分购买与订阅套餐页面，正在为你跳转。</p>
        <RouterLink class="btn btn-primary" :to="purchaseTarget">前往支付页面</RouterLink>
      </section>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import PageIntro from '@/components/common/PageIntro.vue'

const route = useRoute()
const router = useRouter()

const purchaseTarget = computed(() => ({
  path: '/purchase',
  query: route.query,
}))

onMounted(() => {
  router.replace(purchaseTarget.value).catch(() => {})
})
</script>

<style scoped>
.payment-redirect-card {
  display: grid;
  gap: 14px;
  padding: 28px;
}

.payment-redirect-kicker {
  margin: 0;
  color: var(--accent);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.payment-redirect-card h1 {
  margin: 0;
  color: var(--text-primary);
  font-family: var(--font-serif);
  font-size: 28px;
  font-weight: 800;
}

.payment-redirect-card p {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.7;
}

.payment-redirect-card .btn {
  justify-self: start;
}
</style>
