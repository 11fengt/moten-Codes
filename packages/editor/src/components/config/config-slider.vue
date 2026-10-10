<!-- 新建公共滑块组件 -->
<script setup lang="ts">
import { ElFormItem, ElSlider } from 'element-plus'
import type { TNumber } from '@sinclair/typebox'

defineProps<{
  schema: TNumber
}>()

const value = defineModel<number>({
  required: true,
})
</script>

<template>
  <ElFormItem :label="schema.title" class="config-slider">
    <ElSlider
      v-model="value"
      :min="schema.minimum"
      :max="schema.maximum"
      :step="1"
      show-input
      size="small"
      class="input"
    />
  </ElFormItem>
</template>

<style scoped>
.input {
  width: 100%;
}

.config-slider :deep(.el-slider__input) {
  width: 80px;
}

.config-slider :deep(.el-input__wrapper) {
  background: var(--color-bg);
}
</style>