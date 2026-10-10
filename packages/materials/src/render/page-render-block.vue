<script setup lang="ts">
import type { BaseBlock, Viewport } from '../types'
import {
  componentMap,
  ColumnBlock,
  BackgroundContainerBlock,
} from '../registry'


defineOptions({
  name: 'PageRenderBlock',
})

defineProps<{
  list: BaseBlock[]
  viewport: Viewport
}>()


</script>

<template>
  <div class="page-block-list">
    <template v-for="node in list" :key="node.id">
      <!--  ColumnBlock                  v-if
            BackgroundContainerBlock     v-else-if
            普通动态组件                  v-else-if
            不可用提示                    v-else -->
      <ColumnBlock v-if="node.code === 'column' && node.children" :data="node.formData" :viewport="viewport"
        :children="node.children" mode="preview">
        <template #default="{ item }">
          <PageRenderBlock :list="item" :viewport="viewport" />
        </template>
      </ColumnBlock>

      <BackgroundContainerBlock v-else-if="
        node.code === 'backgroundContainer' &&
        node.children
      " :data="node.formData" :viewport="viewport" :children="node.children" mode="preview">
        <template #default="{ item }">
          <PageRenderBlock :list="item" :viewport="viewport" />
        </template>
      </BackgroundContainerBlock>

      <!-- 当列内节点是文本、图片或留白时，走的是基础物料分支： -->
      <component v-else-if="componentMap[node.code]" :is="componentMap[node.code]" :data="node.formData"
        :viewport="viewport" v-bind="node.code === 'button' ? { mode: 'preview' } : {}" />

      <div v-else class="unavailable-block">
        组件暂不可用：{{ node.name }}
      </div>
    </template>
  </div>
</template>

<style scoped>
.page-block-list {
  min-width: 0;
  width: 100%;
}

.unavailable-block {
  padding: 24px;
  background: var(--color-bg, #f5f6f7);
  color: #8a94a6;
}
</style>