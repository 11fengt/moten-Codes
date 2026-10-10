import {
  createRouter,
  createWebHistory,
} from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

const router = createRouter({
  history: createWebHistory(
    import.meta.env.BASE_URL,
  ),

  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/pages/login.vue'),
    },
    {
      path: '/',
      name: 'home',
      component: () => import('@/pages/home.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/edit',
      name: 'edit',
      component: () => import('@/pages/edit.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/preview',
      name: 'preview',
      component: () => import('@/pages/preview.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/pages',
      name: 'pages',
      component: () => import('@/pages/pages.vue'),
      meta: {
        requiresAuth: true,
      },
    },
  ],
})

router.beforeEach(async (to) => {
  // 登录页面可以直接进入。
  if (!to.meta.requiresAuth) {
    return true
  }

  const userStore = useUserStore()
  const hadToken = Boolean(userStore.getToken())

  try {
    const loggedIn =
      await userStore.restoreSession()

    if (loggedIn) {
      return true
    }
  } catch (error) {
    ElMessage.error(
      error instanceof Error
        ? error.message
        : '无法确认登录状态，请稍后重试',
    )
  }

  return {
    name: 'login',
    query: {
      redirect: to.fullPath,
      reason: hadToken ? 'expired' : undefined,
    },
  }
})

export default router
