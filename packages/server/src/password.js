import { randomBytes, scrypt , timingSafeEqual,} from 'node:crypto'
import { promisify } from 'node:util'

// 把回调形式的 scrypt 转成可以 await 的函数。
const scryptAsync = promisify(scrypt)

// 密码哈希的计算参数。
const SCRYPT_OPTIONS = {
  N: 2 ** 17,
  r: 8,
  p: 1,
  maxmem: 256 * 1024 * 1024,
}

export async function hashPassword(password) {
  // 为本次密码哈希生成随机盐。
  const salt = randomBytes(16).toString('hex')

  // 计算出 64 字节的结果。
  const derivedKey = await scryptAsync(
    password,
    salt,
    64,
    SCRYPT_OPTIONS,
  )

  // 同时保存算法、参数、盐和结果，供以后验证密码使用。
  return [
    'scrypt',
    SCRYPT_OPTIONS.N,
    SCRYPT_OPTIONS.r,
    SCRYPT_OPTIONS.p,
    salt,
    derivedKey.toString('hex'),
  ].join('$')
}







// 密码验证函数
export async function verifyPassword(
  password,
  passwordHash,
) {
  if (typeof password !== 'string') {
    return false
  }

  if (typeof passwordHash !== 'string') {
    throw new Error('数据库中的密码哈希格式不正确')
  }

  // 拆出算法、参数、盐和原有哈希。
  const parts = passwordHash.split('$')

  const [
    algorithm,
    n,
    r,
    p,
    salt,
    storedHash,
  ] = parts

  // 当前只接受上一课生成的格式和参数。
  if (
    parts.length !== 6 ||
    algorithm !== 'scrypt' ||
    n !== String(SCRYPT_OPTIONS.N) ||
    r !== String(SCRYPT_OPTIONS.r) ||
    p !== String(SCRYPT_OPTIONS.p) ||
    !/^[0-9a-f]{32}$/.test(salt ?? '') ||
    !/^[0-9a-f]{128}$/.test(storedHash ?? '')
  ) {
    throw new Error('数据库中的密码哈希格式不正确')
  }

  // 使用数据库中原有的盐，重新计算输入密码的哈希。
  const actualHash = await scryptAsync(
    password,
    salt,
    64,
    SCRYPT_OPTIONS,
  )

  // 将数据库中的十六进制字符串转回字节。
  const expectedHash = Buffer.from(storedHash, 'hex')

  return timingSafeEqual(
    actualHash,
    expectedHash,
  )
}