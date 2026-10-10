<!-- 列表展示页面 -->

<script setup lang="ts">
import {
    computed,
    onBeforeUnmount,
    onMounted,
    ref,
} from 'vue'
import { useRouter } from 'vue-router'
import {
    ElButton,
    ElEmpty,
    ElPagination,
    ElSkeleton,
    ElTable,
    ElTableColumn,
    ElDialog,
    ElMessage,
    ElMessageBox,
} from 'element-plus'
import {
    getPageList,
    getPageById,
    deletePage,
    type PageListItem,
} from '@/api/page'
import { useEditStore } from '@/stores/edit'
import { isSessionError } from '@/api/request'

const router = useRouter()

// 当前页的页面记录。
const list = ref<PageListItem[]>([])

// 数据库中符合查询条件的记录总数。
const total = ref(0)

// 当前页码，以及每页显示多少条记录。
const page = ref(1)
const pageSize = 10

// 区分正在加载、请求失败和请求成功。
const loading = ref(true)
const errorMessage = ref('')

async function loadPages() {
    loading.value = true
    errorMessage.value = ''

    //   {
    //   list: [
    //     {
    //       id: 2,
    //       name: '活动介绍页',
    //       createdAt: '2026-10-09T02:00:00.000Z',
    //       updatedAt: '2026-10-09T03:00:00.000Z',
    //     },
    //   ],
    //   total: 1,
    //   page: 1,
    //   size: 10,
    // }
    try {
        const data = await getPageList(
            page.value,
            pageSize,
        )

        list.value = data.list
        total.value = data.total
    } catch (error) {
        if (isSessionError(error)) return

        errorMessage.value =
            error instanceof Error
                ? error.message
                : '获取页面列表失败'
    } finally {
        loading.value = false
    }
}

function changePage(value: number) {
    page.value = value
    loadPages()
}

// 把接口返回的时间转换为便于阅读的格式。
function formatTime(value: string) {
    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return '—'
    }

    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    })
}

onMounted(() => {
    loadPages()
})

function openPage(id: number) {
    router.push({
        name: 'edit',
        query: {
            id: String(id),
        },
    })
}




// 弹窗是否显示。
const jsonVisible = ref(false)

// 是否正在读取文档。
const jsonLoading = ref(false)

// 弹窗标题使用的页面名称。
const jsonTitle = ref('')

// 最终展示的 JSON 文本。
const jsonText = ref('')

// 请求失败时显示的原因。
const jsonError = ref('')

// 给每次请求编号，识别已经失效的响应。
let jsonRequest = 0

function invalidateJSON() {
    jsonRequest += 1
}

// 离开列表后，之前发出的请求结果不再使用。
onBeforeUnmount(invalidateJSON)

async function showJSON(id: number, name: string) {
    jsonRequest += 1
    const request = jsonRequest

    // 先打开弹窗，并显示加载状态。
    jsonVisible.value = true
    jsonLoading.value = true
    jsonTitle.value = name

    // 清除上一次查看的内容和错误。
    jsonText.value = ''
    jsonError.value = ''

    try {
        const data = await getPageById(id)

        // 弹窗已经关闭，或已经开始查看另一条记录。
        if (
            request !== jsonRequest ||
            !jsonVisible.value
        ) {
            return
        }

        jsonTitle.value = data.document.pageName

        jsonText.value = JSON.stringify(
            data.document,
            null,
            2,
        )
    } catch (error) {
        if (request !== jsonRequest || isSessionError(error)) return

        jsonError.value =
            error instanceof Error
                ? error.message
                : '读取页面 JSON 失败'
    } finally {
        if (request === jsonRequest) {
            jsonLoading.value = false
        }
    }
}


interface JsonToken {
    text: string
    kind: 'plain' | 'key' | 'string' | 'number' | 'literal'
}

