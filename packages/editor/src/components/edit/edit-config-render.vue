<script setup lang="ts">
import { computed, type Component } from 'vue'
import { ElForm } from 'element-plus'
import type { ConfigSchema } from '@learn-moten/materials'
import type { ConfigFormData, Viewport } from '@/types/edit'
import ConfigSlider from '@/components/config/config-slider.vue'
import ConfigInput from '@/components/config/config-input.vue'
import ConfigColor from '@/components/config/config-color.vue'
import ConfigFiles from '@/components/config/config-files.vue'

import ConfigSelect from '@/components/config/config-select.vue'

const props = defineProps<{
  schema: ConfigSchema
  data: ConfigFormData
  viewport: Viewport
}>()

const configComponentMap: Record<string, Component> = {
  'config-slider': ConfigSlider,
  'config-input': ConfigInput,
  'config-color': ConfigColor,
  'config-files': ConfigFiles,

  'config-select': ConfigSelect,
}

const fields = computed(() => {
  return Object.entries(props.schema.properties).map(
    ([key, fieldSchema]) => ({
      key: key as keyof ConfigFormData,
      schema: fieldSchema.properties[props.viewport],
      data: props.data[key as keyof ConfigFormData],
    }),
  )
})

// function updateField(
//   key: keyof ConfigFormData,
//   value: string | number,
// ) {
//   const data = props.data[key]

//   if (!data) return

//   // 内容字段：桌面端和移动端一起更新。
//   if (key === 'text' || key === 'src' || key === 'href') {
//     if (typeof value !== 'string') return

//     data.desktop = value
//     data.mobile = value
//     return
//   }

//   // 样式字段：只更新当前正在编辑的一端。
//   data[props.viewport] = value
// }
function updateField(
  key: keyof ConfigFormData,
  value: string | number,
) {
  const data = props.data[key]

  if (!data) return

  // 内容和样式统一同步两端。
  data.desktop = value
  data.mobile = value
}
</script>

<template>
  <ElForm label-position="top" class="edit-config-render">
    <template v-for="field in fields" :key="field.key">
      <component
        v-if="field.data"
        :is="configComponentMap[field.schema.code]"
        :model-value="field.data[viewport]"
        @update:model-value="updateField(field.key, $event)"
        :schema="field.schema"
      />
    </template>

    <slot />
  </ElForm>
</template>

<style scoped>
.edit-config-render {
  margin-top: 24px;
}

.edit-config-render :deep(.el-form-item__label) {
  color: var(--color-text);
  font-size: 13px;
}

.edit-config-render :deep(.el-input__wrapper) {
  background: var(--color-bg);
}
</style>