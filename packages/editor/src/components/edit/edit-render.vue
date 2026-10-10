<!-- 这个文件现在负责画布容器和空状态，节点渲染交给新组件。 -->

<script setup lang="ts">
import { ElEmpty } from 'element-plus'
import { useEditStore } from '@/stores/edit'
import EditRenderDrag from './edit-render-drag.vue'

const edit = useEditStore()
</script>

<template>
  <main class="edit-render" @click="edit.setCurrentSelect('')">
    <div class="render-page" :class="{ 'is-mobile': edit.viewport === 'mobile' }" :style="{
      background: edit.pageConfig.background[edit.viewport],
    }">
      <EditRenderDrag :list="edit.blockConfig" />

      <ElEmpty v-if="!edit.blockConfig.length" description="从左侧添加组件到画布" class="empty-state" />
    </div>
  </main>
</template>



<style scoped>
.edit-render {
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 24px;
  background: var(--color-bg);
  min-height: 0;
}

.render-page {
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
  background: white;
  box-shadow: 0 2px 12px rgb(0 0 0 / 4%);
  width: 100%;
  max-width: 100%;
  flex-shrink: 0;
}

.empty-state {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.render-page.is-mobile {
  width: 375px;
  margin-left: auto;
  margin-right: auto;
}
</style>