<template>
  <div class="agent-page">
    <header class="agent-header">
      <nav class="agent-nav">
        <router-link to="/home" class="agent-brand">
          <span class="agent-logo">
            <img :src="siteLogo" alt="OwnAPI" class="site-logo-img" />
          </span>
          <span>{{ siteName }}</span>
        </router-link>

        <div class="agent-nav-actions">
          <router-link to="/home" class="agent-nav-link">返回首页</router-link>
          <router-link :to="isAuthenticated ? dashboardPath : '/login'" class="agent-nav-primary">
            {{ isAuthenticated ? '进入控制台' : '登录查看' }}
          </router-link>
        </div>
      </nav>
    </header>

    <main class="agent-main">
      <section class="agent-hero">
        <p class="agent-kicker">OwnAPI Partner Program</p>
        <h1>中转站代理招募</h1>
        <p class="agent-lead">
          AI 时代，Token 需求量正在快速增长。OwnAPI 面向长期合作伙伴开放代理计划，
          让愿意推广 AI 工具和中转服务的人，可以把真实需求变成稳定副业。
        </p>

        <div class="agent-commission-card">
          <span>代理收益</span>
          <strong>最高 40%</strong>
          <p>推荐用户产生消费后，代理可获得对应用户消费抽成。实际结算以平台后台记录为准。</p>
        </div>
      </section>

      <section class="agent-section">
        <div class="agent-section-heading">
          <h2>为什么现在适合做 AI 中转站代理</h2>
          <p>不是短期热闹，而是 AI 工具进入日常工作后，Token 消耗会持续变成刚需。</p>
        </div>

        <div class="agent-card-grid">
          <article class="agent-card">
            <span class="agent-card-number">01</span>
            <h3>AI Token 需求量暴增</h3>
            <p>写作、代码、办公、自动化和企业内部工具都会消耗 Token，用户需要稳定、好用、价格透明的入口。</p>
          </article>

          <article class="agent-card">
            <span class="agent-card-number">02</span>
            <h3>适合作为 AI 时代副业</h3>
            <p>代理不需要自建模型服务，重点是把平台介绍给有真实使用需求的人，帮助他们完成接入和使用。</p>
          </article>

          <article class="agent-card">
            <span class="agent-card-number">03</span>
            <h3>良心长线生意</h3>
            <p>平台强调长期运营、模型不注水、价格透明。代理推广的是可以持续交付的服务，而不是一次性噱头。</p>
          </article>
        </div>
      </section>

      <section class="agent-section agent-split">
        <div class="agent-panel">
          <h2>代理能获得什么</h2>
          <div class="agent-benefit-list">
            <div>
              <strong>最高 40% 用户消费抽成</strong>
              <span>推荐用户产生有效消费后，代理可获得对应比例收益。</span>
            </div>
            <div>
              <strong>长期可复用的用户关系</strong>
              <span>用户持续使用 AI 模型和 Token，代理收益也更适合长期积累。</span>
            </div>
            <div>
              <strong>更容易讲清楚的产品价值</strong>
              <span>主流模型、价格实惠、稳定可用，适合向个人用户和小团队介绍。</span>
            </div>
          </div>
        </div>

        <div class="agent-panel agent-steps">
          <h2>合作流程</h2>
          <ol>
            <li>了解 OwnAPI 的模型、价格和使用教程。</li>
            <li>向有 AI 使用需求的用户介绍平台。</li>
            <li>用户注册、充值并开始消耗 Token。</li>
            <li>平台按后台记录统计代理抽成。</li>
          </ol>
        </div>
      </section>

      <section class="agent-cta">
        <h2>适合有 AI 用户资源的人先做起来</h2>
        <p>
          如果你身边有程序员、运营、设计师、跨境团队、内容团队或 AI 工具用户，
          代理计划可以作为一个轻量、长期的副业入口。
        </p>
        <div class="agent-cta-actions">
          <router-link :to="isAuthenticated ? dashboardPath : '/login'" class="agent-button-primary">
            {{ isAuthenticated ? '进入控制台' : '登录 OwnAPI' }}
          </router-link>
          <router-link to="/home" class="agent-button-secondary">返回首页</router-link>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore, useAppStore } from '@/stores'
import { DEFAULT_SITE_LOGO, DEFAULT_SITE_NAME, resolveSiteLogoPath } from '@/constants/branding'

const authStore = useAuthStore()
const appStore = useAppStore()

const siteName = computed(() => appStore.cachedPublicSettings?.site_name || appStore.siteName || DEFAULT_SITE_NAME)
const siteLogo = computed(() => resolveSiteLogoPath(appStore.cachedPublicSettings?.site_logo || appStore.siteLogo || DEFAULT_SITE_LOGO))
const isAuthenticated = computed(() => authStore.isAuthenticated)
const dashboardPath = computed(() => authStore.isAdmin ? '/admin/dashboard' : '/dashboard')
</script>

<style scoped>
.agent-page {
  min-height: 100vh;
  background: var(--bg-page);
  color: var(--text-primary);
}

.agent-header {
  position: sticky;
  top: 0;
  z-index: 20;
  border-bottom: 1px solid var(--border-default);
  background: var(--bg-surface);
}

