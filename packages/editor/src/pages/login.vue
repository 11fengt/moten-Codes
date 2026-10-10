<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElButton, ElInput } from 'element-plus'
import { registerUser } from '@/api/auth'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 共用一个页面，通过模式决定显示登录还是注册表单。
const mode = ref<'login' | 'register'>('login')
const form = reactive({
  username: '',
  password: '',
  confirmPassword: '',
})
const submitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

function switchMode() {
  if (submitting.value) return

  mode.value = mode.value === 'login' ? 'register' : 'login'
  form.password = ''
  form.confirmPassword = ''
  errorMessage.value = ''
  successMessage.value = ''
}

async function submit() {
  if (submitting.value) return

  errorMessage.value = ''
  successMessage.value = ''
  const username = form.username.trim()

  if (!/^[A-Za-z0-9_]{3,32}$/.test(username)) {
    errorMessage.value = '用户名应为 3～32 位字母、数字或下划线'
    return
  }

  if (form.password.length < 12 || form.password.length > 128) {
    errorMessage.value = '密码长度应为 12～128 位'
    return
  }

  if (
    mode.value === 'register' &&
    form.password !== form.confirmPassword
  ) {
    errorMessage.value = '两次输入的密码不一致'
    return
  }

  submitting.value = true

  try {
    if (mode.value === 'register') {
      const user = await registerUser(username, form.password)

      // 注册成功后保留用户名，清空密码，让用户按原流程登录。
      form.username = user.username
      form.password = ''
      form.confirmPassword = ''
      mode.value = 'login'
      successMessage.value = '注册成功，请使用新账号登录'
      return
    }

    const success = await userStore.login(username, form.password)
    if (!success) return

    form.password = ''
    // 只返回应用内已知的受保护页面，不能跳往任意外部地址。
    const redirect = route.query.redirect
    if (
      typeof redirect === 'string' &&
      redirect.startsWith('/') &&
      !redirect.startsWith('//')
    ) {
      const target = router.resolve(redirect)
      if (target.meta.requiresAuth) {
        await router.replace(target.fullPath)
        return
      }
    }

    await router.replace({ name: 'home' })
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : mode.value === 'register'
          ? '注册失败，请重试'
          : '登录失败，请重试'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <main class="auth-main">
      <div class="auth-layout">
        <section class="project-intro" aria-labelledby="project-title">
          <div class="project-brand">
            <img src="/images/logo.svg" alt="" class="project-logo" />
            <span>低代码页面搭建平台</span>
          </div>

          <h1 id="project-title">
            <span>A low code project</span>
            <strong>Moten Codes</strong>
          </h1>

          <p class="project-description">
            一款低代码开发平台：通过图形化拖拽组合组件，
            配置参数完成页面搭建，让想法更快成为作品。
            减少重复开发，专注内容与创意。
          </p>
        </section>

        <section class="auth-card" aria-labelledby="auth-title">
          <h2 id="auth-title">{{ mode === 'login' ? '登录' : '注册' }}</h2>

          <p v-if="route.query.reason === 'expired'" class="session-notice" role="status">
            登录已失效，请重新登录后继续操作
          </p>

          <form @submit.prevent="submit">
            <div class="form-field">
              <label for="auth-username">用户名</label>
              <ElInput
                id="auth-username"
                v-model="form.username"
                autocomplete="username"
                placeholder="请输入用户名"
                :maxlength="32"
                :disabled="submitting"
                :aria-describedby="mode === 'register' ? 'username-hint' : undefined"
              />
              <p v-if="mode === 'register'" id="username-hint" class="field-hint">
                3～32 位字母、数字或下划线
              </p>
            </div>

            <div class="form-field">
              <label for="auth-password">密码</label>
              <ElInput
                id="auth-password"
                v-model="form.password"
                type="password"
                show-password
                :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
                placeholder="请输入密码"
                :maxlength="128"
                :disabled="submitting"
                :aria-describedby="mode === 'register' ? 'password-hint' : undefined"
              />
              <p v-if="mode === 'register'" id="password-hint" class="field-hint">
                密码长度为 12～128 位
              </p>
            </div>

            <div v-if="mode === 'register'" class="form-field">
              <label for="auth-confirm-password">确认密码</label>
              <ElInput
                id="auth-confirm-password"
                v-model="form.confirmPassword"
                type="password"
                show-password
                autocomplete="new-password"
                placeholder="请再次输入密码"
                :maxlength="128"
                :disabled="submitting"
              />
            </div>

            <p v-if="errorMessage" class="form-message is-error" role="alert">
              {{ errorMessage }}
            </p>
            <p v-if="successMessage" class="form-message is-success" role="status">
              {{ successMessage }}
            </p>

            <ElButton
              class="submit-button"
              type="primary"
              native-type="submit"
              :loading="submitting"
              :disabled="submitting"
            >
              {{ mode === 'login' ? '登录' : '注册' }}
            </ElButton>

            <div class="mode-switch">
              <span v-if="mode === 'register'">已有账号？</span>
              <button type="button" :disabled="submitting" @click="switchMode">
                {{ mode === 'login' ? '注册' : '返回登录' }}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>

    <footer class="auth-footer">
      <div class="footer-content">
        <span>Design &amp; Code by</span>
        <span><strong>tengf</strong><span class="footer-dot">·</span>全栈（主前端）开发</span>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background: #f8f9fb;
  color: #111827;
}

.auth-main {
  flex: 1;
  display: flex;
  align-items: center;
  padding: 64px 40px;
}

.auth-layout {
  width: 100%;
  max-width: 1320px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  align-items: center;
  gap: 100px;
}

.project-brand {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
  color: #64748b;
  font-size: 23px;
  letter-spacing: 2px;
}

.project-logo {
  width: 64px;
  height: 64px;
  object-fit: contain;
}

.project-intro h1 {
  margin: 0;
  font-size: clamp(36px, 3.2vw, 60px);
  font-weight: 750;
  line-height: 1.12;
  letter-spacing: -1.5px;
}

.project-intro h1 span,
.project-intro h1 strong {
  display: block;
}

.project-intro h1 strong {
  margin-top: 4px;
  color: #2563eb;
  font-weight: inherit;
}

.project-description {
  max-width: 650px;
  margin: 32px 0 0;
  color: #526071;
  font-size: 18px;
  line-height: 1.9;
}

.auth-card {
  width: 100%;
  padding: 40px;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 4px 10px rgb(15 23 42 / 9%);
}

.auth-card h2 {
  margin: 0 0 30px;
  font-size: 28px;
  font-weight: 650;
}

.form-field {
  margin-bottom: 24px;
}

.session-notice {
  margin: -10px 0 24px;
  padding: 10px 12px;
  border-radius: 6px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 14px;
}

.form-field label {
  display: block;
  margin-bottom: 10px;
  color: #526071;
  font-size: 16px;
}

.form-field :deep(.el-input__wrapper) {
  min-height: 46px;
  padding: 0 14px;
  border-radius: 8px;
  background: #f8fafc;
  box-shadow: none;
}

.form-field :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #cbd5e1 inset;
}

