<!-- 文本内容 Schema
        → code 指定 config-input
        → 映射表找到 ConfigInput
        → 控件读取规则、编辑节点的文本内容 -->

<script setup lang="ts">
import { ElFormItem, ElInput } from 'element-plus'
import type { TString } from '@sinclair/typebox'

defineProps<{
  schema: TString
}>()

const value = defineModel<string>({
  required: true,
})
</script>

<template>
  <ElFormItem :label="schema.title" class="config-input">
    <ElInput
      v-model="value"
      :type="schema.multiline ? 'textarea' : 'text'"
      :autosize="
        schema.multiline
          ? { minRows: 3, maxRows: 8 }
          : false
      "
      :placeholder="schema.placeholder"
      class="input"
    />
  </ElFormItem>
</template>

<style scoped>
.input {
  width: 100%;
}

.config-input :deep(.el-input__wrapper) {
  background: var(--color-bg);
}

.config-input :deep(.el-textarea__inner) {
  background: var(--color-bg);
  line-height: 1.6;
}
</style>