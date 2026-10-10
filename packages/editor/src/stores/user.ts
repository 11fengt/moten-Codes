import { defineStore } from 'pinia'
import {
  getCurrentUser,
  loginUser,
  type AuthUser,
} from '@/api/auth'

const TOKEN_KEY = 'learn-moten-token'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: '',
    user: null as AuthUser | null,

    // 防止退出后，旧请求又把用户状态恢复回来。
    sessionVersion: 0,
  }),

  actions: {
    // 内存状态尚未恢复时，也可以读取当前标签页保存的凭证。
    getToken(): string {
      return this.token || sessionStorage.getItem(TOKEN_KEY) || ''
    },

    async login(
      username: string,
      password: string,
    ): Promise<boolean> {
      const version = ++this.sessionVersion

      const data = await loginUser(
        username,
        password,
      )

      if (version !== this.sessionVersion) {
        return false
      }

      sessionStorage.setItem(
        TOKEN_KEY,
        data.token,
      )

      this.token = data.token
      this.user = data.user

      return true
    },

    async restoreSession(): Promise<boolean> {
      const version = this.sessionVersion

      const token = this.getToken()

      if (!token) {
        this.user = null
        return false
      }

      const user = await getCurrentUser(token)

      // 等待接口期间，可能已经退出或开始另一次登录。
      if (version !== this.sessionVersion) {
        return false
      }

      if (!user) {
        this.logout()
        return false
      }

      this.token = token
      this.user = user

      return true
    },

    logout() {
      sessionStorage.removeItem(TOKEN_KEY)

      this.sessionVersion += 1
      this.token = ''
      this.user = null
    },
  },
})
