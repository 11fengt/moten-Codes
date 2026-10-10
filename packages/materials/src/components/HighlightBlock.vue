<script setup lang="ts">
import type { BlockFormData, Viewport } from '../types'

defineProps<{
  data: BlockFormData
  viewport: Viewport
}>()
</script>

<template>
  <div class="highlight-block">
    <div
      class="highlight-content"
      role="note"
      :style="{
        fontSize: (data.fontSize?.[viewport] ?? 16) + 'px',
        color: data.color?.[viewport] ?? '#1f2329',
        backgroundColor: data.background?.[viewport] ?? '#ecf5ff',
        borderLeftColor: data.borderColor?.[viewport] ?? '#409eff',
      }"
    >
      {{ data.text?.[viewport] || '请填写提示内容' }}
    </div>
  </div>
</template>

<style scoped>
.highlight-block {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  padding: 10px;
}

.highlight-content {
  box-sizing: border-box;
  min-width: 0;
  padding: 16px 20px;
  border-left: 4px solid;
  border-radius: 6px;
  line-height: 1.6;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
</style>