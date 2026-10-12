import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

test('database pool retains idle connections for ten minutes to avoid repeated remote connection startup', () => {
  const source = readFileSync(
    new URL('../src/lib/server/pg.ts', import.meta.url),
    'utf8',
  )

  assert.match(source, /idleTimeoutMillis:\s*10\s*\*\s*60_000/)
})
