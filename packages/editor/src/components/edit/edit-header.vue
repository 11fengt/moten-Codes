<script setup lang="ts">
import { computed, ref, onBeforeUnmount } from 'vue'
import {
  ElButton,
  ElSelect,
  ElOption,
  ElMessage,
  ElDropdown,
  ElDropdownMenu,
  ElDropdownItem,
  ElMessageBox,
} from 'element-plus'
import { Icon } from '@iconify/vue'
import { useEditStore } from '@/stores/edit'
import type { Viewport, SavedPage } from '@/types/edit'
import { validateDocument, parsePage } from '@learn-moten/materials'
import { savePage } from '@/utils/storage'
import { downloadPageJSON } from '@/utils/file'
import { useRouter, useRoute } from 'vue-router'
import { savePageToServer } from '@/api/page'
import { isSessionError } from '@/api/request'
import HomeBack from '@/components/HomeBack.vue'
defineProps<{
  compact: boolean
}>()

const router = useRouter()
const route = useRoute()
const saving = ref(false)
function previewDocument() {
  router.push({
    name: 'preview',
    query: {
      viewport: edit.viewport,
    },
  })
}

const edit = useEditStore()

const importInput = ref<HTMLInputElement | null>(null)

let disposed = false

onBeforeUnmount(() => {
  disposed = true
})

const viewport = computed<Viewport>({
  get() {
    return edit.viewport
  },
  set(value) {
    edit.setViewport(value)
  },
})

// function checkDocument() {
//   const issue = validateDocument(
//     edit.blockConfig,
//     edit.pageConfig,
//     edit.pageName,
//   )

//   if (issue) {
//     if (issue.viewport) {
//       edit.setViewport(issue.viewport)
//     }

//     edit.setCurrentSelect(issue.nodeId)
//     ElMessage.error(issue.message)
//     return
//   }

//   ElMessage.success('页面校验通过')
// }

// getValidatedDocument()
//     ├─ 校验失败：定位错误，返回 null
//     └─ 校验成功：返回页面文档
//                     ├─ savePage()：写入本地存储
//                     └─ downloadPageJSON()：下载文件
function getValidatedDocument(): SavedPage | null {
  const issue = validateDocument(
    edit.blockConfig,
    edit.pageConfig,
    edit.pageName,
  )

  if (issue) {
    if (issue.viewport) {
      edit.setViewport(issue.viewport)
    }

    edit.setCurrentSelect(issue.nodeId)
    edit.setConfigPanelShow(true)
    ElMessage.error(issue.message)
    return null
  }

  return {
    version: 1,
    pageName: edit.pageName,
    content: {
      block: edit.blockConfig,
      page: edit.pageConfig,
    },
  }
}

function saveLocalDocument() {
  const record = getValidatedDocument()

  if (!record) return

  try {
    savePage(record)
    ElMessage.success('页面校验通过，已保存到本地')
  } catch (error) {
    if (
      error instanceof DOMException &&
      error.name === 'QuotaExceededError'
    ) {
      ElMessage.error(
        '保存失败：本地存储空间不足，请减少图片或压缩后重试',
      )
    } else {
      ElMessage.error(
        '保存失败，请检查浏览器是否允许本地存储',
      )
    }
  }
}

function exportDocument() {
  const record = getValidatedDocument()

  if (!record) return

  try {
    downloadPageJSON(record)
    ElMessage.success('已发起 JSON 文件下载')
  } catch {
    ElMessage.error('导出失败，请重试')
  }
}

