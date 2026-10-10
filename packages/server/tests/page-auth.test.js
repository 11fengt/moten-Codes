import assert from 'node:assert/strict'
import { after, before, beforeEach, test } from 'node:test'
import jwt from 'jsonwebtoken'
import { pool } from '../src/db.js'

// 使用独立测试密钥、内存数据和随机端口，不读取 .env，也不连接 MySQL。
const previousSecret = process.env.JWT_SECRET
process.env.JWT_SECRET = 'isolated-page-auth-test-secret-at-least-32-bytes'
const secret = process.env.JWT_SECRET
const originalExecute = pool.execute
const originalQuery = pool.query
const record = {
  version: 1,
  pageName: '鉴权测试页',
  content: {
    block: [],
    page: { background: { desktop: '#ffffff', mobile: '#ffffff' } },
  },
}
let server
let baseURL
let pageQueries = 0
let userDatabaseFails = false
let pages

before(async () => {
  pool.execute = async (sql, params = []) => {
    if (sql.includes('FROM users')) {
      if (userDatabaseFails) {
        throw Object.assign(new Error('test failure'), { code: 'TEST_DB_FAILURE' })
      }
      return [params[0] === 1 ? [{ id: 1, username: 'tester', role: 'editor' }] : []]
    }

    pageQueries += 1
    if (sql.startsWith('INSERT INTO pages')) {
      const document = JSON.parse(params[1])
      pages.set(8, document)
      return [{ insertId: 8 }]
    }
    if (sql.startsWith('SELECT id, draft_content')) {
      const document = pages.get(params[0])
      return [document ? [{ id: params[0], draft_content: document }] : []]
    }
    if (sql.startsWith('UPDATE pages')) {
      const id = params[2]
      if (!pages.has(id)) return [{ affectedRows: 0 }]
      pages.set(id, JSON.parse(params[1]))
      return [{ affectedRows: 1 }]
    }
    if (sql.startsWith('DELETE FROM pages')) {
      return [{ affectedRows: pages.delete(params[0]) ? 1 : 0 }]
    }
    throw new Error('Unexpected SQL in test')
  }

  pool.query = async (sql) => {
    pageQueries += 1
    if (sql.includes('COUNT(*)')) return [[{ total: pages.size, pageCount: pages.size }]]
    return [[...pages.entries()].map(([id, document]) => ({
      id,
      name: document.pageName,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    }))]
  }

  const { default: app } = await import('../src/index.js')
  server = app.listen(0, '127.0.0.1')
  await new Promise(resolve => server.once('listening', resolve))
  baseURL = `http://127.0.0.1:${server.address().port}`
})

beforeEach(() => {
  pageQueries = 0
  userDatabaseFails = false
  pages = new Map([[7, structuredClone(record)]])
})

after(async () => {
  if (server) {
    server.closeAllConnections()
    await new Promise(resolve => server.close(resolve))
  }
  pool.execute = originalExecute
  pool.query = originalQuery
  await pool.end()
  if (previousSecret === undefined) delete process.env.JWT_SECRET
  else process.env.JWT_SECRET = previousSecret
})

const validToken = jwt.sign({ id: 1, role: 'admin' }, secret, { expiresIn: '1h' })
const expiredToken = jwt.sign({ id: 1 }, secret, { expiresIn: -1 })
const signature = validToken.split('.')[2]
const tamperedToken = `${validToken.slice(0, validToken.lastIndexOf('.') + 1)}${signature[0] === 'A' ? 'B' : 'A'}${signature.slice(1)}`
const routes = [
  ['GET', '/api/pages'],
  ['GET', '/api/pages/7'],
  ['POST', '/api/pages'],
  ['PUT', '/api/pages/7'],
  ['DELETE', '/api/pages/7'],
  ['POST', '/api/pages/receive'],
  ['GET', '/api/health/db'],
]

async function request(method, path, token, body) {
  const response = await fetch(`${baseURL}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  return { response, result: await response.json() }
}

for (const [label, token] of [
  ['missing', undefined],
  ['invalid', 'invalid-token'],
  ['expired', expiredToken],
  ['tampered', tamperedToken],
]) {
  test(`${label} JWT cannot access any page endpoint`, async () => {
    for (const [method, path] of routes) {
      const { response, result } = await request(
        method, path, token, ['POST', 'PUT'].includes(method) ? record : undefined,
      )
      assert.equal(response.status, 401, `${method} ${path}`)
      assert.equal(response.headers.get('www-authenticate'), 'Bearer')
      assert.equal(response.headers.get('cache-control'), 'no-store')
      assert.equal(typeof result.message, 'string')
    }
    assert.equal(pageQueries, 0, 'rejected requests must not query or modify pages')
  })
}

test('valid JWT allows page create, list, detail, update and delete', async () => {
  let reply = await request('POST', '/api/pages', validToken, record)
  assert.equal(reply.response.status, 201)
  assert.equal(reply.result.data.id, 8)

  reply = await request('GET', '/api/pages', validToken)
  assert.equal(reply.response.status, 200)
  assert.equal(reply.result.data.total, 2)

  reply = await request('GET', '/api/pages/8', validToken)
  assert.equal(reply.response.status, 200)
  assert.deepEqual(reply.result.data.document, record)

  const updated = { ...record, pageName: '更新后的测试页' }
  reply = await request('PUT', '/api/pages/8', validToken, updated)
  assert.equal(reply.response.status, 200)
  assert.equal(pages.get(8).pageName, updated.pageName)

  reply = await request('DELETE', '/api/pages/8', validToken)
  assert.equal(reply.response.status, 200)
  assert.equal(pages.has(8), false)

  reply = await request('GET', '/api/pages/8', validToken)
  assert.equal(reply.response.status, 404)
})

test('user identity and role come from the database, not JWT role claims', async () => {
  const { response, result } = await request('GET', '/api/auth/me', validToken)
  assert.equal(response.status, 200)
  assert.deepEqual(result.data.user, { id: 1, username: 'tester', role: 'editor' })
})

test('deleted users and malformed or unsupported JWT payloads are rejected', async () => {
  const tokens = [
    jwt.sign({ id: 2 }, secret, { expiresIn: '1h' }),
    jwt.sign({ id: '1' }, secret, { expiresIn: '1h' }),
    jwt.sign({ id: 1 }, secret),
    jwt.sign({ id: 1 }, secret, { algorithm: 'HS384', expiresIn: '1h' }),
  ]
  for (const token of tokens) {
    const { response } = await request('DELETE', '/api/pages/7', token)
    assert.equal(response.status, 401)
  }
  assert.equal(pageQueries, 0)
})

test('user database failures do not execute page writes', async () => {
  userDatabaseFails = true
  const { response } = await request('POST', '/api/pages', validToken, record)
  assert.equal(response.status, 500)
  assert.equal(pageQueries, 0)
})

test('health, login and registration remain accessible without JWT', async () => {
  assert.equal((await request('GET', '/api/health')).response.status, 200)
  assert.equal((await request('POST', '/api/auth/login', undefined, {})).response.status, 400)
  assert.equal((await request('POST', '/api/auth/register', undefined, {})).response.status, 400)
  assert.equal(pageQueries, 0)
})
