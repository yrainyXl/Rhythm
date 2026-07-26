import assert from 'node:assert/strict'
import test from 'node:test'
import { parseCloudbaseEnv } from '../src/lib/cloudbase/env.ts'

test('cloudbase environment schema validates required variables', () => {
  const env = {
    NEXT_PUBLIC_CLOUDBASE_ENV_ID: 'test-env',
    CLOUDBASE_SECRET_ID: 'test-id',
    CLOUDBASE_SECRET_KEY: 'test-key',
    TENCENTDB_HOST: 'localhost',
    TENCENTDB_DATABASE: 'rhythm',
    TENCENTDB_USER: 'postgres',
    TENCENTDB_PASSWORD: 'password',
  }
  const parsed = parseCloudbaseEnv(env)
  assert.equal(parsed.NEXT_PUBLIC_CLOUDBASE_ENV_ID, 'test-env')
  assert.equal(parsed.TENCENTDB_PORT, 5432)
  assert.equal(parsed.TENCENTDB_SSL, true)
})

test('cloudbase environment schema fails when required variables missing', () => {
  const env = {}
  assert.throws(() => parseCloudbaseEnv(env))
})

test('cloudbase environment schema uses defaults correctly', () => {
  const env = {
    NEXT_PUBLIC_CLOUDBASE_ENV_ID: 'test-env',
    CLOUDBASE_SECRET_ID: 'test-id',
    CLOUDBASE_SECRET_KEY: 'test-key',
    TENCENTDB_HOST: 'localhost',
    TENCENTDB_DATABASE: 'rhythm',
    TENCENTDB_USER: 'postgres',
    TENCENTDB_PASSWORD: 'password',
  }
  const parsed = parseCloudbaseEnv(env)
  assert.equal(parsed.TENCENTDB_PORT, 5432)
  assert.equal(parsed.TENCENTDB_SSL, true)
})

