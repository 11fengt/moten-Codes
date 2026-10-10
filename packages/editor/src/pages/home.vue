<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
    ElButton,
    ElMessage,
} from 'element-plus'
import { useUserStore } from '@/stores/user'
import Pages from './pages.vue'

const router = useRouter()
const userStore = useUserStore()

// 重复点击“我的页面”时，重新加载列表。
const listVersion = ref(0)

async function logout() {
    try {
        userStore.logout()

        await router.replace({
            name: 'login',
        })
    } catch (error) {
        ElMessage.error(
            error instanceof Error
                ? error.message
                : '退出登录失败',
        )
    }
}
</script>

<template>
    <div class="home">
        <header class="home-header">
            <div class="brand">
                <img src="/images/logo.svg" alt="" class="brand-logo" />

                <strong>Moten Codes</strong>

                <span class="platform-title">
                    低代码开发平台
                </span>
            </div>

            <div class="account-slot">
                <span class="account-name">
                    {{ userStore.user?.username }}
                </span>

                <ElButton size="small" @click="logout">
                    退出登录
                </ElButton>
            </div>
        </header>

        <div class="home-body">
            <aside class="home-sidebar">
                <nav class="home-nav" aria-label="主导航">
                    <button type="button" class="nav-item nav-create" title="创建设计"
                        @click="router.push({ name: 'edit' })">
                        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
                            stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <path d="m12 3 8 5-8 5-8-5 8-5Z" />
                            <path d="m4 12 8 5 8-5" />
                            <path d="m4 16 8 5 8-5" />
                        </svg>

                        <span class="nav-label">创建设计</span>
                    </button>

                    <button type="button" class="nav-item" title="页面预览" @click="router.push({ name: 'preview' })">
                        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
                            stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <path d="M2 12c2.5-4.5 5.8-7 10-7s7.5 2.5 10 7c-2.5 4.5-5.8 7-10 7S4.5 16.5 2 12Z" />
                            <circle cx="12" cy="12" r="3" />
                        </svg>

                        <span class="nav-label">页面预览</span>
                    </button>

                    <button type="button" class="nav-item is-active" aria-current="page" title="我的页面"
                        @click="listVersion++">
                        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
                            stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <path d="m3 10 9-7 9 7" />
                            <path d="M5 9v11h5v-6h4v6h5V9" />
                        </svg>

                        <span class="nav-label">我的页面</span>
                    </button>
                </nav>
            </aside>

            <main class="home-main">
                <Pages :key="listVersion" />
            </main>
        </div>
    </div>
</template>

<style scoped>
.home {
    height: 100dvh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: white;
}

.home-header {
    height: 84px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    padding: 12px 40px;
    border-bottom: 1px solid #dee0e3;
}

.brand {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 14px;
    white-space: nowrap;
}

.brand strong {
    font-size: 28px;
    font-weight: 600;
    color: #1f2329;
}

.platform-title {
    font-size: 24px;
    color: #606266;
}

.brand-logo {
    width: 45px;
    height: 45px;
    object-fit: contain;
    flex-shrink: 0;
}



.account-slot {
    min-width: 0;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 12px;
}

.account-name {
    max-width: 160px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #606266;
    font-size: 14px;
}

.home-body {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: 240px minmax(0, 1fr);
}

.home-sidebar {
    min-height: 0;
    padding: 18px 12px;
    overflow-y: auto;
    border-right: 1px solid #dee0e3;
}

.home-nav {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.nav-item {
    width: 100%;
    height: 50px;
    padding: 0 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 14px;
    border: 0;
    border-radius: 28px;
    background: transparent;
    color: #555;
    /* font: inherit; */
    font-size: 17px;
    white-space: nowrap;
    cursor: pointer;
    transition:
        background-color 0.16s,
        color 0.16s;
}

/* 普通入口：鼠标经过或当前选中。 */
.nav-item:hover,
.nav-item.is-active {
    background: #edeff2;
    color: #111;
}

/* 创建设计：默认浅蓝色。 */
.nav-create {
    background: #dff0ff;
    color: #409eff;
}

/* 创建设计：鼠标经过变为亮蓝色。 */
.nav-create:hover {
    background: #008cff;
    color: white;
}

.nav-item:focus-visible {
    outline: 2px solid #409eff;
    outline-offset: 3px;
}

.nav-icon {
    width: 26px;
    height: 26px;
    flex-shrink: 0;
}

.home-main {
    min-width: 0;
    min-height: 0;
    padding: 20px 24px;
    overflow: hidden;
}

@media (max-width: 767px) {
    .home-header {
        padding: 0 16px;
    }

    .platform-title,
    .account-name,
    .nav-label {
        display: none;
    }

    .home-body {
        grid-template-columns: 72px minmax(0, 1fr);
    }

    .home-sidebar {
        padding: 16px 8px;
    }

    .nav-item {
        padding: 0;
        justify-content: center;
    }

    .home-main {
        padding: 16px 12px;
    }

    .home-header {
        gap: 12px;
    }

    .brand strong {
        font-size: 20px;
    }

    .brand {
        gap: 8px;
    }

    .brand-logo {
        width: 32px;
        height: 32px;
    }
}
</style>