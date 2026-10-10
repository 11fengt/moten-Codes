import { pool } from '../src/db.js'
import { hashPassword } from '../src/password.js'

async function main() {
  const username = process.env.INIT_USERNAME?.trim()
  const password = process.env.INIT_PASSWORD

  // 这里规定测试账号使用 3～32 位字母、数字或下划线。
  if (
    !username ||
    !/^[A-Za-z0-9_]{3,32}$/.test(username)
  ) {
    throw new Error(
      'INIT_USERNAME 必须是 3～32 位字母、数字或下划线',
    )
  }

  // 本项目当前规定密码长度为 12～128。
  if (
    typeof password !== 'string' ||
    password.length < 12 ||
    password.length > 128
  ) {
    throw new Error(
      '请在 .env 中设置 12～128 位的 INIT_PASSWORD',
    )
  }

  const passwordHash = await hashPassword(password)

  const [result] = await pool.execute(
    `INSERT INTO users (
       username,
       password_hash,
       role
     ) VALUES (?, ?, ?)`,
    [
      username,
      passwordHash,
      'editor',
    ],
  )

  console.log('测试账号创建成功')
  console.log('用户 ID：', result.insertId)
  console.log('登录账号：', username)
  console.log('角色：editor')
}

try {
  await main()
} catch (error) {
  if (error?.code === 'ER_DUP_ENTRY') {
    console.error('账号已经存在，本次没有修改原账号')
  } else {
    console.error(
      '创建账号失败：',
      error instanceof Error
        ? error.message
        : '未知错误',
    )
  }

  process.exitCode = 1
} finally {
  // 初始化结束后，关闭连接池，让脚本正常退出。
  await pool.end()
}