const jsonTokens = computed<JsonToken[]>(() => {
    const source = jsonText.value
    const tokens: JsonToken[] = []

    // 匹配字符串、布尔值、null 和数字。
    const pattern =
        /"(?:\\.|[^"\\])*"|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g

    let offset = 0

    for (const match of source.matchAll(pattern)) {
        const start = match.index ?? 0
        const text = match[0]
        const end = start + text.length

        // 保留匹配片段前面的括号、逗号、空格和换行。
        if (start > offset) {
            tokens.push({
                text: source.slice(offset, start),
                kind: 'plain',
            })
        }

        let kind: JsonToken['kind']

        if (text.startsWith('"')) {
            // 引号内容后面紧跟冒号，说明它是字段名。
            kind = /^\s*:/.test(source.slice(end))
                ? 'key'
                : 'string'
        } else if (
            text === 'true' ||
            text === 'false' ||
            text === 'null'
        ) {
            kind = 'literal'
        } else {
            kind = 'number'
        }

        tokens.push({ text, kind })

        // 记住本次已经处理到哪里。
        offset = end
    }

    // 保留最后一段尚未加入的文本。
    if (offset < source.length) {
        tokens.push({
            text: source.slice(offset),
            kind: 'plain',
        })
    }

    return tokens
})


//删除记录
const edit = useEditStore()

// 正在处理删除的记录 ID。
const deletingId = ref<number | null>(null)

// 离开列表后，不再继续处理确认框或刷新列表。
let pageDisposed = false

onBeforeUnmount(() => {
    pageDisposed = true
})

async function removePage(id: number, name: string) {
    if (
        loading.value ||
        deletingId.value !== null
    ) {
        return
    }

    deletingId.value = id

    try {
        await ElMessageBox.confirm(
            `确定删除“${name}”（ID：${id}）吗？这会永久删除服务器中的页面记录。`,
            '删除页面',
            {
                confirmButtonText: '删除',
                cancelButtonText: '取消',
                type: 'warning',
                closeOnClickModal: false,
                distinguishCancelAndClose: true,
            },
        )

        if (pageDisposed) return

        await deletePage(id)

        // 如果删除的是当前正在编辑的服务器页面，
        // 保留画布内容，但解除服务器记录关联。
        if (edit.serverPageId === id) {
            edit.serverPageId = null
        }

        if (pageDisposed) return

        ElMessage.success('页面已从服务器删除')

        // 当前页最后一条被删除后，退回上一页。
        if (
            list.value.length === 1 &&
            page.value > 1
        ) {
            page.value -= 1
        }

        await loadPages()
    } catch (error) {
        if (
            error === 'cancel' ||
            error === 'close' ||
            isSessionError(error) ||
            pageDisposed
        ) {
            return
        }

        ElMessage.error(
            error instanceof Error
                ? error.message
                : '删除页面失败',
        )
    } finally {
        deletingId.value = null
    }
}
</script>

