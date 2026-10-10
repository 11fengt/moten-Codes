import { useUserStore } from '@/stores/user'

interface ApiResponse<T> {
  message?: string
  data?: T
}

// 由 main.ts 负责导航，避免请求模块直接依赖 Router。
let sessionExpiredHandler: (() => Promise<void>) | undefined

export function setSessionExpiredHandler(handler: () => Promise<void>) {
  sessionExpiredHandler = handler
}

// 此类错误已由统一流程处理，组件不必再重复弹出错误提示。
export class SessionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SessionError'
  }
}

export function isSessionError(error: unknown): error is SessionError {
  return error instanceof SessionError
}

export async function authenticatedRequest<T>(
  url: string,
  options: RequestInit = {},
  fallbackMessage = '请求失败',
): Promise<ApiResponse<T>> {
  const userStore = useUserStore()
  const token = userStore.getToken()
  const version = userStore.sessionVersion

  function checkSession() {
    // 退出或重新登录后，旧请求不能再修改当前页面或用户状态。
    if (
      userStore.sessionVersion !== version ||
      userStore.getToken() !== token
    ) {
      throw new SessionError('登录状态已改变，已忽略旧请求的响应')
    }
  }

  async function expireSession(): Promise<never> {
    checkSession()
    // logout 会增加 sessionVersion，并发请求只会触发一次跳转。
    userStore.logout()
    await sessionExpiredHandler?.()
    throw new SessionError('登录已失效，请重新登录')
  }

  if (!token) {
    return expireSession()
  }

  const headers = new Headers(options.headers)
  headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(url, {
    ...options,
    headers,
    cache: 'no-store',
  })

  checkSession()

  // 优先处理 HTTP 状态，即使错误响应没有 JSON 也能正确退出登录。
  if (response.status === 401) {
    return expireSession()
  }

  if (response.status === 413) {
    throw new Error('页面数据过大，请减少图片或压缩后重试')
  }

  if (!response.headers.get('content-type')?.includes('application/json')) {
    throw new Error(
      `接口未返回 JSON（HTTP ${response.status}），请检查后端和代理配置`,
    )
  }

  let result: ApiResponse<T> | null

  try {
    result = await response.json()
  } catch {
    throw new Error(`接口返回的 JSON 无法解析（HTTP ${response.status}）`)
  }

  checkSession()

  if (!response.ok) {
    throw new Error(result?.message || fallbackMessage)
  }

  if (!result || typeof result !== 'object') {
    throw new Error('接口返回的数据格式不正确')
  }

  return result
}
