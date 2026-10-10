<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'
import {
  ElFormItem,
  ElUpload,
  ElButton,
  ElInput,
  ElMessage,
} from 'element-plus'
import type { UploadFile, UploadInstance } from 'element-plus'
import type { TString } from '@sinclair/typebox'

defineProps<{
  schema: TString
}>()

const value = defineModel<string>({ required: true })

const uploadRef = ref<UploadInstance>()
const reading = ref(false)

let reader: FileReader | undefined
let disposed = false

function handleImageChange(file: UploadFile) {
  const raw = file.raw

  uploadRef.value?.clearFiles()

  if (!raw || reading.value) return

  const allowedTypes = [
    'image/png',
    'image/jpeg',
    'image/webp',
  ]

  if (!allowedTypes.includes(raw.type)) {
    ElMessage.error('请选择 PNG、JPEG 或 WebP 图片')
    return
  }

  if (raw.size > 1024 * 1024) {
    ElMessage.error('图片大小不能超过 1MB')
    return
  }

  const taskReader = new FileReader()
  reader = taskReader
  reading.value = true

  taskReader.onload = () => {
    if (disposed) return

    if (typeof taskReader.result !== 'string') {
      ElMessage.error('图片读取失败，请重新选择')
      return
    }

    value.value = taskReader.result
    ElMessage.success('图片已替换')
  }

  taskReader.onerror = () => {
    if (!disposed) {
      ElMessage.error('图片读取失败，请重新选择')
    }
  }

  taskReader.onloadend = () => {
    if (disposed) return

    reading.value = false
    reader = undefined
  }

  taskReader.readAsDataURL(raw)
}

onBeforeUnmount(() => {
  disposed = true
  reader?.abort()
})
</script>

<template>
  <div class="config-files">
    <ElFormItem :label="schema.title">
      <ElUpload
        ref="uploadRef"
        :auto-upload="false"
        :show-file-list="false"
        :disabled="reading"
        :on-change="handleImageChange"
        accept="image/png,image/jpeg,image/webp"
        class="image-upload"
      >
        <ElButton
          type="primary"
          plain
          :loading="reading"
          class="upload-button"
        >
          {{ value ? '替换图片' : '选择图片' }}
        </ElButton>
      </ElUpload>
    </ElFormItem>

    <p class="file-tip">
      支持 PNG、JPEG、WebP，单张不超过 1MB。
    </p>

    <ElFormItem
      v-if="!value.startsWith('data:')"
      label="图片地址（可选）"
    >
      <ElInput
        v-model="value"
        :disabled="reading"
        :placeholder="schema.placeholder"
        clearable
      />
    </ElFormItem>

    <div v-else class="local-image-info">
      <span>当前使用本地图片</span>

      <ElButton
        type="primary"
        link
        :disabled="reading"
        @click="value = ''"
      >
        清空并填写地址
      </ElButton>
    </div>
  </div>
</template>

<style scoped>
.config-files {
  min-width: 0;
}

.image-upload,
.upload-button {
  width: 100%;
}

.image-upload :deep(.el-upload) {
  width: 100%;
}

.file-tip {
  margin: 0 0 12px;
  color: #8a94a6;
  font-size: 12px;
  line-height: 1.6;
}

.local-image-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 20px;
  color: #8a94a6;
  font-size: 12px;
}
</style>