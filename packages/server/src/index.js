import express from 'express'
import { pathToFileURL } from 'node:url'
import cors from 'cors'
import { pool } from './db.js'
import { parsePage } from '@learn-moten/materials/document'
import jwt from 'jsonwebtoken'
import { rateLimit } from 'express-rate-limit'
import { verifyPassword } from './password.js'

import { requireAuth } from './middleware/auth.js'
import registerRouter from './routes/register.js'
// 创建一个 Express 应用。
const app = express()

// 后端使用的端口。
const port = 8082


const jwtSecret = process.env.JWT_SECRET
if (
  typeof jwtSecret !== 'string' ||
  Buffer.byteLength(jwtSecret, 'utf8') < 32
) {
  throw new Error(
    '请在 .env 中配置足够长的随机 JWT_SECRET',
  )
}

// 为接口响应添加跨域相关响应头。
app.use(cors())
// 解析 JSON 请求体，将结果放入 req.body。
app.use(express.json({ limit: '5mb' }))

// 注册路由：最终地址为 POST /api/auth/register。
app.use('/api/auth', registerRouter)

// 这个路径下的所有页面接口，都必须先通过身份验证。
// 登录、注册和基础健康检查仍然可以直接访问。
app.use('/api/pages', requireAuth)

// 注册一个健康检查接口。
app.get('/api/health', (req, res) => {
  res.json({
    message: '服务运行正常',
  })
})

// 接收页面文档，验证数据传输是否正常。
app.post('/api/pages/receive', (req, res) => {
  const record = req.body

  // 先检查本步需要读取的字段。
  if (
    typeof record?.pageName !== 'string' ||
    !record.pageName.trim() ||
    !Array.isArray(record?.content?.block)
  ) {
    return res.status(400).json({
      message: '请提交有效的页面名称和组件列表',
    })
  }

  console.log('收到页面名称：', record.pageName)
  console.log('收到根节点数量：', record.content.block.length)

  res.json({
    message: '页面数据接收成功',
    data: {
      pageName: record.pageName,
      rootBlockCount: record.content.block.length,
    },
  })
})


// 检查后端能否查询页面表。
app.get('/api/health/db', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT COUNT(*) AS pageCount FROM pages',
    )

    console.log('数据库查询结果：', rows)

    res.json({
      message: '数据库连接成功',
      data: rows[0],
    })
  } catch (error) {
    console.error('数据库查询失败：', error.code)

    res.status(500).json({
      message: '数据库查询失败，请查看后端终端',
    })
  }
})

// 创建页面：校验文档，然后保存到数据库。
app.post('/api/pages', async (req, res) => {
  let record

  // 第一部分：校验客户端提交的页面文档。
  try {
    record = parsePage(JSON.stringify(req.body))
  } catch (error) {
    return res.status(400).json({
      message:
        error instanceof Error
          ? error.message
          : '页面文档校验失败',
    })
  }

  // 第二部分：把通过校验的文档写入数据库。
  try {
    const [result] = await pool.execute(
      'INSERT INTO pages (name, draft_content) VALUES (?, ?)',
      [
        record.pageName,
        JSON.stringify(record),
      ],
    )

    console.log('页面创建成功，ID：', result.insertId)

    return res.status(201).json({
      message: '页面创建成功',
      data: {
        id: result.insertId,
        pageName: record.pageName,
      },
    })
  } catch (error) {
    console.error('创建页面失败：', error.code)

    return res.status(500).json({
      message: '创建页面失败，请查看后端终端',
    })
  }
})


// 分页查询页面列表。
app.get('/api/pages', async (req, res) => {
  const rawPage = req.query.page ?? '1'
  const rawSize = req.query.size ?? '10'

  // 查询参数必须是单个字符串。
  if (
    typeof rawPage !== 'string' ||
    typeof rawSize !== 'string'
  ) {
    return res.status(400).json({
      message: 'page 和 size 必须是单个分页参数',
    })
  }

  const page = Number(rawPage)
  const size = Number(rawSize)

  if (
    !Number.isSafeInteger(page) ||
    page < 1 ||
    !Number.isSafeInteger(size) ||
    size < 1 ||
    size > 100
  ) {
    return res.status(400).json({
      message: 'page 必须是正整数，size 必须是 1～100 的整数',
    })
  }

  const offset = (page - 1) * size

  if (!Number.isSafeInteger(offset)) {
    return res.status(400).json({
      message: '分页范围过大',
    })
  }

  try {
    // 查询当前页需要展示的记录。
    const [list] = await pool.query(
      `SELECT
         id,
         name,
         created_at AS createdAt,
         updated_at AS updatedAt
       FROM pages
       ORDER BY id DESC
       LIMIT ? OFFSET ?`,
      [size, offset],
    )

    // 查询全部页面的数量。
    const [countRows] = await pool.query(
      'SELECT COUNT(*) AS total FROM pages',
    )

    return res.json({
      message: '页面列表查询成功',
      data: {
        list,
        total: countRows[0].total,
        page,
        size,
      },
    })
  } catch (error) {
    console.error('查询页面列表失败：', error.code)

    return res.status(500).json({
      message: '查询页面列表失败，请查看后端终端',
    })
  }
})

