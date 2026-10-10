// 创建其他模块可以复用的数据库连接池
// 什么是连接池？
// 每次查询前，Node.js 都需要与 MySQL 建立连接。
// 连接池会管理并复用这些连接，避免每个请求都重新建立、关闭连接。

import mysql from 'mysql2/promise'

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  connectionLimit: 5,
})