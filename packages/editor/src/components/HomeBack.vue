<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <button
    type="button"
    class="home-back"
    title="返回主页面"
    aria-label="返回主页面"
    @click="router.push({ name: 'home' })"
  >
    <span class="back-icon" aria-hidden="true">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="m14 6-6 6 6 6" />
      </svg>
    </span>

    <span>主页面</span>
  </button>
</template>

<style scoped>
.home-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: #1f2329;
  font: inherit;
  font-size: 16px;
  cursor: pointer;
}

.back-icon {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: #f0f1f2;
}

.back-icon svg {
  width: 20px;
  height: 20px;
}

.home-back:hover .back-icon {
  background: #e1e3e6;
}

.home-back:focus-visible {
  outline: 2px solid #409eff;
  outline-offset: 4px;
  border-radius: 6px;
}
</style>