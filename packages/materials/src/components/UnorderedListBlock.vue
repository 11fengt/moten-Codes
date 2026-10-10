<script setup lang="ts">
import { computed } from 'vue'
import type { BlockFormData, Viewport } from '../types'

const props = defineProps<{
  data: BlockFormData
  viewport: Viewport
}>()

const items = computed(() => {
  const text = props.data.text?.[props.viewport] ?? ''

  return text
    .split(/\r\n|\r|\n/)
    .map(item => item.trim())
    .filter(item => item.length > 0)
})
</script>

<template>
  <div
    class="unordered-list-block"
    :style="{
      fontSize: (data.fontSize?.[viewport] ?? 20) + 'px',
      color: data.color?.[viewport] ?? '#1f2329',
    }"
  >
    <ul v-if="items.length" class="unordered-list">
      <li
        v-for="(item, index) in items"
        :key="index"
      >
        {{ item }}
      </li>
    </ul>

    <div v-else class="list-empty">
      请在右侧输入列表内容，每行一项
    </div>
  </div>
</template>

<style scoped>
.unordered-list-block {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  padding: 10px;
  line-height: 1.6;
  overflow-wrap: anywhere;
}

.unordered-list {
  margin: 0;
  padding-left: 1.2em;
  list-style-type: disc;
  list-style-position: outside;
}

.unordered-list > li + li {
  margin-top: 8px;
}

.list-empty {
  color: #8a94a6;
  font-size: 14px;
}
</style>