<template>
    <div class="pages-view">

        <main class="pages-main">
            <section class="pages-panel">
                <div class="panel-header">
                    <div>
                        <h2>页面列表</h2>

                        <p>
                            查看已保存到服务器的页面
                        </p>
                    </div>

                    <ElButton type="primary" :loading="loading" @click="loadPages">
                        刷新列表
                    </ElButton>
                </div>

                <!-- 请求未结束：显示加载占位。 -->
                <div v-if="loading" class="loading-state">
                    <ElSkeleton :rows="6" animated />
                </div>

                <!-- 请求失败：显示原因，并允许重新请求。 -->
                <div v-else-if="errorMessage" class="error-state">
                    <ElEmpty description="页面列表加载失败" />

                    <p class="error-message">
                        {{ errorMessage }}
                    </p>

                    <ElButton type="primary" @click="loadPages">
                        重新加载
                    </ElButton>
                </div>

                <!-- 请求成功：将记录交给表格展示。 -->
                <ElTable v-else :data="list" row-key="id" class="pages-table">
                    <ElTableColumn prop="id" label="ID" width="80" />

                    <ElTableColumn prop="name" label="页面名称" min-width="220" show-overflow-tooltip />

                    <ElTableColumn label="创建时间" width="190">
                        <template #default="{ row }">
                            {{ formatTime(row.createdAt) }}
                        </template>
                    </ElTableColumn>

                    <ElTableColumn label="更新时间" width="190">
                        <template #default="{ row }">
                            {{ formatTime(row.updatedAt) }}
                        </template>
                    </ElTableColumn>

                    <ElTableColumn label="操作" width="240" fixed="right">
                        <template #default="{ row }">
                            <ElButton size="small" @click="openPage(row.id)">
                                编辑
                            </ElButton>

                            <ElButton size="small" @click="showJSON(row.id, row.name)">
                                查看JSON
                            </ElButton>
                            <ElButton size="small" type="danger" :loading="deletingId === row.id"
                                :disabled="deletingId !== null" @click="removePage(row.id, row.name)">
                                删除
                            </ElButton>
                        </template>
                    </ElTableColumn>

                    <template #empty>
                        <ElEmpty description="暂无服务器页面" :image-size="90" />
                    </template>
                </ElTable>

                <div v-if="total > 0" class="pagination">
                    <ElPagination :current-page="page" :page-size="pageSize" :total="total" :pager-count="5"
                        :disabled="loading" layout="total, prev, pager, next" @update:current-page="changePage" />
                </div>

                <ElDialog v-model="jsonVisible" :title="`页面 JSON · ${jsonTitle}`" width="min(820px, calc(100vw - 32px))"
                    top="18vh" append-to-body destroy-on-close @close="invalidateJSON">
                    <div v-if="jsonLoading" class="json-loading">
                        <ElSkeleton :rows="8" animated />
                    </div>

                    <ElEmpty v-else-if="jsonError" :description="jsonError" />

                    <pre v-else class="json-code"><code><span v-for="(token, index) in jsonTokens" :key="index"
                :class="`json-${token.kind}`">{{ token.text }}</span></code></pre>

                    <template #footer>
                        <ElButton type="primary" @click="jsonVisible = false">
                            确定
                        </ElButton>
                    </template>
                </ElDialog>
            </section>
        </main>
    </div>
</template>

<style scoped>
.pages-view {
    min-height: 100vh;
    background: var(--color-bg);
}

.pages-header {
    height: var(--edit-header-height);
    padding: 0 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    background: white;
    border-bottom: 1px solid var(--color-border);
}

.pages-header h1 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
}

.pages-main {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 32px 24px;
}

.pages-panel {
    min-width: 0;
    padding: 24px;
    background: white;
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);
}

.panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 24px;
}

.panel-header h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
}

.panel-header p {
    margin: 6px 0 0;
    color: #8f959e;
    font-size: 14px;
}

.pages-table {
    width: 100%;
}

.loading-state {
    min-height: 300px;
    padding: 24px 0;
}

.error-state {
    min-height: 300px;
    padding-bottom: 24px;
    text-align: center;
}

.error-message {
    margin: 0 0 20px;
    color: #f56c6c;
    overflow-wrap: anywhere;
}

.pagination {
    display: flex;
    justify-content: flex-end;
    padding-top: 24px;
    overflow-x: auto;
}

@media (max-width: 767px) {
    .pages-header {
        padding: 0 16px;
    }

    .pages-main {
        padding: 16px;
    }

    .pages-panel {
        padding: 16px;
    }

    .panel-header {
        flex-wrap: wrap;
    }

    .pagination {
        justify-content: flex-start;
    }
}

.json-loading {
    min-height: 260px;
    padding: 16px 0;
}

.json-code {
    max-height: 60vh;
    margin: 0;
    padding: 20px;
    overflow: auto;
    border-radius: 6px;
    background: #282c34;
    color: #abb2bf;
    font-family: Consolas, Monaco, monospace;
    font-size: 14px;
    line-height: 1.7;
    white-space: pre;
    tab-size: 2;
}

.json-code code {
    font: inherit;
}

.json-key {
    color: #abb2bf;
}

.json-string {
    color: #98c379;
}

.json-number {
    color: #d19a66;
}

.json-literal {
    color: #c678dd;
}
</style>