function openImport() {
  importInput.value?.click()
}
async function importDocument() {
  const input = importInput.value
  const file = input?.files?.[0]

  // 清空选择，使再次选择同一个文件也能触发 change。
  if (input) {
    input.value = ''
  }

  if (!file) return

  try {
    const raw = await file.text()

    if (disposed) return

    // 先校验临时文档，此时不修改当前页面。
    const record = parsePage(raw)

    await ElMessageBox.confirm(
      `导入“${file.name}”会替换当前页面，尚未保存的修改将被覆盖。是否继续？`,
      '导入页面',
      {
        confirmButtonText: '替换页面',
        cancelButtonText: '取消',
        type: 'warning',
        closeOnClickModal: false,
        distinguishCancelAndClose: true,
      },
    )

    if (disposed) return

    // 只有校验通过并确认后，才更新 Store。
    edit.applyDocument(record)
    await router.replace({ name: 'edit' })

    ElMessage.success(
      '页面已导入，请点击保存后再预览',
    )
  } catch (error) {
    if (
      error === 'cancel' ||
      error === 'close' ||
      disposed
    ) {
      return
    }

    ElMessage.error(
      error instanceof Error
        ? error.message
        : '导入失败，请检查文件',
    )
  }
}

// 新建空白页函数
async function newDocument() {
  try {
    await ElMessageBox.confirm(
      '新建空白页会替换当前页面，尚未保存的修改将被覆盖。是否继续？',
      '新建空白页',
      {
        confirmButtonText: '新建',
        cancelButtonText: '取消',
        type: 'warning',
        closeOnClickModal: false,
        distinguishCancelAndClose: true,
      },
    )

    if (disposed) return

    edit.createBlankDocument()
    await router.replace({ name: 'edit' })

    ElMessage.success(
      '已新建空白页',
    )
  } catch (error) {
    if (
      error === 'cancel' ||
      error === 'close' ||
      disposed
    ) {
      return
    }

    ElMessage.error('新建页面失败，请重试')
  }
}

function handleMore(command: unknown) {
  if (command === 'export') {
    exportDocument()
  } else if (command === 'import') {
    openImport()
  } else if (command === 'new') {
    void newDocument()
  }
}

