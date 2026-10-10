import assert from 'node:assert/strict'
import { after, before, beforeEach, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { createPinia, setActivePinia } from 'pinia'

// 通过 Vite 加载实际的 TypeScript 模块；只模拟浏览器存储和 HTTP 响应。
const originalFetch = globalThis.fetch
const storageDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage')
const storage = new Map()
let vite
let userStore
let api
let request
let expiredCalls = 0

before(async () => {
  Object.defineProperty(globalThis, 'sessionStorage', {
    configurable: true,
    value: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, String(value)),
      removeItem: key => storage.delete(key),
    },
  })

  vite = await createServer({
    configFile: false,
    root: fileURLToPath(new URL('..', import.meta.url)),
    resolve: { alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) } },
    server: { middlewareMode: true, hmr: false, watch: null },
    ssr: { noExternal: ['@learn-moten/materials'] },
    logLevel: 'error',
  })
  setActivePinia(createPinia())
  const { useUserStore } = await vite.ssrLoadModule('/src/stores/user.ts')
  userStore = useUserStore()
  request = await vite.ssrLoadModule('/src/api/request.ts')
  api = await vite.ssrLoadModule('/src/api/page.ts')
})

beforeEach(() => {
  storage.clear()
  userStore.$reset()
  userStore.token = 'test-token'
  userStore.user = { id: 1, username: 'tester', role: 'editor' }
  storage.set('learn-moten-token', 'test-token')
  expiredCalls = 0
  request.setSessionExpiredHandler(async () => { expiredCalls += 1 })
})

after(async () => {
  globalThis.fetch = originalFetch
  if (storageDescriptor) Object.defineProperty(globalThis, 'sessionStorage', storageDescriptor)
  else delete globalThis.sessionStorage
  await vite?.close()
})

const record = {
  version: 1,
  pageName: '测试页面',
  content: {
    block: [],
    page: { background: { desktop: '#ffffff', mobile: '#ffffff' } },
  },
}

test('all page operations carry JWT and preserve JSON headers and payloads', async () => {
  const calls = []
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options })
    const data = String(url).includes('?')
      ? { list: [], total: 0, page: 1, size: 10 }
      : options.method === 'POST' || options.method === 'PUT'
        ? { id: 7, pageName: record.pageName }
        : options.method === 'DELETE'
          ? { id: 7 }
          : { id: 7, document: record }
    return Response.json({ data })
  }

  await api.getPageList()
  assert.deepEqual((await api.getPageById(7)).document, record)
  await api.savePageToServer(record)
  await api.savePageToServer(record, 7)
  await api.deletePage(7)

  assert.deepEqual(calls.map(({ options }) => options.method ?? 'GET'), ['GET', 'GET', 'POST', 'PUT', 'DELETE'])
  for (const { options } of calls) {
    assert.equal(options.headers.get('Authorization'), 'Bearer test-token')
    assert.equal(options.cache, 'no-store')
    if (options.body) {
      assert.equal(options.headers.get('Content-Type'), 'application/json')
      assert.deepEqual(JSON.parse(options.body), record)
    }
  }
  assert.equal(expiredCalls, 0)
})

test('credentials can be read from sessionStorage before store restoration', async () => {
  userStore.token = ''
  globalThis.fetch = async (_url, options) => {
    assert.equal(options.headers.get('Authorization'), 'Bearer test-token')
    return Response.json({ data: {} })
  }
  await request.authenticatedRequest('/api/pages')
  assert.equal(expiredCalls, 0)
})

test('missing credentials clear state and request login without sending HTTP', async () => {
  userStore.token = ''
  storage.clear()
  globalThis.fetch = async () => { assert.fail('HTTP must not be sent without credentials') }
  await assert.rejects(request.authenticatedRequest('/api/pages'), request.isSessionError)
  assert.equal(userStore.user, null)
  assert.equal(expiredCalls, 1)
})

test('concurrent non-JSON 401 responses clear credentials and redirect only once', async () => {
  let release
  const gate = new Promise(resolve => { release = resolve })
  globalThis.fetch = async () => {
    await gate
    return new Response('', { status: 401 })
  }
  const replies = Promise.allSettled([
    request.authenticatedRequest('/api/pages'),
    request.authenticatedRequest('/api/pages/7'),
  ])
  release()
  for (const reply of await replies) {
    assert.equal(reply.status, 'rejected')
    assert.equal(request.isSessionError(reply.reason), true)
  }
  assert.equal(userStore.token, '')
  assert.equal(userStore.user, null)
  assert.equal(storage.has('learn-moten-token'), false)
  assert.equal(expiredCalls, 1)
})

for (const status of [200, 401]) {
  test(`late ${status} from an old session cannot overwrite or log out a new session`, async () => {
    let release
    globalThis.fetch = () => new Promise(resolve => { release = resolve })
    const pending = request.authenticatedRequest('/api/pages')
    userStore.sessionVersion += 1
    userStore.token = 'new-token'
    userStore.user = { id: 2, username: 'new_user', role: 'editor' }
    storage.set('learn-moten-token', 'new-token')
    release(Response.json({ data: { list: [] } }, { status }))

    await assert.rejects(pending, request.isSessionError)
    assert.equal(userStore.token, 'new-token')
    assert.equal(userStore.user.id, 2)
    assert.equal(storage.get('learn-moten-token'), 'new-token')
    assert.equal(expiredCalls, 0)
  })
}

test('a session change while reading JSON also discards the old result', async () => {
  let releaseBody
  let started
  const bodyStarted = new Promise(resolve => { started = resolve })
  globalThis.fetch = async () => ({
    status: 200,
    ok: true,
    headers: new Headers({ 'Content-Type': 'application/json' }),
    json: () => {
      started()
      return new Promise(resolve => { releaseBody = resolve })
    },
  })
  const pending = request.authenticatedRequest('/api/pages')
  await bodyStarted
  userStore.logout()
  releaseBody({ data: { list: [] } })
  await assert.rejects(pending, request.isSessionError)
  assert.equal(expiredCalls, 0)
})

test('403, 500, 413 and proxy failures preserve login state', async () => {
  for (const status of [403, 500, 413, 502]) {
    globalThis.fetch = async () => status === 502
      ? new Response('', { status })
      : Response.json({ message: '模拟接口错误' }, { status })
    await assert.rejects(request.authenticatedRequest('/api/pages'), error => {
      assert.equal(request.isSessionError(error), false)
      if (status === 413) assert.match(error.message, /页面数据过大/)
      if (status === 502) assert.match(error.message, /HTTP 502/)
      return true
    })
    assert.equal(userStore.token, 'test-token')
  }
  globalThis.fetch = async () => { throw new TypeError('network failure') }
  await assert.rejects(request.authenticatedRequest('/api/pages'), /network failure/)
  assert.equal(userStore.token, 'test-token')
  assert.equal(expiredCalls, 0)
})

test('failed authenticated saves do not retry POST or report success', async () => {
  let calls = 0
  globalThis.fetch = async () => {
    calls += 1
    return Response.json({ message: '登录已过期' }, { status: 401 })
  }
  await assert.rejects(api.savePageToServer(record), request.isSessionError)
  assert.equal(calls, 1)
  assert.equal(expiredCalls, 1)
})
