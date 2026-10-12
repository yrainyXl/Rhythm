import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'

test('standalone runtime listens on loopback and container network for its health probe', () => {
  const dockerfile = readFileSync(new URL('../Dockerfile', import.meta.url), 'utf8')
  const runtime = dockerfile.split('AS runtime')[1]
  assert.match(runtime, /ENV[\s\S]*HOSTNAME=0\.0\.0\.0/)
  assert.match(runtime, /fetch\('http:\/\/127\.0\.0\.1:3000\/api\/db-ping'\)/)
})