// 保存到服务器
async function saveDocument() {
  if (saving.value) return

  const current = getValidatedDocument()

  if (!current) return

  // 记住本次提交属于哪一个文档。
  const sourceTree = edit.blockConfig
  const sourceId = edit.serverPageId

  saving.value = true

  try {
    // 得到独立快照，固定本次提交的内容。
    const record = parsePage(
      JSON.stringify(current),
    )

    const result = await savePageToServer(
      record,
      sourceId,
    )

    // 等待期间如果新建、导入了另一份文档，
    // 不把旧请求返回的 ID 关联到新文档。
    if (
      edit.blockConfig !== sourceTree ||
      edit.serverPageId !== sourceId
    ) {
      if (!disposed) {
        ElMessage.success(
          '提交的页面已保存到服务器，当前文档保持不变',
        )
      }

      return
    }

    // 首次创建后，后续保存就能使用更新接口。
    edit.serverPageId = result.id

    if (disposed) return

    const warnings: string[] = []

    // 现有预览页读取本地记录，因此同步保存本次快照。
    try {
      savePage(record)
    } catch (error) {
      warnings.push(
        error instanceof DOMException &&
          error.name === 'QuotaExceededError'
          ? '本地空间不足，预览快照未更新'
          : '本地预览快照未更新',
      )
    }

    // 让刷新后的编辑页能按 ID 重新读取服务器记录。
    if (route.query.id !== String(result.id)) {
      try {
        const failure = await router.replace({
          name: 'edit',
          query: {
            ...route.query,
            id: String(result.id),
          },
        })

        if (failure) {
          warnings.push('地址未更新，请从页面管理重新打开')
        }
      } catch {
        warnings.push('地址未更新，请从页面管理重新打开')
      }
    }

    if (
      disposed ||
      edit.blockConfig !== sourceTree ||
      edit.serverPageId !== result.id
    ) {
      return
    }

    if (warnings.length) {
      ElMessage.warning(
        `页面已保存到服务器，但${warnings.join('；')}`,
      )
    } else {
      ElMessage.success(
        '页面已保存到服务器，本地预览快照已更新',
      )
    }
  } catch (error) {
    if (disposed || isSessionError(error)) return

    ElMessage.error(
      error instanceof Error
        ? `服务器保存失败：${error.message}`
        : '服务器保存失败，请重试',
    )
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <header class="edit-header">
    <div class="header-left">
      <HomeBack />
      <span class="divider"></span>
      <span class="page-name" :title="edit.pageName">
        {{ edit.pageName || '未命名页面' }}
      </span>
    </div>

    <div class="header-right">
      <div class="viewport-label">
        <Icon :icon="viewport === 'desktop'
          ? 'fluent:desktop-mac-32-regular'
          : 'fluent:phone-20-regular'
          " />

        <ElSelect v-model="viewport" class="viewport-select" aria-label="编辑视口">
          <ElOption label="桌面端" value="desktop" />
          <ElOption label="移动端" value="mobile" />
        </ElSelect>
      </div>

      <ElButton v-if="compact" @click="edit.setConfigPanelShow(true)">
        <Icon icon="fluent:settings-20-regular" class="action-icon" />
        <span>属性</span>
      </ElButton>


      <ElButton @click="previewDocument">
        <Icon icon="fluent:open-20-filled" class="action-icon" />
        <span>预览</span>
      </ElButton>

      <ElButton class="local-save-button" @click="saveLocalDocument">
        <Icon icon="fluent:document-save-20-regular" class="action-icon" />
        <span>保存到本地</span>
      </ElButton>

      <ElButton type="primary" :loading="saving" @click="saveDocument">
        <Icon icon="fluent:cloud-arrow-up-24-regular" class="action-icon" />

        <span>
          {{ saving ? '发布中' : '发布' }}
        </span>
      </ElButton>


      <ElDropdown trigger="click" placement="bottom-end" @command="handleMore">
        <ElButton>
          <span>更多</span>
          <Icon icon="fluent:chevron-down-16-regular" class="dropdown-arrow" />
        </ElButton>

        <template #dropdown>
          <ElDropdownMenu>
            <ElDropdownItem command="new" divided>
              <Icon icon="fluent:document-add-20-regular" class="action-icon" />
              <span>新建空白页</span>
            </ElDropdownItem>
            <ElDropdownItem command="export">
              <Icon icon="fluent:arrow-download-20-regular" class="action-icon" />
              <span>导出 JSON</span>
            </ElDropdownItem>
            <ElDropdownItem command="import">
              <Icon icon="fluent:arrow-upload-20-regular" class="action-icon" />
              <span>导入 JSON</span>
            </ElDropdownItem>
          </ElDropdownMenu>
        </template>
      </ElDropdown>
    </div>

    <input ref="importInput" type="file" accept=".json,application/json" hidden @change="importDocument" />
  </header>
</template>

<style scoped>
.edit-header {
  height: var(--edit-header-height);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: white;
  border-bottom: 1px solid var(--color-border);
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.brand {
  font-size: 22px;
  /* color: var(--color-primary); */
  color: rgba(0, 0, 255, 0.5)
}

.divider {
  height: 20px;
  border-left: 1px solid var(--color-border);
}

.viewport-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #8a94a6;
}

.viewport-label svg,
.action-icon {
  width: 18px;
  height: 18px;
}

.action-icon {
  margin-right: 6px;
}

.header-right :deep(.el-button + .el-button) {
  margin-left: 0;
}

.viewport-select {
  width: 112px;
}

.viewport-select :deep(.el-select__wrapper) {
  background: var(--color-bg);
}


.header-left {
  min-width: 0;
}

.page-name {
  max-width: 320px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-arrow {
  width: 16px;
  height: 16px;
  margin-left: 6px;
}

.header-right {
  flex-shrink: 0;
}


.brand {
  flex-shrink: 0;
  white-space: nowrap;
}

.page-name {
  min-width: 0;
}

@media (max-width: 1023px) {
  .edit-header {
    padding: 0 16px;
  }

  .header-left,
  .header-right {
    gap: 8px;
  }

  .brand {
    font-size: 18px;
  }

  .page-name {
    max-width: 120px;
  }
}

.local-save-button {
  background-color: #ecf5ff;
  border-color: #b3d8ff;
}
</style>
