import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { ElMessage } from 'element-plus'
import { setSessionExpiredHandler } from '@/api/request'
import './style.css'
import 'element-plus/dist/index.css'
import './style.css'


const app = createApp(App)

app.use(createPinia())

setSessionExpiredHandler(async () => {
  const currentRoute = router.currentRoute.value

  if (currentRoute.name === 'login') return

  try {
    await router.replace({
      name: 'login',
      query: {
        reason: 'expired',
        redirect: currentRoute.fullPath,
      },
    })
  } catch {
    ElMessage.error('登录已失效，请打开登录页面重新登录')
  }
})

app.use(router)

app.mount('#app')
