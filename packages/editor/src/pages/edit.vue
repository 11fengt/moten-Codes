<script setup lang="ts">
import {
  computed,
  ref,
  onMounted,
  onBeforeUnmount,
  watch,
} from 'vue'
import EditHeader from '@/components/edit/edit-header.vue'
import EditBlock from '@/components/edit/edit-block.vue'
import EditRender from '@/components/edit/edit-render.vue'
import EditConfig from '@/components/edit/edit-config.vue'
import { ElMessage, ElDrawer, ElEmpty, ElButton } from 'element-plus'
import { useEditStore } from '@/stores/edit'
import { useRoute, useRouter } from 'vue-router'
import { getPageById } from '@/api/page'
import { isSessionError } from '@/api/request'

const edit = useEditStore()
const route = useRoute()
const router = useRouter()

const documentLoading = ref(false)
const documentError = ref('')

watch(
  () => route.query.id,
  async (rawId, _oldId, onCleanup) => {
    // 离开页面或切换 ID 后，忽略这次请求的迟到结果。
    let expired = false
    onCleanup(() => {
      expired = true
    })

    documentLoading.value = false
    documentError.value = ''

    // 地址没有 ID：保留原来的本地恢复流程。
    if (rawId === undefined) {
      try {
        edit.restoreDocument()
      } catch (error) {
        ElMessage.error(
          error instanceof Error
            ? error.message
            : '本地页面恢复失败，当前页面保持不变',
        )
      }

      return
    }

    // 地址参数必须是单个正整数。
    if (
      typeof rawId !== 'string' ||
      !/^[1-9]\d*$/.test(rawId) ||
      !Number.isSafeInteger(Number(rawId))
    ) {
      documentError.value = '页面 ID 必须是正整数'
      return
    }

    const id = Number(rawId)

    // 当前 Store 已经打开这个页面时，保留正在编辑的内容。
    if (edit.serverPageId === id) {
      return
    }

    documentLoading.value = true
    try {
      const data = await getPageById(id)

      if (expired) return

      edit.applyDocument(
        data.document,
        data.id,
      )
    } catch (error) {
      if (expired || isSessionError(error)) return

      documentError.value =
        error instanceof Error
          ? error.message
          : '页面加载失败'
    } finally {
      if (!expired) {
        documentLoading.value = false
      }
    }
  },
  {
    immediate: true,
  },
)


// 抽屉组件
const widthQuery = window.matchMedia(
  '(max-width: 1023px)',
)
const isNarrow = ref(widthQuery.matches)
const drawerVisible = computed<boolean>({
  get() {
    return edit.configPanelShow
  },
  set(value) {
    edit.setConfigPanelShow(value)
  },
})

function updateLayout() {
  isNarrow.value = widthQuery.matches
  edit.setConfigPanelShow(false)
}

onMounted(() => {
  widthQuery.addEventListener('change', updateLayout)
})

onBeforeUnmount(() => {
  widthQuery.removeEventListener('change', updateLayout)
})
</script>

<template>
  <div class="edit">
    <div
      v-if="documentLoading"
      class="document-state"
      role="status"
    >
      <p>正在加载服务器页面…</p>
    </div>

    <div
      v-else-if="documentError"
      class="document-state"
    >
      <ElEmpty description="页面加载失败" />

      <p class="document-error">
        {{ documentError }}
      </p>

      <ElButton
        type="primary"
        @click="router.push({ name: 'pages' })"
      >
        返回页面管理
      </ElButton>
    </div>

    <template v-else>
      <EditHeader :compact="isNarrow" />

      <div
        class="container"
        :class="{ 'is-narrow': isNarrow }"
      >
        <EditBlock />

        <EditRender />

        <EditConfig v-if="!isNarrow" />
      </div>

      <ElDrawer
        v-if="isNarrow"
        v-model="drawerVisible"
        title="属性设置"
        direction="rtl"
        size="min(320px, 100vw)"
        class="config-drawer"
        append-to-body
        destroy-on-close
      >
        <EditConfig />
      </ElDrawer>
    </template>
  </div>
</template>

<style scoped>
.edit {
  height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.container {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-columns:
    var(--edit-block-width) minmax(0, 1fr) var(--edit-config-width);
}

.container.is-narrow {
  grid-template-columns:
    var(--edit-block-width)
    minmax(0, 1fr);
}

.config-drawer :deep(.el-drawer__header) {
  margin-bottom: 0;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border);
}

.config-drawer :deep(.el-drawer__body) {
  padding: 0;
  min-height: 0;
  overflow: hidden;
}

.config-drawer :deep(.edit-config) {
  height: 100%;
  border-left: 0;
}

.document-state {
  flex: 1;
  min-height: 0;
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--color-bg);
}

.document-error {
  max-width: 600px;
  margin: 0 0 20px;
  color: #f56c6c;
  text-align: center;
  overflow-wrap: anywhere;
}
</style>
