<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type {
  BaseBlock,
  BlockFormData,
  Viewport,
} from '../types'

const props = withDefaults(
  defineProps<{
    data: BlockFormData
    viewport: Viewport
    children: BaseBlock[][]
    mode?: 'edit' | 'preview'
  }>(),
  {
    mode: 'edit',
  },
)

const src = computed(
  () => props.data.src?.[props.viewport] ?? '',
)

const failed = ref(false)

watch(src, () => {
  failed.value = false
})
</script>

<template>
  <div
    class="background-container"
    :class="{ 'is-edit': mode === 'edit' }"
  >
    <img
      v-if="src && !failed"
      :src="src"
      class="background-image"
      alt=""
      aria-hidden="true"
      draggable="false"
      @error="failed = true"
    />

    <div
      class="background-content"
      :style="{
        minHeight: (data.minHeight?.[viewport] ?? 280) + 'px',
        padding: (data.padding?.[viewport] ?? 20) + 'px',
      }"
    >
      <slot :item="children[0] ?? []" />
    </div>

    <span
      v-if="mode === 'edit' && failed"
      class="background-error"
    >
      背景图片加载失败，请检查地址
    </span>
  </div>
</template>

<style scoped>
.background-container {
  position: relative;
  isolation: isolate;
  width: 100%;
  min-width: 0;
  border-radius: 6px;
  background: #ffffff;
}

.background-container.is-edit {
  outline: 1px dashed #dee0e3;
  outline-offset: -1px;
}

.background-image {
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  border-radius: inherit;
  object-fit: cover;
  opacity: 0.3;
  pointer-events: none;
  user-select: none;
}

.background-content {
  box-sizing: border-box;
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.background-error {
  position: absolute;
  bottom: 8px;
  left: 8px;
  z-index: 2;
  padding: 4px 8px;
  border-radius: 4px;
  background: rgb(255 255 255 / 90%);
  color: #e6a23c;
  font-size: 12px;
  pointer-events: none;
}
</style>