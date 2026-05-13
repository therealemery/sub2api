<template>
  <div class="account-bulk-actions-bar" :class="{ 'account-bulk-actions-bar-active': selectedIds.length > 0 }">
    <div class="account-bulk-copy">
      <span class="account-bulk-title">
        {{
          selectedIds.length > 0
            ? t('admin.accounts.bulkActions.selected', { count: selectedIds.length })
            : t('admin.accounts.bulkEdit.title')
        }}
      </span>
      <span class="account-bulk-description">
        {{
          selectedIds.length > 0
            ? '已选账号可以批量删除、重置状态、刷新 Token、调整调度或批量编辑。'
            : '勾选表格左侧账号后可批量维护；也可以直接对当前筛选结果执行批量编辑。'
        }}
      </span>

      <div v-if="selectedIds.length > 0" class="account-bulk-inline-actions">
        <button @click="$emit('select-page')" class="account-bulk-link">
          {{ t('admin.accounts.bulkActions.selectCurrentPage') }}
        </button>
        <span aria-hidden="true">/</span>
        <button @click="$emit('clear')" class="account-bulk-link">
          {{ t('admin.accounts.bulkActions.clear') }}
        </button>
      </div>
    </div>

    <div class="account-bulk-buttons">
      <template v-if="selectedIds.length > 0">
        <button @click="$emit('delete')" class="btn btn-danger btn-sm">{{ t('admin.accounts.bulkActions.delete') }}</button>
        <button @click="$emit('reset-status')" class="btn btn-secondary btn-sm">{{ t('admin.accounts.bulkActions.resetStatus') }}</button>
        <button @click="$emit('refresh-token')" class="btn btn-secondary btn-sm">{{ t('admin.accounts.bulkActions.refreshToken') }}</button>
        <button @click="$emit('toggle-schedulable', true)" class="btn btn-success btn-sm">{{ t('admin.accounts.bulkActions.enableScheduling') }}</button>
        <button @click="$emit('toggle-schedulable', false)" class="btn btn-warning btn-sm">{{ t('admin.accounts.bulkActions.disableScheduling') }}</button>
        <button @click="$emit('edit-selected')" class="btn btn-primary btn-sm">{{ t('admin.accounts.bulkActions.edit') }}</button>
      </template>
      <button @click="$emit('edit-filtered')" class="btn btn-primary btn-sm">
        {{ t('admin.accounts.bulkEdit.submit') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

defineProps<{
  selectedIds: Array<number | string>
}>()

defineEmits([
  'delete',
  'edit-selected',
  'edit-filtered',
  'clear',
  'select-page',
  'toggle-schedulable',
  'reset-status',
  'refresh-token'
])

const { t } = useI18n()
</script>

<style scoped>
.account-bulk-actions-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
  border: 1px solid var(--border-default);
  border-radius: 14px;
  background: var(--bg-surface-alt);
  padding: 12px 14px;
}

.account-bulk-actions-bar-active {
  background: var(--bg-surface-alt);
}

.account-bulk-copy {
  min-width: 220px;
  display: grid;
  gap: 3px;
}

.account-bulk-title {
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
}

.account-bulk-description {
  max-width: 680px;
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.5;
}

.account-bulk-inline-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-muted);
  font-size: 12px;
}

.account-bulk-link {
  color: var(--text-primary);
  font-size: 12px;
  font-weight: 500;
}

.account-bulk-link:hover {
  color: var(--text-primary);
  text-decoration: underline;
}

.account-bulk-buttons {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

@media (max-width: 900px) {
  .account-bulk-actions-bar {
    align-items: stretch;
    flex-direction: column;
  }

  .account-bulk-buttons {
    justify-content: flex-start;
  }
}
</style>
