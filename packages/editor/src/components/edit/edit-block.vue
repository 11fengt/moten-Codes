<script setup lang="ts">
import { ref } from 'vue'
import { ElCollapse, ElCollapseItem } from 'element-plus'
import { Icon } from '@iconify/vue'
import { baseBlocks, seniorBlocks, markdownBlocks } from '@/config/block'
import iconConfig from '@/config/icon'
import EditBlockDrag from './edit-block-drag.vue'

const activeNames = ref(['base', 'layout', 'markdown'])
const baseBlockList = ref(baseBlocks)
const seniorBlockList = ref(seniorBlocks)
const markdownBlockList = ref(markdownBlocks)
</script>

<template>
    <aside class="edit-block">
        <h2 class="panel-title">组件物料</h2>
        <p class="panel-description">自由组合，搭建页面</p>

        <ElCollapse v-model="activeNames">
            <ElCollapseItem title="基础组件" name="base">
                <EditBlockDrag :list="baseBlockList" />
            </ElCollapseItem>
            <ElCollapseItem title="布局组件" name="layout">
                <EditBlockDrag :list="seniorBlockList" />
            </ElCollapseItem>
            <ElCollapseItem title="Markdown组件" name="markdown">
                <EditBlockDrag :list="markdownBlockList" />
            </ElCollapseItem>
        </ElCollapse>
    </aside>
</template>

<style scoped>
.edit-block {
    padding: 24px 20px;
    overflow-y: auto;
    background: white;
    border-right: 1px solid var(--color-border);
    min-width: 0;
    min-height: 0;
}

.panel-title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
}

.panel-description {
    margin: 10px 0 28px;
    font-size: 12px;
    color: #8a94a6;
}


:deep(.el-collapse) {
    border: 0;
}

:deep(.el-collapse-item__header) {
    font-size: 13px;
    color: #667085;
}

:deep(.el-collapse-item__wrap) {
    border-bottom: 0;
}

:deep(.el-collapse-item__content) {
    padding-bottom: 12px;
}
</style>