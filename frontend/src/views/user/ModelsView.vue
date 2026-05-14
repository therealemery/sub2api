<template>
  <AppLayout>
    <div class="models-page">
      <PageIntro
        :eyebrow="modelCenterConfig.eyebrow"
        :title="modelCenterConfig.title"
        :description="modelCenterConfig.description"
      >
        <template #actions>
          <router-link to="/keys" class="models-primary-action">配置 API 密钥</router-link>
        </template>
      </PageIntro>

      <section class="models-section" aria-labelledby="featured-models-title">
        <div class="models-section-heading">
          <h3 id="featured-models-title">{{ modelCenterConfig.featuredTitle }}</h3>
          <p>{{ modelCenterConfig.featuredDescription }}</p>
        </div>

        <div class="featured-model-grid">
          <article v-for="model in featuredModels" :key="model.id" class="featured-model-card">
            <div class="model-logo-box">
              <img :src="model.logo" :alt="model.name" />
            </div>
            <div class="model-card-body">
              <div class="model-card-header">
                <h4>{{ model.name }}</h4>
                <span>{{ model.statusLabel }}</span>
              </div>
              <p>{{ model.description }}</p>
              <div class="model-version-list">
                <span v-for="version in model.versions" :key="`${model.id}-${version}`">
                  {{ version }}
                </span>
              </div>
              <router-link to="/keys" class="model-config-link">配置密钥</router-link>
            </div>
          </article>
        </div>
      </section>

      <section class="models-section" aria-labelledby="ecosystem-models-title">
        <div class="models-section-heading">
          <h3 id="ecosystem-models-title">{{ modelCenterConfig.ecosystemTitle }}</h3>
          <p>{{ modelCenterConfig.ecosystemDescription }}</p>
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
              <p>{{ model.versions.slice(0, 3).join(' / ') }}</p>
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
  gap: 26px;
  width: 100%;
  max-width: 1180px;
  margin: 0 auto;
}

.models-section,
.models-guide {
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  background: var(--bg-surface);
  color: var(--text-primary);
}

.models-section {
  padding: 26px;
}

.models-section-heading {
  display: grid;
  gap: 8px;
  margin-bottom: 22px;
}

.models-section-heading h3,
.models-guide h3 {
  margin: 0;
  color: var(--text-primary);
  font-size: 20px;
  font-weight: 800;
  line-height: 1.35;
}

.models-section-heading p,
.model-card-body p,
.models-guide p,
.ecosystem-body p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.7;
}

.featured-model-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.featured-model-card {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  gap: 18px;
  min-height: 260px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  background: var(--bg-surface-alt);
  padding: 20px;
}

.model-logo-box,
.ecosystem-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  background: var(--bg-surface);
}

.model-logo-box {
  width: 96px;
  height: 96px;
}

.model-logo-box img {
  width: 62px;
  height: 62px;
  object-fit: contain;
}

.model-card-body {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 12px;
}

.model-card-header,
.ecosystem-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.model-card-header h4,
.ecosystem-title-row h4 {
  margin: 0;
  color: var(--text-primary);
  font-size: 18px;
  font-weight: 800;
}

.model-card-header span,
.ecosystem-title-row span {
  flex: 0 0 auto;
  border: 1px solid var(--accent);
  border-radius: var(--radius-sm);
  background: var(--accent-soft);
  padding: 4px 9px;
  color: var(--accent);
  font-size: 12px;
  font-weight: 800;
}

.model-version-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.model-version-list span {
  max-width: 100%;
  overflow: hidden;
  border: 1px solid var(--accent);
  border-radius: var(--radius-sm);
  background: var(--accent-soft);
  padding: 5px 9px;
  color: var(--accent);
  font-size: 12px;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.models-primary-action,
.models-secondary-action,
.model-config-link {
  display: inline-flex;
  min-height: 36px;
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
  font-weight: 800;
}

.model-config-link {
  width: fit-content;
  margin-top: auto;
  border: 1px solid var(--border-default);
  background: var(--bg-surface);
  padding: 0 14px;
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 800;
}

.ecosystem-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.ecosystem-card {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  gap: 12px;
  min-height: 104px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  background: var(--bg-surface-alt);
  padding: 14px;
}

.ecosystem-logo {
  width: 44px;
  height: 44px;
}

.ecosystem-logo img {
  width: 28px;
  height: 28px;
  object-fit: contain;
}

.ecosystem-body {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.ecosystem-body p {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.models-guide {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 22px;
  padding: 24px 26px;
}

.models-guide p {
  max-width: 760px;
  margin-top: 7px;
}

@media (max-width: 1180px) {
  .ecosystem-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .featured-model-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .featured-model-card,
  .models-guide {
    grid-template-columns: 1fr;
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
