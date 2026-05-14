<template>
  <div class="table-page-layout" :class="{ 'mobile-mode': isMobile }">
    <!-- 固定区域：操作按钮 -->
    <div v-if="$slots.actions" class="layout-section-fixed table-action-bar">
      <slot name="actions" />
    </div>

    <!-- 固定区域：搜索和过滤器 -->
    <div v-if="$slots.filters" class="layout-section-fixed table-filter-bar">
      <slot name="filters" />
    </div>

    <!-- 滚动区域：表格 -->
    <div class="layout-section-scrollable">
      <div class="card table-scroll-container">
        <slot name="table" />
      </div>
    </div>

    <!-- 固定区域：分页器 -->
    <div v-if="$slots.pagination" class="layout-section-fixed">
      <slot name="pagination" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const isMobile = ref(false)

const checkMobile = () => {
  isMobile.value = window.innerWidth < 1024
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<style scoped>
/* 桌面端：Flexbox 布局 */
.table-page-layout {
  @apply flex flex-col gap-4;
  height: calc(100vh - 64px - 4rem); /* 减去 header + lg:p-8 的上下padding */
}

.layout-section-fixed {
  @apply flex-shrink-0;
}

.layout-section-scrollable {
  @apply flex-1 min-h-0 flex flex-col;
}

/* 表格滚动容器 - 增强版表体滚动方案 */
.table-scroll-container {
  @apply flex flex-col overflow-hidden h-full bg-[var(--bg-surface)] bg-[var(--bg-surface-alt)] rounded-lg border border-gray-200 border-[var(--border-default)];
  box-shadow: none;
}

.table-scroll-container :deep(.table-wrapper) {
  @apply flex-1 overflow-x-auto overflow-y-auto;
  /* 确保横向滚动条显示在最底部 */
  scrollbar-gutter: stable;
}

.table-scroll-container :deep(table) {
  @apply w-full;
  min-width: max-content; /* 关键：确保表格宽度根据内容撑开，从而触发横向滚动 */
  display: table; /* 使用标准 table 布局以支持 sticky 列 */
}

.table-scroll-container :deep(thead) {
  @apply bg-gray-50/90 bg-[var(--bg-surface-alt)] backdrop-blur-sm;
}

.table-scroll-container :deep(tbody) {
  /* 保持默认 table-row-group 显示，不使用 block */
}

.table-scroll-container :deep(th) {
  @apply px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 text-[var(--text-muted)] border-b border-gray-200 border-[var(--border-default)];
}

.table-scroll-container :deep(td) {
  @apply px-5 py-4 text-sm text-gray-700 border-b border-gray-100 border-[var(--border-default)];
}

.table-scroll-container :deep(tbody tr) {
  @apply transition-colors duration-150;
}

.table-scroll-container :deep(tbody tr.data-table-row:hover) {
  @apply bg-[var(--bg-surface-alt)];
}

/* 移动端：恢复正常滚动 */
.table-page-layout.mobile-mode .table-scroll-container {
  @apply h-auto overflow-hidden border-none shadow-none bg-transparent;
}

.table-page-layout.mobile-mode .layout-section-scrollable {
  @apply flex-none min-h-fit;
}

.table-page-layout.mobile-mode .table-scroll-container :deep(.table-wrapper) {
  @apply overflow-x-auto overflow-y-visible;
}

.table-page-layout.mobile-mode .table-scroll-container :deep(table) {
  @apply flex-none;
  display: table;
  min-width: max-content;
}

.table-page-layout {
  gap: 1rem;
  height: calc(100vh - 64px - 3rem);
  min-height: 560px;
}

.table-action-bar,
.table-filter-bar {
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  padding: 0.75rem;
  background: var(--bg-surface);
  box-shadow: none;
  backdrop-filter: none;
}

.table-action-bar {
  display: flex;
  justify-content: flex-end;
  border: 0;
  background: transparent;
  box-shadow: none;
  padding: 0;
  backdrop-filter: none;
}



.table-scroll-container {
  border-color: var(--border-default);
  background: var(--bg-surface);
  box-shadow: none;
  backdrop-filter: none;
}


.table-scroll-container :deep(thead) {
  background: var(--bg-surface-alt);
  backdrop-filter: none;
}

.table-scroll-container :deep(th) {
  border-color: var(--border-default);
  color: var(--text-secondary);
  font-weight: 650;
}

.table-scroll-container :deep(td) {
  border-color: var(--border-default);
  color: var(--text-primary);
}

.table-scroll-container :deep(tbody tr.data-table-row:hover) {
  background: var(--bg-surface-alt);
}

.table-page-layout.mobile-mode {
  height: auto;
  min-height: 0;
}

@media (max-width: 640px) {
  .table-page-layout {
    gap: 0.75rem;
  }

  .table-action-bar,
  .table-filter-bar {
    border-radius: 14px;
    padding: 0.75rem;
  }
}

.table-page-layout {
  gap: 16px;
  height: calc(100vh - 64px - 2rem);
}

.table-filter-bar {
  border-color: var(--border-default) !important;
  border-radius: var(--radius-lg) !important;
  padding: 12px !important;
  background: var(--bg-surface) !important;
  box-shadow: none;
  backdrop-filter: none !important;
}

.table-action-bar {
  padding: 0 !important;
  background: transparent !important;
  box-shadow: none;
}

.table-scroll-container {
  border-color: var(--border-default) !important;
  border-radius: var(--radius-lg) !important;
  background: var(--bg-surface) !important;
  box-shadow: none;
  backdrop-filter: none !important;
}

.table-scroll-container :deep(thead) {
  background: var(--bg-surface-alt) !important;
  backdrop-filter: none !important;
}

.table-scroll-container :deep(th) {
  border-color: var(--border-default) !important;
  color: var(--text-secondary) !important;
  font-size: 12px !important;
  font-weight: 650 !important;
  letter-spacing: normal !important;
  text-transform: none !important;
}

.table-scroll-container :deep(td) {
  border-color: var(--border-default) !important;
  color: var(--text-primary) !important;
  font-size: 14px !important;
  font-weight: 400 !important;
}

.table-scroll-container :deep(tbody tr.data-table-row:hover) {
  background: var(--bg-surface-alt) !important;
}

.table-scroll-container :deep(tbody tr:not(.data-table-row):hover),
.table-scroll-container :deep(tbody tr:not(.data-table-row):hover td) {
  background: transparent !important;
}


.table-page-layout,
.layout-section-fixed,
.layout-section-scrollable,
.table-scroll-container {
  min-width: 0;
  max-width: 100%;
}

.table-page-layout {
  width: 100%;
}
</style>
