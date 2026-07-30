import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

test('database pool retains idle connections for one minute', () => {
  const source = readFileSync(
    new URL('../src/lib/cloudbase/server.ts', import.meta.url),
    'utf8',
  )

  assert.match(source, /idleTimeoutMillis:\s*60_000/)
})
