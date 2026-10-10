import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8082',
      },
    },
  },
})

// 浏览器
//   │ 请求 localhost:5173/api/pages
//   ↓
// Vite 开发服务器
//   │ 发现路径匹配 /api，转发请求
//   ↓
// Express：localhost:8082/api/pages
//   │ 执行列表接口，查询 MySQL
//   ↓
// 返回页面列表 JSON
//   ↓
// Vite 将响应传回浏览器