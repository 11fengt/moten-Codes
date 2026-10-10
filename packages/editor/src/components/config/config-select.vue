<script setup lang="ts">
import {
  ElFormItem,
  ElSelect,
  ElOption,
} from 'element-plus'
import type { TString } from '@sinclair/typebox'

defineProps<{
  schema: TString & {
    options: {
      label: string
      value: string
    }[]
  }
}>()

const value = defineModel<string>({
  required: true,
})
</script>

<template>
  <ElFormItem :label="schema.title">
    <ElSelect
      v-model="value"
      class="config-select"
    >
      <ElOption
        v-for="option in schema.options"
        :key="option.value"
        :label="option.label"
        :value="option.value"
      />
    </ElSelect>
  </ElFormItem>
</template>

<style scoped>
.config-select {
  width: 100%;
}

.config-select :deep(.el-select__wrapper) {
  background: var(--color-bg);
}
</style>