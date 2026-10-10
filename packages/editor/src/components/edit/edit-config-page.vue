<script setup lang="ts">
import { ElForm, ElFormItem, ElInput } from 'element-plus'
import { useEditStore } from '@/stores/edit'
import { pageSchema } from '@learn-moten/materials'
import EditConfigRender from './edit-config-render.vue'

const edit = useEditStore()
</script>

<template>
  <div class="edit-config-page">
    <ElForm label-position="top" class="page-name-form">
      <ElFormItem label="页面名称">
        <ElInput
          v-model="edit.pageName"
          placeholder="例如：夏日活动宣传页"
          :maxlength="40"
          show-word-limit
        />
      </ElFormItem>
    </ElForm>

    <EditConfigRender
      :key="edit.viewport"
      :schema="pageSchema"
      :data="edit.pageConfig"
      :viewport="edit.viewport"
    >
      <p class="page-tip">
        页面名称两端共用，背景按桌面端和移动端分别设置。
      </p>
    </EditConfigRender>
  </div>
</template>

<style scoped>
.page-name-form {
  margin-top: 24px;
}

.page-name-form :deep(.el-form-item__label) {
  color: var(--color-text);
  font-size: 13px;
}

.page-name-form :deep(.el-input__wrapper) {
  background: var(--color-bg);
}

.page-tip {
  margin: 0;
  color: #8a94a6;
  font-size: 12px;
  line-height: 1.7;
}
</style>