<script setup lang="ts">
import { computed } from 'vue'
import type { BlockFormData, Viewport } from '../types'

const props = defineProps<{
  data: BlockFormData
  viewport: Viewport
}>()

// 计算属性 border 得到的是一个字符串：'1px solid #dee0e3'
const border = computed(() => {
  const thickness = props.data.thickness?.[props.viewport] ?? 1
  const style = props.data.lineStyle?.[props.viewport] ?? 'solid'
  const color = props.data.color?.[props.viewport] ?? '#dee0e3'

  return `${thickness}px ${style} ${color}`
})
</script>

<template>
  <div
    class="divider-block"
    :style="{
      padding: `${data.spacing?.[viewport] ?? 16}px 10px`,
    }"
  >
    <hr
      class="divider-line"
      :style="{ borderTop: border }"
    />
  </div>
</template>

<style scoped>
.divider-block {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  width: 100%;
  min-width: 0;
  min-height: 16px;
}

.divider-line {
  width: 100%;
  height: 0;
  margin: 0;
  border: 0;
}
</style>