<script setup lang="ts">
import { computed } from 'vue'
import type { BlockFormData, Viewport } from '../types'

const props = defineProps<{
  data: BlockFormData
  viewport: Viewport
}>()

// 多行文字  如：text === '  选择物料  \n\n拖入画布\n修改属性'
//    ↓ split：拆行
// 包含空格、空行的数组
//    ↓ map：去掉首尾空白
// 清理过的数组
//    ↓ filter：去掉空行
// 用于展示的条目数组
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
    class="ordered-list-block"
    :style="{
      fontSize: (data.fontSize?.[viewport] ?? 20) + 'px',
      color: data.color?.[viewport] ?? '#1f2329',
    }"
  >
    <ol v-if="items.length" class="ordered-list">
      <li
        v-for="(item, index) in items"
        :key="index"
      >
        {{ item }}
      </li>
    </ol>

    <div v-else class="list-empty">
      请在右侧输入列表内容，每行一项
    </div>
  </div>
</template>

<style scoped>
.ordered-list-block {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  padding: 10px;
  line-height: 1.6;
  overflow-wrap: anywhere;
}

.ordered-list {
  margin: 0;
  padding-left: 1.2em;
  list-style-type: decimal;
  list-style-position: outside;
}

.ordered-list > li + li {
  margin-top: 8px;
}

.list-empty {
  color: #8a94a6;
  font-size: 14px;
}
</style>