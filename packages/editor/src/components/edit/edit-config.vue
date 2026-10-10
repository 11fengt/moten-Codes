<!-- 新建属性面板组件 -->

<script setup lang="ts">
import { computed } from 'vue'
import { ElAlert } from 'element-plus'
import { useEditStore } from '@/stores/edit'
import { blockSchema } from '@learn-moten/materials'
import EditConfigRender from './edit-config-render.vue'
import EditConfigPage from './edit-config-page.vue'
// // 这是一个 “ 控件名称 → Vue 组件 ” 的对应表
// const configComponentMap: Record<string, Component> = {
//     'config-slider': ConfigSlider,
//     'config-input': ConfigInput,
//     'config-color': ConfigColor,
// }

import { validateBlock } from '@learn-moten/materials'



const edit = useEditStore()
const blockErrors = computed(() => {
    const node = edit.currentSelect

    if (!node) return []

    return validateBlock(node.code, node.formData)
})
const selectedSchema = computed(() => {
    const code = edit.currentSelect?.code

    if (
        code === 'text' ||
        code === 'blank' ||
        code === 'image' ||
        code === 'orderedList' ||
        code === 'unorderedList' ||
        code === 'button' ||
        code === 'divider' ||
        code === 'highlight' ||
        code === 'codeBlock' ||
        code === 'backgroundContainer'
    ) {
        return blockSchema[code]
    }

    return undefined
})

</script>

<template>
    <aside class="edit-config">
        <h2 class="panel-title">
            {{ edit.currentSelect ? '组件设置' : '页面设置' }}
        </h2>

        <template v-if="edit.currentSelect">
            <div class="selected-info">
                <span class="selected-name">
                    {{ edit.currentSelect.name }}
                </span>

                <span class="selected-code">
                    {{ edit.currentSelect.code }}
                </span>
            </div>
            <!-- 检验数据是否出错 -->
            <ElAlert v-if="blockErrors.length" title="当前组件存在配置错误" type="error" show-icon :closable="false"
                class="validation-alert">
                <ul class="validation-list">
                    <li v-for="(message, index) in blockErrors" :key="index">
                        {{ message }}
                    </li>
                </ul>
            </ElAlert>

            <EditConfigRender v-if="selectedSchema" :key="`${edit.currentSelect.id}-${edit.viewport}`"
                :schema="selectedSchema" :data="edit.currentSelect.formData" :viewport="edit.viewport" :class="{
                    'image-size-fields': edit.currentSelect.code === 'image',
                }">
                <p v-if="edit.currentSelect.code === 'blank'" class="blank-tip">
                    留白用于调整上下组件之间的间距。
                </p>

                <p v-if="edit.currentSelect.code === 'image'" class="image-tip">
                    固定尺寸填写 px；宽度填写 100% 可铺满容器。
                </p>

                <p class="field-tip">
                    正在编辑{{ edit.viewport === 'desktop' ? '桌面端' : '移动端' }}
                    {{ edit.currentSelect.name }}
                </p>
            </EditConfigRender>

            <div v-else class="config-empty">
                这个物料的属性表单将在后续接入。
            </div>
        </template>
        <EditConfigPage v-else />
    </aside>
</template>

<style scoped>
.edit-config {
    min-width: 0;
    min-height: 0;
    padding: 24px 20px;
    overflow-y: auto;
    border-left: 1px solid var(--color-border);
    background: white;
}

.panel-title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
}

.selected-info {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: 20px;
    padding: 12px;
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);
    background: var(--color-bg);
}

.selected-name {
    font-size: 14px;
    font-weight: 500;
}

.selected-code {
    color: #8a94a6;
    font-size: 12px;
}

.field-tip {
    margin: 0;
    color: #8a94a6;
    font-size: 12px;
}

.config-empty {
    padding-top: 40px;
    color: #8a94a6;
    font-size: 13px;
    line-height: 1.8;
}

.image-tip {
    margin: 0 0 12px;
    color: #8a94a6;
    font-size: 12px;
    line-height: 1.6;
    overflow-wrap: anywhere;
}


.image-size-fields {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: 12px;
}

.image-size-fields :deep(.el-form-item) {
    min-width: 0;
}

.image-size-fields .image-tip,
.image-size-fields .field-tip {
    grid-column: 1 / -1;
}

.image-size-fields .el-form-item {
    min-width: 0;
}


.blank-tip {
    margin: 0 0 12px;
    color: #8a94a6;
    font-size: 12px;
    line-height: 1.6;
}

.validation-alert {
    margin-top: 16px;
}

.validation-list {
    margin: 6px 0 0;
    padding-left: 16px;
    font-size: 12px;
    line-height: 1.7;
    overflow-wrap: anywhere;
}

.image-size-fields :deep(.config-files) {
    grid-column: 1 / -1;
}
</style>
