<template>
  <div class="internal-docs-page space-y-6">
    <PageIntro
      title="使用文档"
      description="按顺序完成额度、密钥、模型和工具配置。多数接入与排查问题，都可以在本页找到处理方法。"
      eyebrow="OwnAPI Docs"
    >
      <template #actions>
        <router-link :to="workspacePath" class="btn-secondary docs-action">返回工作台</router-link>
        <router-link to="/keys" class="btn-primary docs-action">创建 API Key</router-link>
        <router-link to="/purchase" class="btn-secondary docs-action">获取积分</router-link>
      </template>
    </PageIntro>

    <section class="card docs-section">
      <div class="docs-section-header">
        <p class="docs-kicker">Recommended Flow</p>
        <h2>推荐使用顺序</h2>
        <p>
          注册或登录 OwnAPI → 获取可用额度 → 创建 API Key → 选择可用模型 → 配置工具 →
          发起测试请求 → 查看使用记录。
        </p>
      </div>
      <div class="docs-flow">
        <div v-for="(step, index) in flowSteps" :key="step.title" class="docs-flow-step">
          <span>{{ index + 1 }}</span>
          <strong>{{ step.title }}</strong>
          <p>{{ step.description }}</p>
        </div>
      </div>
    </section>

    <section class="docs-grid">
      <router-link
        v-for="entry in coreEntries"
        :key="entry.path"
        :to="entry.path"
        class="card docs-entry"
      >
        <span class="docs-entry-label">{{ entry.label }}</span>
        <strong>{{ entry.title }}</strong>
        <p>{{ entry.description }}</p>
      </router-link>
    </section>

    <section class="card docs-section">
      <div class="docs-section-header">
        <p class="docs-kicker">API Setup</p>
        <h2>OpenAI 兼容接入</h2>
        <p>
          支持 OpenAI 兼容协议的客户端，通常只需要填写 Base URL、API Key 和模型名称。
          API Key 请在“API 密钥”页面创建，不要在公开代码仓库中保存真实密钥。
        </p>
      </div>

      <div class="docs-config-grid">
        <div class="docs-config-card">
          <span>Base URL</span>
          <code>https://ownapi.dev/v1</code>
        </div>
        <div class="docs-config-card">
          <span>API Key</span>
          <code>YOUR_OWNAPI_API_KEY</code>
        </div>
        <div class="docs-config-card">
          <span>模型示例</span>
          <code>gpt-5.5 / gpt-5.4 / claude-4.7 / claude-4.6</code>
        </div>
      </div>

      <pre class="docs-code"><code>curl https://ownapi.dev/v1/chat/completions \
  -H "Authorization: Bearer YOUR_OWNAPI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-5.5",
    "messages": [
      { "role": "user", "content": "测试 OwnAPI 是否可用" }
    ]
  }'</code></pre>
    </section>

    <section class="card docs-section">
      <div class="docs-section-header">
        <p class="docs-kicker">Tools</p>
        <h2>常用工具配置</h2>
        <p>
          Cursor、VS Code 插件、OpenAI SDK、脚本工具等，只要支持 OpenAI 兼容接口，
          都可以按同一组配置接入。
        </p>
      </div>

      <div class="docs-tool-list">
        <div class="docs-tool-item">
          <strong>OpenAI SDK</strong>
          <p>把 baseURL 指向 <code>https://ownapi.dev/v1</code>，apiKey 使用 OwnAPI 密钥。</p>
        </div>
        <div class="docs-tool-item">
          <strong>Cursor / VS Code 插件</strong>
          <p>在插件的 OpenAI 兼容配置里填写 Base URL、API Key，并选择可用模型。</p>
        </div>
        <div class="docs-tool-item">
          <strong>命令行环境变量</strong>
          <p>如工具读取环境变量，可设置 <code>OPENAI_API_KEY</code> 与 <code>OPENAI_BASE_URL</code>。</p>
        </div>
      </div>
    </section>

    <section class="card docs-section">
      <div class="docs-section-header">
        <p class="docs-kicker">Troubleshooting</p>
        <h2>常见问题排查</h2>
        <p>先确认密钥、积分、模型状态，再检查工具侧的 Base URL 与模型名称。</p>
      </div>

      <div class="docs-faq-list">
        <div v-for="item in faqs" :key="item.title" class="docs-faq-item">
          <strong>{{ item.title }}</strong>
          <p>{{ item.description }}</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import PageIntro from '@/components/common/PageIntro.vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const workspacePath = computed(() => (authStore.isAdmin ? '/admin/dashboard' : '/dashboard'))

