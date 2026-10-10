<script setup lang="ts">
import { computed } from 'vue'
import type { BlockFormData, Viewport } from '../types'

const props = defineProps<{
  data: BlockFormData
  viewport: Viewport
}>()

const height = computed(() => {
  const value = props.data.height?.[props.viewport]

  return typeof value === 'number' ? value : 24
})
</script>

<template>
  <div
    class="blank-block"
    :style="{ height: height + 'px' }"
  ></div>
</template>

<style scoped>
.blank-block {
  width: 100%;
}
</style>