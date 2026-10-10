<!-- 画布就可以用同一套循环渲染不同物料 -->

<script setup lang="ts">
import type { BlockFormData, Viewport } from '../types'

defineProps<{
  data: BlockFormData
  viewport: Viewport
}>()
</script>

<template>
  <div
    class="text-block"
    :style="{
      fontSize: (data.fontSize?.[viewport] ?? 24) + 'px',
      color: data.color?.[viewport] ?? '#1f2329',
    }"
  >
    {{ data.text?.[viewport] ?? '' }}
  </div>
</template>

<style scoped>
.text-block {
  width: 100%;
  padding: 10px;
  line-height: 1.6;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  box-sizing: border-box;
}
</style>