.form-field :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #2563eb inset;
}

.form-field :deep(.el-input__inner) {
  font-size: 15px;
  color: #1f2937;
}

.form-field :deep(.el-input__inner::placeholder) {
  color: #9ca3af;
}

.field-hint {
  margin: 8px 0 0;
  color: #64748b;
  font-size: 12px;
}

.form-message {
  margin: 0 0 18px;
  font-size: 14px;
  overflow-wrap: anywhere;
}

.is-error {
  color: #dc2626;
}

.is-success {
  color: #15803d;
}

.submit-button {
  width: 100%;
  height: 44px;
  margin-top: 8px;
  border-color: #2563eb;
  border-radius: 8px;
  background: #2563eb;
  font-size: 15px;
}

.submit-button:hover,
.submit-button:focus-visible {
  border-color: #1d4ed8;
  background: #1d4ed8;
}

.submit-button.is-disabled {
  border-color: #93b4f5;
  background: #93b4f5;
}

.mode-switch {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-top: 18px;
  color: #64748b;
  font-size: 14px;
}

.mode-switch button {
  padding: 4px 8px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: #2563eb;
  font: inherit;
  cursor: pointer;
}

.mode-switch button:hover {
  color: #1d4ed8;
  text-decoration: underline;
}

.mode-switch button:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}

.mode-switch button:disabled {
  opacity: 0.5;
  cursor: wait;
}

.auth-footer {
  padding: 24px 40px;
  border-top: 1px solid #e5e7eb;
  background: #fff;
}

.footer-content {
  max-width: 1320px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  gap: 16px;
  color: #64748b;
  font-size: 14px;
}

.footer-content strong {
  color: #334155;
  font-weight: 600;
}

.footer-dot {
  margin: 0 10px;
  color: #94a3b8;
}

@media (max-width: 1100px) {
  .auth-layout {
    gap: 48px;
  }

  .auth-card {
    padding: 32px;
  }
}

@media (max-width: 760px) {
  .auth-main {
    padding: 36px 20px;
  }

  .auth-layout {
    max-width: 520px;
    grid-template-columns: minmax(0, 1fr);
    gap: 32px;
  }

  .project-brand {
    margin-bottom: 20px;
    font-size: 23px;
  }

  .project-logo {
    width: 48px;
    height: 48px;
  }

  .project-intro h1 {
    font-size: clamp(30px, 6.5vw, 42px);
    letter-spacing: -0.8px;
  }

  .project-description {
    margin-top: 20px;
    font-size: 15px;
  }

  .auth-card {
    padding: 28px 24px;
  }

  .auth-footer {
    padding: 20px;
  }

  .footer-content {
    flex-wrap: wrap;
    justify-content: center;
    font-size: 12px;
    text-align: center;
  }
}
</style>
