<script setup lang="ts">
import { ElFormItem, ElColorPicker } from 'element-plus'
import type { TString } from '@sinclair/typebox'

const props = defineProps<{
  schema: TString
}>()

const value = defineModel<string>({ required: true })

const presetColors = [
  '#1f2329',
  '#409eff',
  '#67c23a',
  '#e6a23c',
  '#f56c6c',
]

function updateColor(color: string | null) {
  const defaultColor = props.schema.default

  value.value =
    color ||
    (typeof defaultColor === 'string' ? defaultColor : '#1f2329')
}
</script>

<template>
  <ElFormItem :label="schema.title" class="config-color">
    <div class="color-field">
      <ElColorPicker
        :model-value="value"
        :predefine="presetColors"
        color-format="hex"
        @update:model-value="updateColor"
      />

      <span class="color-value">
        {{ value }}
      </span>
    </div>
  </ElFormItem>
</template>

<style scoped>
.color-field {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 32px;
}

.color-value {
  color: #8a94a6;
  font-size: 12px;
}
</style>