const flowSteps = [
  { title: '获取积分', description: '通过购买积分、套餐权益或兑换码获得可用积分。' },
  { title: '创建密钥', description: '在 API 密钥页创建调用凭证，并按需要选择权限组。' },
  { title: '选择模型', description: '在模型中心确认当前可用模型和推荐版本。' },
  { title: '配置工具', description: '把 Base URL、API Key 和模型名填入客户端。' },
  { title: '查看记录', description: '调用后在使用记录页检查 Token、费用和响应状态。' },
]

const coreEntries = [
  { path: '/purchase', label: 'Points', title: '购买积分与套餐', description: '购买积分、查看套餐，并确认当前可用积分。' },
  { path: '/keys', label: 'Credential', title: 'API 密钥', description: '创建、复制和管理调用密钥，查看权限组与使用状态。' },
  { path: '/models', label: 'Models', title: '模型中心', description: '查看主推模型、生态模型和可用模型版本。' },
  { path: '/usage', label: 'Usage', title: '使用记录', description: '排查请求、Token 消耗、费用和响应耗时。' },
  { path: '/monitor', label: 'Status', title: '模型状态', description: '确认模型是否可用，避免工具侧误判。' },
  { path: '/affiliate', label: 'Affiliate', title: '邀请返利', description: '查看专属邀请码、邀请记录和返利额度。' },
]

const faqs = [
  { title: '401 或认证失败', description: '检查 API Key 是否复制完整，Authorization 是否使用 Bearer 格式。' },
  { title: '模型不可用', description: '到模型中心和模型状态页确认模型名称、可用状态和当前权限组。' },
  { title: '积分不足', description: '到购买积分页获取积分，或使用兑换码补充额度。' },
  { title: '请求超时', description: '先查看模型状态，再降低并发或稍后重试。' },
  { title: '费用异常', description: '在使用记录页按 API Key、模型和时间范围核对消耗。' },
]
</script>

<style scoped>
.internal-docs-page {
  max-width: 1180px;
  margin: 0 auto;
}

.docs-action {
  min-height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding-inline: var(--space-4);
  white-space: nowrap;
}

.docs-section {
  padding: var(--space-6);
}

.docs-section-header {
  display: grid;
  gap: var(--space-2);
  margin-bottom: var(--space-6);
}

.docs-section-header h2 {
  margin: 0;
  color: var(--text-primary);
  font-size: var(--text-title);
  font-weight: 800;
}

.docs-section-header p {
  margin: 0;
  max-width: 820px;
  color: var(--text-secondary);
  line-height: 1.75;
}

.docs-kicker,
.docs-entry-label {
  margin: 0;
  color: var(--accent);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.docs-flow,
.docs-grid,
.docs-config-grid {
  display: grid;
  gap: var(--space-3);
}

.docs-flow {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.docs-flow-step,
.docs-config-card,
.docs-tool-item,
.docs-faq-item {
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  background: var(--bg-surface-alt);
  padding: var(--space-4);
}

.docs-flow-step {
  display: grid;
  gap: var(--space-2);
}

.docs-flow-step span {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  background: var(--accent);
  color: var(--accent-contrast);
  font-family: var(--font-mono);
  font-weight: 800;
}

.docs-flow-step strong,
.docs-entry strong,
.docs-tool-item strong,
.docs-faq-item strong {
  color: var(--text-primary);
  font-weight: 800;
}

.docs-flow-step p,
.docs-entry p,
.docs-tool-item p,
.docs-faq-item p {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.7;
}

.docs-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.docs-entry {
  display: grid;
  gap: var(--space-3);
  padding: var(--space-5);
  text-decoration: none;
}

.docs-entry:hover {
  border-color: var(--border-strong);
  background: var(--bg-surface);
}

.docs-config-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-bottom: var(--space-5);
}

.docs-config-card {
  display: grid;
  gap: var(--space-2);
}

.docs-config-card span {
  color: var(--text-secondary);
  font-size: var(--text-sm);
  font-weight: 700;
}

.docs-config-card code,
.docs-tool-item code {
  color: var(--text-primary);
  font-family: var(--font-mono);
  word-break: break-word;
}

.docs-code {
  margin: 0;
  overflow-x: auto;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  background: var(--bg-subtle);
  color: var(--text-primary);
  padding: var(--space-5);
  line-height: 1.7;
}

.docs-code code {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
}

.docs-tool-list,
.docs-faq-list {
  display: grid;
  gap: var(--space-4);
}

@media (max-width: 1180px) {
  .docs-flow,
  .docs-grid,
  .docs-config-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .docs-section {
    padding: var(--space-5);
  }

  .docs-flow,
  .docs-grid,
  .docs-config-grid {
    grid-template-columns: 1fr;
  }
}
</style>
