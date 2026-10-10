<script setup lang="ts">
import type { SavedPage, Viewport } from '../types'
import PageRenderBlock from './page-render-block.vue'

defineProps<{
  content: SavedPage['content']
  viewport: Viewport
}>()
</script>

<template>
  <div
    class="page-render"
    :style="{
      background: content.page.background[viewport],
    }"
  >
    <PageRenderBlock
      :list="content.block"
      :viewport="viewport"
    />
  </div>
</template>

<style scoped>
.page-render {
  width: 100%;
  min-width: 0;
  min-height: 100%;
}
</style>