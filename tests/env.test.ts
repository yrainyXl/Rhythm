import assert from 'node:assert/strict'
import test from 'node:test'
import { parseEnv } from '../src/lib/server/env.ts'

test('env schema validates required TencentDB variables', () => {
  const env = {
    TENCENTDB_HOST: 'localhost',
    TENCENTDB_DATABASE: 'rhythm',
    TENCENTDB_USER: 'postgres',
    TENCENTDB_PASSWORD: 'password',
  }
  const parsed = parseEnv(env)
  assert.equal(parsed.TENCENTDB_HOST, 'localhost')
  assert.equal(parsed.TENCENTDB_PORT, 5432)
  assert.equal(parsed.TENCENTDB_SSL, true)
  assert.equal(parsed.SESSION_TTL_DAYS, 30)
  assert.equal(parsed.SESSION_ABSOLUTE_TTL_DAYS, 90)
})

test('env schema fails when required variables missing', () => {
  const env = {}
  assert.throws(() => parseEnv(env))
})

test('env schema uses defaults and honours TENCENTDB_SSL=false', () => {
  const env = {
    TENCENTDB_HOST: 'localhost',
    TENCENTDB_DATABASE: 'rhythm',
    TENCENTDB_USER: 'postgres',
    TENCENTDB_PASSWORD: 'password',
    TENCENTDB_SSL: 'false',
    SESSION_TTL_DAYS: '14',
  }
  const parsed = parseEnv(env)
  assert.equal(parsed.TENCENTDB_PORT, 5432)
  assert.equal(parsed.TENCENTDB_SSL, false)
  assert.equal(parsed.SESSION_TTL_DAYS, 14)
})

test('env schema no longer requires CloudBase variables', () => {
  const env = {
    TENCENTDB_HOST: 'localhost',
    TENCENTDB_DATABASE: 'rhythm',
    TENCENTDB_USER: 'postgres',
    TENCENTDB_PASSWORD: 'password',
  }
  const parsed = parseEnv(env)
  // CloudBase 字段已移除:对象上不应有这些 key
  assert.equal('CLOUDBASE_SECRET_ID' in parsed, false)
  assert.equal('NEXT_PUBLIC_CLOUDBASE_ENV_ID' in parsed, false)
})
