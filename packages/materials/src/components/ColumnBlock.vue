<script setup lang="ts">
import type {
    BaseBlock,
    BlockFormData,
    Viewport,
} from '../types'

withDefaults(
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
</script>

<template>
    <div class="column-block" :class="{
        'is-preview': mode === 'preview',
    }">
        <div v-for="(item, index) in children" :key="index" class="column-item">
            <slot :item="item" :index="index" />
        </div>
    </div>
</template>

<style scoped>
.column-block {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
    padding: 3px;
    background: white;
}

.column-item {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 240px;
    border: 1px solid var(--color-border, #dee0e3);
    border-radius: var(--border-radius, 6px);
    overflow-wrap: anywhere;
}

.column-block.is-preview {
  padding: 0;
  background: transparent;
}

.is-preview > .column-item {
  min-height: 0;
  border: 0;
  border-radius: 0;
}
</style>