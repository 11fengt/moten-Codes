<script setup lang="ts">
import { ref } from 'vue'
import {
  ElButton,
  ElMessage,
  ElOption,
  ElSelect,
} from 'element-plus'

import {
  parsePage,
  PageRender,
  type SavedPage,
  type Viewport,
} from '@learn-moten/materials'

const viewport = ref<Viewport>('desktop')

const record = ref<SavedPage>({
  version: 1,
  pageName: '未命名页面',
  content: {
    block: [],
    page: {
      background: {
        desktop: '#ffffff',
        mobile: '#ffffff',
      },
    },
  },
})



const importInput = ref<HTMLInputElement | null>(null)
function openImport() {
  importInput.value?.click()
}

async function importDocument() {
  const input = importInput.value
  const file = input?.files?.[0]

  // 允许再次选择同一个文件。
  if (input) {
    input.value = ''
  }

  if (!file) return

  try {
    const raw = await file.text()

    // 此时只处理临时数据，还没有修改正在显示的页面。
    const nextRecord = parsePage(raw)

    // 全部检查通过后，才替换页面。
    record.value = nextRecord

    ElMessage.success(`已加载“${nextRecord.pageName}”`)
  } catch (error) {
    ElMessage.error(
      error instanceof Error
        ? error.message
        : '读取文件失败，请重试',
    )
  }
}
</script>

<template>
  <div class="preview">
    <header class="preview-header">
      <div class="header-left">
        <strong>页面预览</strong>

        <span class="page-name">
          {{ record.pageName }}
        </span>
      </div>

      <div class="header-right">
        <ElButton type="primary" @click="openImport">
          导入 JSON
        </ElButton>
        <ElSelect v-model="viewport" class="viewport-select" aria-label="预览视口">
          <ElOption label="桌面端" value="desktop" />
          <ElOption label="移动端" value="mobile" />
        </ElSelect>
      </div>
    </header>

    <input ref="importInput" type="file" accept=".json,application/json" hidden @change="importDocument" />

    <main class="preview-workspace">
      <div class="preview-sheet" :class="{ 'is-mobile': viewport === 'mobile' }">
        <PageRender :content="record.content" :viewport="viewport" />

        <p v-if="!record.content.block.length" class="empty-tip">
          当前页面暂无组件，可导入页面 JSON
        </p>
      </div>
    </main>
  </div>
</template>

<style scoped>
.preview {
  min-height: 100dvh;
  background: var(--color-bg);
}

.preview-header {
  height: var(--edit-header-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 24px;
  background: white;
  border-bottom: 1px solid var(--color-border);
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
}

.page-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-tip {
  color: #8a94a6;
  font-size: 13px;
}

.viewport-select {
  width: 112px;
  flex-shrink: 0;
}

.preview-workspace {
  padding: 24px;
}

.preview-sheet {
  width: 100%;
  height: auto;
  min-height: calc(100dvh - var(--edit-header-height) - 48px);
  box-shadow: 0 2px 12px rgb(0 0 0 / 4%);
}

.preview-sheet> :deep(.page-render) {
  min-height: calc(100dvh - var(--edit-header-height) - 48px);
}

.preview-sheet.is-mobile {
  width: 375px;
  max-width: 100%;
  margin: 0 auto;
}

@media (max-width: 640px) {
  .preview-header {
    padding: 0 12px;
  }

  .preview-tip {
    display: none;
  }

  .preview-workspace {
    padding: 24px 12px;
  }
}

.preview-sheet {
  position: relative;
}

.empty-tip {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  margin: 0;
  color: #8a94a6;
  font-size: 14px;
  pointer-events: none;
}

.header-left > strong,
.header-right {
  flex-shrink: 0;
}

@media (max-width: 640px) {
  .preview-header {
    height: auto;
    min-height: var(--edit-header-height);
    flex-wrap: wrap;
    gap: 12px;
    padding: 12px;
  }

  .header-left {
    flex: 1 1 100%;
  }
}
</style>