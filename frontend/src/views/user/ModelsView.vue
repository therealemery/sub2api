<template>
  <AppLayout>
    <div class="models-page">
      <div class="models-intro-wrap">
        <PageIntro
          :eyebrow="modelCenterConfig.eyebrow"
          :title="modelCenterConfig.title"
          :description="modelCenterConfig.description"
        >
          <template #actions>
            <router-link to="/keys" class="models-primary-action">配置 API 密钥</router-link>
          </template>
        </PageIntro>
      </div>

      <section class="models-section" aria-labelledby="featured-models-title">
        <div class="models-section-heading">
          <div>
            <h3 id="featured-models-title">{{ modelCenterConfig.featuredTitle }}</h3>
            <p>{{ modelCenterConfig.featuredDescription }}</p>
          </div>
        </div>

        <div class="featured-model-grid">
          <article v-for="model in featuredModels" :key="model.id" class="featured-model-card">
            <div class="featured-model-logo">
              <img :src="model.logo" :alt="model.name" />
            </div>
            <div class="featured-model-content">
              <div class="featured-model-header">
                <h4>{{ model.name }}</h4>
                <span>{{ model.statusLabel }}</span>
              </div>
              <p>{{ model.description }}</p>
              <div v-if="model.versions.length" class="model-version-block">
                <span>当前模型</span>
                <div class="model-version-list">
                  <span v-for="version in model.versions" :key="`${model.id}-${version}`">
                    {{ version }}
                  </span>
                </div>
              </div>
              <ul>
                <li v-for="item in model.highlights" :key="item">{{ item }}</li>
              </ul>
              <router-link to="/keys" class="model-config-link">配置密钥</router-link>
            </div>
          </article>
        </div>
      </section>

      <section class="models-section" aria-labelledby="ecosystem-models-title">
        <div class="models-section-heading">
          <div>
            <h3 id="ecosystem-models-title">{{ modelCenterConfig.ecosystemTitle }}</h3>
            <p>{{ modelCenterConfig.ecosystemDescription }}</p>
          </div>
        </div>

        <div class="ecosystem-grid">
          <article v-for="model in ecosystemModels" :key="model.id" class="ecosystem-card">
            <div class="ecosystem-logo">
              <img :src="model.logo" :alt="model.name" />
            </div>
            <div class="ecosystem-body">
              <div class="ecosystem-title-row">
                <h4>{{ model.name }}</h4>
                <span>{{ model.statusLabel }}</span>
              </div>
              <p>{{ model.description }}</p>
              <div v-if="model.versions.length" class="ecosystem-version-list">
                <span v-for="version in model.versions" :key="`${model.id}-${version}`">
                  {{ version }}
                </span>
              </div>
              <router-link to="/keys" class="ecosystem-action">配置</router-link>
            </div>
          </article>
        </div>
      </section>

      <section class="models-guide">
        <div>
          <h3>{{ modelCenterConfig.guideTitle }}</h3>
          <p>{{ modelCenterConfig.guideDescription }}</p>
        </div>
        <router-link to="/keys" class="models-secondary-action">去配置密钥</router-link>
      </section>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import PageIntro from '@/components/common/PageIntro.vue'
import { normalizeModelCenterConfig } from '@/constants/modelCenter'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()

const modelCenterConfig = computed(() =>
  normalizeModelCenterConfig(appStore.cachedPublicSettings?.model_center_config)
)

const visibleModels = computed(() =>
  modelCenterConfig.value.models.filter((model) => model.visible)
)

const featuredModels = computed(() =>
  visibleModels.value.filter((model) => model.status === 'featured')
)

const ecosystemModels = computed(() =>
  visibleModels.value.filter((model) => model.status !== 'featured')
)
</script>

<style scoped>
.models-page {
  display: grid;
  gap: 28px;
  width: 100%;
  max-width: 1180px;
  margin: 0 auto;
}

.models-intro-wrap :deep(.page-intro) {
  padding: 30px 32px;
}

.models-intro-wrap :deep(.page-intro-main) {
  max-width: 780px;
}

.models-intro-wrap :deep(.page-intro-main h2) {
  font-size: 28px;
  line-height: 1.25;
}

.models-intro-wrap :deep(.page-intro-main p) {
  max-width: 760px;
  line-height: 1.75;
}

.models-section,
.models-guide {
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  background: var(--bg-surface);
  color: var(--text-primary);
}

.models-section {
  padding: 28px;
}

.models-section-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 24px;
}

.models-section-heading h3,
.models-guide h3 {
  margin: 0;
  color: var(--text-primary);
  font-size: 20px;
  font-weight: 700;
  line-height: 1.35;
  letter-spacing: 0;
}