.agent-nav {
  display: flex;
  width: min(100% - 32px, 1120px);
  height: 64px;
  margin: 0 auto;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.agent-brand,
.agent-nav-actions,
.agent-nav-link,
.agent-nav-primary,
.agent-button-primary,
.agent-button-secondary {
  display: inline-flex;
  align-items: center;
}

.agent-brand {
  min-width: 0;
  gap: 10px;
  color: var(--text-primary);
  font-weight: 800;
}

.agent-logo {
  display: inline-flex;
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
}

.agent-logo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.agent-nav-actions {
  gap: 10px;
}

.agent-nav-link,
.agent-nav-primary,
.agent-button-primary,
.agent-button-secondary {
  min-height: 38px;
  justify-content: center;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: 0 16px;
  font-size: 13px;
  font-weight: 800;
}

.agent-nav-link,
.agent-button-secondary {
  background: var(--bg-surface);
  color: var(--text-primary);
}

.agent-nav-primary,
.agent-button-primary {
  border-color: var(--accent);
  background: var(--accent);
  color: var(--text-inverse);
}

.agent-main {
  width: min(100% - 32px, 1120px);
  margin: 0 auto;
  padding: 46px 0 64px;
}

.agent-hero {
  display: grid;
  gap: 18px;
  max-width: 900px;
  margin: 0 auto 48px;
  text-align: center;
}

.agent-kicker,
.agent-card-number {
  color: var(--accent);
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.agent-hero h1,
.agent-section-heading h2,
.agent-panel h2,
.agent-cta h2 {
  margin: 0;
  color: var(--text-primary);
  font-family: var(--font-serif);
  font-weight: 800;
  letter-spacing: 0;
}

.agent-hero h1 {
  font-size: clamp(36px, 5vw, 58px);
  line-height: 1.05;
}

.agent-lead,
.agent-section-heading p,
.agent-card p,
.agent-benefit-list span,
.agent-steps li,
.agent-cta p,
.agent-commission-card p {
  color: var(--text-muted);
  line-height: 1.75;
}

.agent-lead {
  max-width: 800px;
  margin: 0 auto;
  font-size: 16px;
}

.agent-commission-card {
  display: grid;
  gap: 10px;
  width: min(100%, 600px);
  margin: 10px auto 0;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  background: var(--bg-surface);
  padding: 22px 26px;
}

.agent-commission-card span {
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 800;
}

.agent-commission-card strong {
  color: var(--accent);
  font-family: var(--font-serif);
  font-size: clamp(44px, 6vw, 68px);
  font-weight: 800;
  line-height: 0.95;
}

.agent-section {
  margin-top: 44px;
}

.agent-section-heading {
  max-width: 720px;
  margin: 0 auto 22px;
  text-align: center;
}

.agent-section-heading h2,
.agent-panel h2,
.agent-cta h2 {
  font-size: clamp(28px, 3.5vw, 42px);
  line-height: 1.12;
}

.agent-section-heading p,
.agent-cta p {
  margin: 12px 0 0;
  font-size: 15px;
}

.agent-card-grid,
.agent-split {
  display: grid;
  gap: 18px;
}

.agent-card-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.agent-card,
.agent-panel,
.agent-cta {
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  background: var(--bg-surface);
}

.agent-card {
  padding: 22px;
}

.agent-card h3 {
  margin: 14px 0 0;
  color: var(--text-primary);
  font-size: 18px;
  font-weight: 850;
}

.agent-card p {
  margin: 10px 0 0;
  font-size: 14px;
}

.agent-split {
  grid-template-columns: minmax(0, 1.08fr) minmax(0, 0.92fr);
}

.agent-panel {
  padding: 28px;
}

.agent-benefit-list {
  display: grid;
  gap: 14px;
  margin-top: 20px;
}

.agent-benefit-list div {
  display: grid;
  gap: 6px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  background: var(--bg-surface-alt);
  padding: 16px;
}

.agent-benefit-list strong {
  color: var(--text-primary);
  font-size: 15px;
}

.agent-benefit-list span {
  font-size: 14px;
}

.agent-steps ol {
  display: grid;
  gap: 12px;
  margin: 20px 0 0;
  padding-left: 20px;
}

.agent-steps li {
  padding-left: 4px;
  font-size: 14px;
}

.agent-cta {
  display: grid;
  gap: 16px;
  margin-top: 44px;
  padding: 32px;
  text-align: center;
}

.agent-cta p {
  max-width: 720px;
  margin-right: auto;
  margin-left: auto;
}

.agent-cta-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
}

.agent-button-primary,
.agent-button-secondary {
  min-height: 44px;
  padding: 0 22px;
  font-size: 14px;
}

@media (max-width: 860px) {
  .agent-main {
    padding-top: 42px;
  }

  .agent-card-grid,
  .agent-split {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .agent-nav {
    width: min(100% - 24px, 1120px);
  }

  .agent-nav-link {
    display: none;
  }

  .agent-main {
    width: min(100% - 24px, 1120px);
  }

  .agent-hero {
    margin-bottom: 40px;
  }
}
</style>
