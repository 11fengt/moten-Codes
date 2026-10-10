<script setup lang="ts">
import { ElButton } from 'element-plus'
import { Icon } from '@iconify/vue'

defineProps<{
  id: string
  name: string
}>()

const emit = defineEmits<{
  copy: [id: string]
  clear: [id: string]
}>()
</script>

<template>
  <div
    class="edit-render-hover"
    role="toolbar"
    :aria-label="`${name}操作`"
    @pointerdown.stop
    @click.stop
  >
    <ElButton
      text
      type="primary"
      class="toolbar-button"
      title="复制"
      :aria-label="`复制${name}`"
      @click.stop="emit('copy', id)"
    >
      <Icon
        icon="fluent:copy-20-regular"
        class="action-icon"
      />
    </ElButton>

    <ElButton
      text
      type="danger"
      class="toolbar-button"
      title="删除"
      :aria-label="`删除${name}`"
      @click.stop="emit('clear', id)"
    >
      <Icon
        icon="fluent:delete-20-regular"
        class="action-icon"
      />
    </ElButton>
  </div>
</template>

<style scoped>
.edit-render-hover {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 3;

  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px;

  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  box-shadow: 0 4px 16px rgb(0 0 0 / 12%);

  cursor: default;
}

.toolbar-button {
  width: 32px;
  height: 32px;
  margin: 0;
  padding: 0;
  border-radius: 4px;
}

.action-icon {
  width: 18px;
  height: 18px;
}
</style>