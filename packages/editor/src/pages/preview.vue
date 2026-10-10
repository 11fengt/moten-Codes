<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ElButton,
  ElEmpty,
  ElOption,
  ElSelect,
} from 'element-plus'
import type { SavedPage, Viewport } from '@/types/edit'
import { loadPage } from '@/utils/storage'
import { PageRender } from '@learn-moten/materials'
import HomeBack from '@/components/HomeBack.vue'

const router = useRouter()
const route = useRoute()

const record = ref<SavedPage | null>(null)
const errorMessage = ref('')

const viewport = ref<Viewport>(
  route.query.viewport === 'mobile' ? 'mobile' : 'desktop',
)

try {
  record.value = loadPage()
} catch (error) {
  errorMessage.value =
    error instanceof Error
      ? error.message
      : '读取预览内容失败'
}

function backToEdit() {
  router.push({ name: 'edit' })
}
</script>

<template>
  <div class="preview">
    <header class="preview-header">
      <div class="header-left">
        <HomeBack />
        <ElButton @click="backToEdit">
          返回编辑器
        </ElButton>

        <strong class="page-name">
          {{ record?.pageName || '页面预览' }}
        </strong>
      </div>

      <div class="header-right">
        <span class="preview-tip">
          展示最近一次保存的页面
        </span>

        <ElSelect
          v-model="viewport"
          class="viewport-select"
          aria-label="预览视口"
        >
          <ElOption label="桌面端" value="desktop" />
          <ElOption label="移动端" value="mobile" />
        </ElSelect>
      </div>
    </header>

    <main class="preview-workspace">
      <div
        v-if="record"
        class="preview-sheet"
        :class="{ 'is-mobile': viewport === 'mobile' }"
      >
        <PageRender
          :content="record.content"
          :viewport="viewport"
        />
      </div>

      <ElEmpty
        v-else
        :description="
          errorMessage ||
          '暂无已保存页面，请返回编辑器先保存'
        "
      >
        <ElButton type="primary" @click="backToEdit">
          返回编辑器
        </ElButton>
      </ElEmpty>
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

.preview-sheet > :deep(.page-render) {
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


@media (max-width: 640px) {
  .preview-header {
    height: auto;
    min-height: 64px;
    padding: 12px;
    flex-wrap: wrap;
  }

  .preview-header .header-left {
    gap: 8px;
  }

  .preview-header .header-right {
    margin-left: auto;
  }
}
</style>