.models-section-heading p,
.featured-model-content p,
.ecosystem-card p,
.models-guide p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 400;
  line-height: 1.7;
}

.models-section-heading p {
  max-width: 760px;
  margin-top: 8px;
}

.featured-model-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.featured-model-card {
  display: grid;
  grid-template-columns: 128px minmax(0, 1fr);
  gap: 22px;
  align-items: start;
  min-width: 0;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  background: var(--bg-surface-alt);
  padding: 22px;
  transition: none;
}

.featured-model-card:hover {
  border-color: var(--border-default);
  background: var(--bg-surface-alt);
}

.featured-model-logo {
  display: flex;
  width: 128px;
  height: 128px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  background: var(--bg-surface);
}

.featured-model-logo img {
  display: block;
  width: 82px;
  height: 82px;
  object-fit: contain;
}

.featured-model-content,
.ecosystem-body {
  min-width: 0;
}

.featured-model-header,
.ecosystem-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.featured-model-header h4,
.ecosystem-card h4 {
  margin: 0;
  color: var(--text-primary);
  font-size: 20px;
  font-weight: 700;
  line-height: 1.3;
}

.featured-model-header span,
.ecosystem-title-row span {
  flex: 0 0 auto;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  background: var(--bg-surface);
  padding: 4px 9px;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 700;
}

.featured-model-content p {
  margin-top: 10px;
}

.model-version-block {
  display: grid;
  gap: 10px;
  margin-top: 16px;
  min-width: 0;
}

.model-version-block > span {
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 700;
  line-height: 1.3;
}

.model-version-list,
.ecosystem-version-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
}

.featured-model-content li {
  max-width: 100%;
  overflow: hidden;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  background: var(--bg-surface);
  padding: 5px 9px;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 700;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.model-version-list span,
.ecosystem-version-list span {
  max-width: 100%;
  overflow: hidden;
  border: 1px solid var(--accent);
  border-radius: var(--radius-sm);
  background: var(--accent-soft);
  padding: 5px 9px;
  color: var(--accent);
  font-size: 12px;
  font-weight: 700;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.featured-model-content ul {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 14px 0 0;
  padding: 0;
  list-style: none;
}

.models-primary-action,
.models-secondary-action,
.model-config-link,
.ecosystem-action {
  display: inline-flex;
  min-height: 36px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  text-decoration: none;
  white-space: nowrap;
}

.models-primary-action,
.models-secondary-action {
  background: var(--accent);
  padding: 0 18px;
  color: var(--accent-contrast);
  font-size: 14px;
  font-weight: 700;
}

.models-primary-action:hover,
.models-secondary-action:hover {
  background: var(--accent);
}

.model-config-link,
.ecosystem-action {
  justify-self: flex-start;
  border: 1px solid var(--border-default);
  background: var(--bg-surface);
  padding: 0 14px;
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 700;
}

.model-config-link {
  margin-top: 16px;
}

.ecosystem-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.ecosystem-card {
  display: grid;
  grid-template-columns: 58px minmax(0, 1fr);
  gap: 15px;
  align-items: start;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  background: var(--bg-surface-alt);
  padding: 18px;
  transition: none;
}

.ecosystem-card:hover {
  border-color: var(--border-default);
  background: var(--bg-surface-alt);
}

.ecosystem-logo {
  display: flex;
  width: 58px;
  height: 58px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  background: var(--bg-surface);
}

.ecosystem-logo img {
  display: block;
  width: 35px;
  height: 35px;
  object-fit: contain;
}

.ecosystem-card p {
  margin-top: 7px;
}

.ecosystem-version-list {
  margin-top: 12px;
}

.ecosystem-action {
  margin-top: 14px;
}

.models-guide {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 22px;
  padding: 24px 28px;
}

.models-guide p {
  max-width: 760px;
  margin-top: 7px;
}

:global(.dark) .models-section,
:global(.dark) .models-guide,
:global(.dark) .featured-model-logo,
:global(.dark) .ecosystem-logo {
  background: var(--bg-surface);
}

:global(.dark) .featured-model-card,
:global(.dark) .ecosystem-card {
  background: var(--bg-surface-alt);
}

:global(.dark) .featured-model-logo img,
:global(.dark) .ecosystem-logo img {
  filter: none;
}

@media (max-width: 1100px) {
  .featured-model-grid,
  .ecosystem-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .models-intro-wrap :deep(.page-intro),
  .models-section,
  .models-guide {
    padding: 20px;
  }

  .featured-model-card,
  .ecosystem-card,
  .models-guide {
    grid-template-columns: 1fr;
    align-items: flex-start;
  }

  .featured-model-logo {
    width: 112px;
    height: 112px;
  }

  .models-guide {
    display: grid;
  }
}
</style>