// 根据 ID 查询页面文档。
app.get('/api/pages/:id', async (req, res) => {
  const id = Number(req.params.id)

  // 页面 ID 必须是正整数。
  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({
      message: '页面 ID 必须是正整数',
    })
  }

  try {
    const [rows] = await pool.execute(
      'SELECT id, draft_content FROM pages WHERE id = ? LIMIT 1',
      [id],
    )

    const page = rows[0]

    if (!page) {
      return res.status(404).json({
        message: '页面不存在',
      })
    }

    return res.json({
      message: '页面查询成功',
      data: {
        id: page.id,
        document: page.draft_content,
      },
    })
  } catch (error) {
    console.error('查询页面失败：', error.code)

    return res.status(500).json({
      message: '查询页面失败，请查看后端终端',
    })
  }
})


// 更新已有页面。
app.put('/api/pages/:id', async (req, res) => {
  const id = Number(req.params.id)

  // 第一部分：检查页面 ID。
  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({
      message: '页面 ID 必须是正整数',
    })
  }

  // 第二部分：检查提交的完整页面文档。
  let record

  try {
    record = parsePage(JSON.stringify(req.body))
  } catch (error) {
    return res.status(400).json({
      message:
        error instanceof Error
          ? error.message
          : '页面文档校验失败',
    })
  }

  // 第三部分：更新数据库记录。
  try {
    const [result] = await pool.execute(
      'UPDATE pages SET name = ?, draft_content = ? WHERE id = ?',
      [
        record.pageName,
        JSON.stringify(record),
        id,
      ],
    )

    // 当前 mysql2 默认配置下，这里表示没有匹配的记录。
    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: '页面不存在',
      })
    }

    console.log('页面更新成功，ID：', id)

    return res.json({
      message: '页面更新成功',
      data: {
        id,
        pageName: record.pageName,
      },
    })
  } catch (error) {
    console.error('更新页面失败：', error.code)

    return res.status(500).json({
      message: '更新页面失败，请查看后端终端',
    })
  }
})


// 根据 ID 删除页面。
app.delete('/api/pages/:id', async (req, res) => {
  const id = Number(req.params.id)

  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({
      message: '页面 ID 必须是正整数',
    })
  }

  try {
    const [result] = await pool.execute(
      'DELETE FROM pages WHERE id = ? LIMIT 1',
      [id],
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: '页面不存在或已经被删除',
      })
    }

    console.log('页面删除成功，ID：', id)

    return res.json({
      message: '页面删除成功',
      data: {
        id,
      },
    })
  } catch (error) {
    console.error('删除页面失败：', error.code)

    return res.status(500).json({
      message: '删除页面失败，请查看后端终端',
    })
  }
})


// 当前按客户端 IP，限制每分钟最多 10 次登录请求。
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    message: '登录请求过于频繁，请稍后重试',
  },
})

// 登录：验证账号密码，成功后签发 JWT。
app.post(
  '/api/auth/login',
  loginLimiter,
  async (req, res) => {
    // 登录响应包含凭证，不让浏览器缓存。
    res.set('Cache-Control', 'no-store')

    const rawUsername = req.body?.username
    const password = req.body?.password

    // 第一部分：检查请求参数。
    if (
      typeof rawUsername !== 'string' ||
      typeof password !== 'string'
    ) {
      return res.status(400).json({
        message: '请提交字符串类型的账号和密码',
      })
    }

    const username = rawUsername.trim()

    if (
      !/^[A-Za-z0-9_]{3,32}$/.test(username) ||
      password.length < 12 ||
      password.length > 128
    ) {
      return res.status(400).json({
        message:
          '账号应为 3～32 位字母、数字或下划线，密码长度应为 12～128',
      })
    }

    try {
      // 第二部分：根据账号查询用户。
      const [rows] = await pool.execute(
        `SELECT
           id,
           username,
           password_hash,
           role
         FROM users
         WHERE username = ?
         LIMIT 1`,
        [username],
      )

      const user = rows[0]

      if (!user) {
        return res.status(401).json({
          message: '账号或密码错误',
        })
      }

      // 第三部分：验证密码。
      const passwordMatched = await verifyPassword(
        password,
        user.password_hash,
      )

      if (!passwordMatched) {
        return res.status(401).json({
          message: '账号或密码错误',
        })
      }

      // 第四部分：密码正确，签发有效期为 2 小时的 JWT。
      const token = jwt.sign(
        {
          id: user.id,
        },
        jwtSecret,
        {
          algorithm: 'HS256',
          expiresIn: '2h',
        },
      )

      // 第五部分：返回凭证和前端需要的用户信息。
      return res.json({
        message: '登录成功',
        data: {
          token,
          tokenType: 'Bearer',
          expiresIn: 2 * 60 * 60,
          user: {
            id: user.id,
            username: user.username,
            role: user.role,
          },
        },
      })
    } catch (error) {
      console.error(
        '登录失败：',
        error?.code ?? error?.message ?? '未知错误',
      )

      return res.status(500).json({
        message: '登录失败，请查看后端终端',
      })
    }
  },
)



// 查询当前登录用户。
app.get(
  '/api/auth/me',
  requireAuth,
  (req, res) => {
    return res.json({
      message: '当前用户查询成功',
      data: {
        user: req.user,
      },
    })
  },
)

// 直接运行时启动服务；测试导入时只创建应用，不占用 8082。
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  app.listen(port, () => {
    console.log(`后端服务已启动：http://localhost:${port}`)
  })
}

export default app
