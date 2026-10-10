import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import { pool } from '../db.js'
import { hashPassword } from '../password.js'

const router = Router()

// 密码哈希需要一定计算量，限制同一 IP 的注册请求次数。
const registerLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    message: '注册请求过于频繁，请稍后重试',
  },
})

router.post('/register', registerLimiter, async (req, res) => {
  res.set('Cache-Control', 'no-store')

  const rawUsername = req.body?.username
  const password = req.body?.password

  // 规则与登录、初始化测试账号保持一致。
  if (
    typeof rawUsername !== 'string' ||
    typeof password !== 'string'
  ) {
    return res.status(400).json({
      message: '请提交字符串类型的用户名和密码',
    })
  }

  const username = rawUsername.trim()

  if (!/^[A-Za-z0-9_]{3,32}$/.test(username)) {
    return res.status(400).json({
      message: '用户名应为 3～32 位字母、数字或下划线',
    })
  }

  if (password.length < 12 || password.length > 128) {
    return res.status(400).json({
      message: '密码长度应为 12～128 位',
    })
  }

  try {
    // 复用已有的随机盐 + scrypt，只把密码哈希写入数据库。
    const passwordHash = await hashPassword(password)

    const [result] = await pool.execute(
      `INSERT INTO users (username, password_hash, role)
       VALUES (?, ?, ?)`,
      [username, passwordHash, 'editor'],
    )

    // 角色由后端固定，不能让注册者自行选择管理员。
    return res.status(201).json({
      message: '注册成功，请登录',
      data: {
        user: {
          id: result.insertId,
          username,
          role: 'editor',
        },
      },
    })
  } catch (error) {
    // users.username 的唯一索引也能防止同时注册同一个用户名。
    if (error?.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message: '该用户名已被注册，请换一个用户名',
      })
    }

    console.error('注册失败：', error?.code ?? '未知错误')

    return res.status(500).json({
      message: '注册失败，请稍后重试',
    })
  }
})

export default router
