<script setup lang="ts">
import type { BlockFormData, Viewport } from '../types'

defineProps<{
  data: BlockFormData
  viewport: Viewport
}>()
</script>

<template>
  <div class="code-block">
    <div
      class="code-panel"
      :style="{
        color: data.color?.[viewport] ?? '#e6edf3',
        backgroundColor: data.background?.[viewport] ?? '#1f2329',
      }"
    >
      <div class="code-header">
        代码片段
      </div>

      <pre
        class="code-content"
        :style="{
          fontSize: (data.fontSize?.[viewport] ?? 14) + 'px',
        }"
      ><code>{{ data.text?.[viewport] || '请填写代码内容' }}</code></pre>
    </div>
  </div>
</template>

<style scoped>
.code-block {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  padding: 10px;
}

.code-panel {
  min-width: 0;
  overflow: hidden;
  border-radius: 6px;
}

.code-header {
  padding: 10px 16px;
  border-bottom: 1px solid rgb(255 255 255 / 12%);
  font-size: 12px;
  line-height: 20px;
  opacity: 0.75;
}

.code-content {
  box-sizing: border-box;
  width: 100%;
  max-height: 360px;
  margin: 0;
  padding: 16px;
  overflow: auto;
  font-family:
    ui-monospace,
    SFMono-Regular,
    Menlo,
    Consolas,
    'Liberation Mono',
    monospace;
  line-height: 1.6;
  white-space: pre;
  overflow-wrap: normal;
  word-break: normal;
  tab-size: 2;
}

.code-content > code {
  font-family: inherit;
  font-size: inherit;
  color: inherit;
}
</style>