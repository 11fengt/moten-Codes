export interface AuthUser {
  id: number
  username: string
  role: 'editor' | 'admin'
}

interface LoginData {
  token: string
  user: AuthUser
}

// 统一检查接口响应，避免将空响应或 HTML 当成 JSON。
async function readResponse<T>(
  response: Response,
): Promise<T> {
  const contentType =
    response.headers.get('content-type')

  if (!contentType?.includes('application/json')) {
    throw new Error(
      `接口未返回 JSON（HTTP ${response.status}），请检查后端和代理`,
    )
  }

  let result: {
    message?: string
    data?: T
  } | null

  try {
    result = await response.json()
  } catch {
    throw new Error(
      `接口返回的 JSON 无法解析（HTTP ${response.status}）`,
    )
  }

  if (!response.ok) {
    throw new Error(
      result?.message ||
      `请求失败（HTTP ${response.status}）`,
    )
  }

  if (!result?.data) {
    throw new Error('接口缺少业务数据')
  }

  return result.data
}

// TypeScript 类型之外，再检查接口实际返回的数据。
function isAuthUser(value: unknown): value is AuthUser {
  if (
    typeof value !== 'object' ||
    value === null
  ) {
    return false
  }

  const user = value as Record<string, unknown>

  return (
    typeof user.id === 'number' &&
    Number.isSafeInteger(user.id) &&
    user.id > 0 &&
    typeof user.username === 'string' &&
    (
      user.role === 'editor' ||
      user.role === 'admin'
    )
  )
}

export async function loginUser(
  username: string,
  password: string,
): Promise<LoginData> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username,
      password,
    }),
  })

  const data = await readResponse<LoginData>(response)

  if (
    typeof data.token !== 'string' ||
    !data.token ||
    !isAuthUser(data.user)
  ) {
    throw new Error('接口返回的登录数据不正确')
  }

  return data
}

// 注册只创建账号；成功后仍使用原来的登录流程获取 JWT。
export async function registerUser(
  username: string,
  password: string,
): Promise<AuthUser> {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  })

  const data = await readResponse<{ user: AuthUser }>(response)

  if (!isAuthUser(data.user)) {
    throw new Error('接口返回的注册数据不正确')
  }

  return data.user
}

export async function getCurrentUser(
  token: string,
): Promise<AuthUser | null> {
  const response = await fetch('/api/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  })

  // 凭证无效或过期，需要结束当前登录状态。
  if (response.status === 401) {
    return null
  }

  const data = await readResponse<{
    user: AuthUser
  }>(response)

  if (!isAuthUser(data.user)) {
    throw new Error('接口返回的用户信息不正确')
  }

  return data.user
}
