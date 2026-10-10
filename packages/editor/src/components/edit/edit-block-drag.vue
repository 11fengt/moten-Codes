<script setup lang="ts">
import Draggable from 'vuedraggable'
import { Icon } from '@iconify/vue'
import iconConfig from '@/config/icon'
import type { BaseBlock } from '@/types/edit'
import { clone, dragGroup, move } from './nested'

defineProps<{
  list: BaseBlock[]
}>()
</script>

<template>
  <Draggable
    :list="list"
    item-key="code"
    :group="{ name: dragGroup, pull: 'clone', put: false }"
    :sort="false"
    :clone="clone"
    :animation="200"
    ghost-class="ghost-class"
    :move="move"
    class="edit-block-drag"
  >
    <template #item="{ element }">
      <div class="block-item">
        <Icon
          :icon="
            iconConfig[element.icon] ||
            'fluent:question-circle-12-regular'
          "
          class="block-icon"
        />
        <span>{{ element.name }}</span>
      </div>
    </template>
  </Draggable>
</template>

<style scoped>
.edit-block-drag {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0;
}

.block-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;

  min-width: 0;
  width: 100%;
  aspect-ratio: 1 / 1;
  padding: 12px 6px;

  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
  color: #303133;

  cursor: grab;
  user-select: none;
  transition:
    background-color 0.16s,
    border-color 0.16s;
}

.block-item:hover {
  background: #f5f6f7;
  border-color: #e4e7ed;
}

.block-item:active {
  cursor: grabbing;
}

.block-icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  color: #303133;
}

.block-item > span {
  max-width: 100%;
  overflow: hidden;
  font-size: 14px;
  line-height: 20px;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 物料进入拖拽占位状态时，取消正方形比例。 */
.block-item.ghost-class {
  width: 100%;
  min-height: 0;
  height: 75px;
  aspect-ratio: auto;
}
</style>