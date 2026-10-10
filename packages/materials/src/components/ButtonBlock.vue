<script setup lang="ts">
import { computed } from 'vue'
import type { BlockFormData, Viewport } from '../types'

const props = withDefaults(
  defineProps<{
    data: BlockFormData
    viewport: Viewport
    mode?: 'edit' | 'preview'
  }>(),
  {
    mode: 'edit',
  },
)

const href = computed(() => {
  const raw = props.data.href?.[props.viewport] ?? ''

  try {
    // new URL() 检查地址：只有可解析的 HTTP、HTTPS 地址才参与跳转；填写过程中地址不完整时，组件也能正常显示
    const url = new URL(raw)

    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return url.href
    }
  } catch {
    return ''
  }

  return ''
})

function handleClick(event: MouseEvent) {
  if (props.mode === 'edit' || !href.value) {
    event.preventDefault()
  }
}
</script>

<template>
  <div
    class="button-block"
    :class="{ 'is-preview': mode === 'preview' }"
    :style="{
      fontSize: (data.fontSize?.[viewport] ?? 16) + 'px',
    }"
  >
    <a
      class="action-link"
      :href="mode === 'preview' ? href || undefined : undefined"
      :style="{
        color: data.color?.[viewport] ?? '#ffffff',
      }"
      target="_blank"
      rel="noopener noreferrer"
      @click="handleClick"
    >
      {{ data.text?.[viewport] || '查看详情' }}
    </a>
  </div>
</template>

<style scoped>
.button-block {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  padding: 12px 10px;
}

.action-link {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  max-width: 100%;
  min-height: 40px;
  padding: 10px 20px;
  border: 1px solid transparent;
  border-radius: 12px;
  background: #40a0ff9d;
  font-size: inherit;
  line-height: 1.4;
  text-align: center;
  text-decoration: none;
  overflow-wrap: anywhere;
  cursor: inherit;
  transition:
    filter 0.16s,
    box-shadow 0.16s;
}

.is-preview .action-link {
  cursor: pointer;
}

.is-preview .action-link:hover {
  filter: brightness(0.95);
  box-shadow: 0 3px 10px rgb(64 158 255 / 20%);
}

.action-link:focus-visible {
  outline: 2px solid #40a0ff9d;
  outline-offset: 3px;
}
</style>