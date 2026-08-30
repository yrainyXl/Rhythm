// 创建/重置本地用户账号(自托管鉴权)。
// 用法:
//   node scripts/create-user.mjs <email>
// 口令优先读环境变量 RHYTHM_USER_PASSWORD;未设置时交互式输入(TTY 下不回显),
// 或从 stdin 管道读入(echo 'pw' | node scripts/create-user.mjs <email>)。
// 口令绝不走 argv,避免进入 shell history / ps。
//
// 依赖 TENCENTDB_* 环境变量(会先尝试加载项目根目录 .env)。

import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'crypto'
import { readFileSync } from 'fs'
import { promisify } from 'util'
import { fileURLToPath } from 'url'
import path from 'path'
import pg from 'pg'

const scrypt = promisify(scryptCb)
const SCRYPT_N = 131072
const SCRYPT_R = 8
const SCRYPT_P = 1
const SCRYPT_MAXMEM = 192 * 1024 * 1024
const KEY_LENGTH = 64
const SALT_LENGTH = 16

// ---- 最小 .env 加载(不引入 dotenv 依赖) ----
function loadEnv() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
  try {
    const raw = readFileSync(path.join(root, '.env'), 'utf8')
    for (const line of raw.split('\n')) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
      if (!m) continue
      const key = m[1]
      const val = m[2].replace(/^["']|["']$/g, '')
      if (process.env[key] === undefined) process.env[key] = val
    }
  } catch {
    // 无 .env 则依赖调用方已注入的环境变量
  }
}

async function hashPassword(plain) {
  const salt = randomBytes(SALT_LENGTH)
  const derived = await scrypt(plain, salt, KEY_LENGTH, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    maxmem: SCRYPT_MAXMEM,
  })
  return ['scrypt', SCRYPT_N, SCRYPT_R, SCRYPT_P, salt.toString('base64'), derived.toString('base64')].join('$')
}

function readPasswordFromStdin() {
  return new Promise((resolve) => {
    let buf = ''
    process.stdin.setEncoding('utf8')
    process.stdin.on('data', (c) => { buf += c })
    process.stdin.on('end', () => resolve(buf.replace(/\r?\n$/, '')))
    process.stdin.resume()
  })
}

function promptPassword(prompt) {
  return new Promise((resolve) => {
    if (!process.stdin.isTTY) {
      // 管道输入:读到整行
      let buf = ''
      process.stdin.setEncoding('utf8')
      process.stdin.on('data', (c) => { buf += c })
      process.stdin.on('end', () => resolve(buf.replace(/\r?\n$/, '')))
      process.stdin.resume()
      return
    }
    process.stdout.write(prompt)
    process.stdin.setRawMode(true)
    process.stdin.resume()
    process.stdin.setEncoding('utf8')
    let buf = ''
    const onData = (c) => {
      if (c === '\r' || c === '\n') {
        process.stdin.setRawMode(false)
        process.stdin.pause()
        process.stdin.removeListener('data', onData)
        process.stdout.write('\n')
        resolve(buf)
      } else if (c === '\u0003') {
        process.stdout.write('\n')
        process.exit(1)
      } else {
        buf += c
      }
    }
    process.stdin.on('data', onData)
  })
}

function sslConfig() {
  const sslEnv = process.env.TENCENTDB_SSL
  const useSsl = !(sslEnv === 'false' || sslEnv === '0')
  if (!useSsl) return false
  const config = { rejectUnauthorized: true }
  if (process.env.TENCENTDB_CA) {
    config.ca = readFileSync(process.env.TENCENTDB_CA, 'utf8')
  }
  return config
}

async function main() {
  loadEnv()
  const email = process.argv[2]?.trim()
  if (!email) {
    console.error('用法: node scripts/create-user.mjs <email>')
    process.exit(1)
  }

  const password = process.env.RHYTHM_USER_PASSWORD
    ? process.env.RHYTHM_USER_PASSWORD
    : await promptPassword('Password: ')

  if (!password || password.length < 8) {
    console.error('口令至少 8 位')
    process.exit(1)
  }

  const hash = await hashPassword(password)

  const client = new pg.Client({
    host: process.env.TENCENTDB_HOST,
    port: Number(process.env.TENCENTDB_PORT ?? 5432),
    user: process.env.TENCENTDB_USER,
    password: process.env.TENCENTDB_PASSWORD,
    database: process.env.TENCENTDB_DATABASE,
    ssl: sslConfig(),
  })

  try {
    await client.connect()
    const upsert = await client.query(
      `INSERT INTO public.app_users (email, password_hash)
       VALUES ($1, $2)
       ON CONFLICT (email) DO UPDATE
         SET password_hash = EXCLUDED.password_hash, updated_at = now()
       RETURNING id`,
      [email, hash],
    )
    const id = upsert.rows[0].id
    await client.query(
      `INSERT INTO public.profiles (id, email)
       VALUES ($1, $2)
       ON CONFLICT (id) DO NOTHING`,
      [id, email],
    )
    console.log(`已创建/更新用户: ${email} (id=${id})`)
  } finally {
    await client.end()
  }
}

main().catch((e) => {
  console.error('失败:', e instanceof Error ? e.message : e)
  process.exit(1)
})
