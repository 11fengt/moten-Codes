<script setup lang="ts">
import Draggable from 'vuedraggable'
import { useEditStore } from '@/stores/edit'
import type { BaseBlock } from '@/types/edit'

import EditRenderHover from './edit-render-hover.vue'
import {
    clone,
    dragGroup,
    nestedClass,
    move,
    findNodeById,
} from './nested.ts'

defineOptions({
    name: 'EditRenderDrag',
})

const props = withDefaults(
    defineProps<{
        list: BaseBlock[]
        level?: number
    }>(),
    {
        level: 1,
    },
)

const edit = useEditStore()

import {
    componentMap,
    ColumnBlock,
    BackgroundContainerBlock,
} from '@learn-moten/materials'

// const componentMap: Record<string, Component> = {
//     text: TextBlock,
//     image: ImageBlock,
//     blank: BlankBlock,
// }

function copy(id: string) {
    const index = props.list.findIndex(block => block.id === id)
    const node = props.list[index]

    if (!node) return

    const newNode = clone(node)

    props.list.splice(index + 1, 0, newNode)
    edit.setCurrentSelect(newNode.id)
}

function clear(id: string) {
    const index = props.list.findIndex(block => block.id === id)

    if (index === -1) return

    props.list.splice(index, 1)

    // 删除节点或其父容器后，检查选中的节点是否还存在。
    if (!findNodeById(edit.blockConfig, edit.currentSelectId)) {
        edit.setCurrentSelect('')
    }
}
</script>

<template>
    <Draggable :list="list" :group="dragGroup" :move="move" item-key="id" :animation="200" ghost-class="ghost-class"
        class="edit-render-drag" :class="level > 1 ? nestedClass : ''" filter=".edit-render-hover"
        :prevent-on-filter="false">
        <template #item="{ element }">
            <div class="block-render" :class="{ 'is-active': edit.currentSelectId === element.id }"
                @click.stop="edit.setCurrentSelect(element.id)">
                <EditRenderHover v-if="edit.currentSelectId === element.id" :id="element.id" :name="element.name"
                    @copy="copy" @clear="clear" />

                <ColumnBlock v-if="
                    element.code === 'column' &&
                    level === 1 &&
                    element.children
                " :data="element.formData" :viewport="edit.viewport" :children="element.children" mode="edit">
                    <template #default="{ item, index }">
                        <EditRenderDrag :key="element.id + '-' + index" :list="item" :level="level + 1" />
                    </template>
                </ColumnBlock>

                <BackgroundContainerBlock v-else-if="
                    element.code === 'backgroundContainer' &&
                    level === 1 &&
                    element.children
                " :data="element.formData" :viewport="edit.viewport" :children="element.children" mode="edit">
                    <template #default="{ item }">
                        <EditRenderDrag :key="element.id + '-background'" :list="item" :level="level + 1"
                            class="background-drop-zone" />
                    </template>
                </BackgroundContainerBlock>

                <component v-else-if="componentMap[element.code]" :is="componentMap[element.code]"
                    :data="element.formData" :viewport="edit.viewport"
                    v-bind="element.code === 'button' ? { mode: 'edit' } : {}" />

                <div v-else class="unavailable-block">
                    组件暂不可用：{{ element.name }}
                </div>
            </div>
        </template>

        <template #footer>
            <div v-if="level > 1 && !list.length" class="column-empty">
                拖入文本、图片、按钮等基础物料
            </div>
        </template>
    </Draggable>
</template>

<style scoped>
.edit-render-drag {
    position: relative;
    flex: 1;
    min-width: 0;
    min-height: 300px;
}

.edit-render-drag.nested-container {
    min-height: 240px;
}

.block-render {
    position: relative;
    cursor: grab;
}

.block-render:active {
    cursor: grabbing;
}

.block-render:hover {
    outline: 1px dashed var(--color-primary);
    outline-offset: -1px;
}

.block-render.is-active {
    z-index: 2;
    outline: 2px solid var(--color-primary);
    outline-offset: -2px;
}

.ghost-class {
    opacity: 0.35;
    background: #ecf5ff;
    outline: 1px dashed var(--color-primary);
    outline-offset: -1px;
}

.unavailable-block {
    padding: 24px;
    color: #8a94a6;
    background: #f5f6f7;
}

.column-empty {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    border-radius: var(--border-radius);
    background: var(--color-bg);
    color: #8a94a6;
    font-size: 12px;
    text-align: center;
    pointer-events: none;
}

.edit-render-drag.background-drop-zone {
  min-height: 0;
}

.background-drop-zone > .column-empty {
  background: transparent;
  outline: 1px dashed rgb(64 158 255 / 35%);
  outline-offset: -1px;
}
</style>