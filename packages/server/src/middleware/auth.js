import jwt from 'jsonwebtoken'
import { pool } from '../db.js'

// 统一返回未通过身份验证的响应。
function unauthorized(res, message) {
  res.set('WWW-Authenticate', 'Bearer')

  return res.status(401).json({
    message,
  })
}

export async function requireAuth(req, res, next) {
  res.set('Cache-Control', 'no-store')

  // 第一部分：读取请求头中的凭证。
  const authorization = req.get('Authorization') ?? ''

  const match = /^Bearer +(\S+)$/i.exec(authorization)

  if (!match) {
    return unauthorized(
      res,
      '请先登录，并使用 Bearer 格式携带凭证',
    )
  }

  const token = match[1]

  // 第二部分：验证 JWT。
  let payload

  try {
    payload = jwt.verify(
      token,
      process.env.JWT_SECRET,
      {
        algorithms: ['HS256'],
      },
    )
  } catch (error) {
    if (error?.name === 'TokenExpiredError') {
      return unauthorized(
        res,
        '登录已过期，请重新登录',
      )
    }

    if (
      error?.name === 'JsonWebTokenError' ||
      error?.name === 'NotBeforeError'
    ) {
      return unauthorized(
        res,
        '登录凭证无效，请重新登录',
      )
    }

    console.error('JWT 验证失败：', error?.message)

    return res.status(500).json({
      message: '身份验证失败，请查看后端终端',
    })
  }

  // 第三部分：检查本项目需要使用的字段。
  if (
    typeof payload !== 'object' ||
    payload === null ||
    !Number.isSafeInteger(payload.id) ||
    payload.id <= 0 ||
    typeof payload.exp !== 'number'
  ) {
    return unauthorized(
      res,
      '登录凭证内容不正确，请重新登录',
    )
  }

  // 第四部分：根据可信的用户 ID 查询当前用户。
  try {
    const [rows] = await pool.execute(
      `SELECT
         id,
         username,
         role
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [payload.id],
    )

    const user = rows[0]

    if (!user) {
      return unauthorized(
        res,
        '账号不存在，请重新登录',
      )
    }

    // 供后面的接口处理函数使用。
    req.user = {
      id: user.id,
      username: user.username,
      role: user.role,
    }
  } catch (error) {
    console.error(
      '查询当前用户失败：',
      error?.code ?? error?.message,
    )

    return res.status(500).json({
      message: '查询当前用户失败，请查看后端终端',
    })
  }

  // 身份验证通过，继续处理请求。
  return next()
}