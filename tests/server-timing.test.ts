import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { formatServerTiming } from '../src/lib/server-timing.ts'

test('server timing formats valid stages with one decimal millisecond precision', () => {
  assert.equal(
    formatServerTiming([
      { name: 'auth', duration: 12.345 },
      { name: 'db-connect', duration: 0 },
      { name: 'handler', duration: 98.76 },
    ]),
    'auth;dur=12.3, db-connect;dur=0.0, handler;dur=98.8',
  )
})

test('server timing drops unsafe names and invalid durations', () => {
  assert.equal(
    formatServerTiming([
      { name: 'valid_stage', duration: 2 },
      { name: 'bad stage', duration: 3 },
      { name: 'negative', duration: -1 },
      { name: 'infinite', duration: Number.POSITIVE_INFINITY },
    ]),
    'valid_stage;dur=2.0',
  )
})

test('withUser reports auth, connection, handler and total timings', () => {
  const source = readFileSync(
    new URL('../src/lib/cloudbase/db.ts', import.meta.url),
    'utf8',
  )

  assert.match(source, /formatServerTiming/)
  assert.match(source, /name:\s*'auth'/)
  assert.match(source, /name:\s*'db-connect'/)
  assert.match(source, /name:\s*'handler'/)
  assert.match(source, /name:\s*'total'/)
  assert.match(source, /x-error-tag.*db-connect:/s)
})
