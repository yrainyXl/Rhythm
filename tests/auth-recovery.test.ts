import assert from 'node:assert/strict'
import test from 'node:test'

import { requestServerSession } from '../src/lib/supabase/auth-recovery.ts'

test('server session recovery returns the verified user', async () => {
  const user = { id: 'user-1', email: 'user@example.com' }
  const result = await requestServerSession({
    fetchImpl: async (input, init) => {
      assert.equal(input, '/api/auth/refresh')
      assert.equal(init?.method, 'POST')
      assert.equal(init?.cache, 'no-store')
      return Response.json({ user })
    },
    timeoutMs: 100,
  })

  assert.deepEqual(result, user)
})

test('server session recovery treats unauthorized responses as signed out', async () => {
  const result = await requestServerSession({
    fetchImpl: async () => Response.json({ user: null }, { status: 401 }),
    timeoutMs: 100,
  })

  assert.equal(result, null)
})

test('server session recovery aborts a hung same-origin request', async () => {
  await assert.rejects(
    requestServerSession({
      fetchImpl: (_input, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(init.signal?.reason), { once: true })
        }),
      timeoutMs: 5,
    }),
    (error) => error instanceof Error && error.name === 'TimeoutError'
  )
})

test('server session recovery deduplicates concurrent refreshes', async () => {
  let calls = 0
  const fetchImpl = async () => {
    calls += 1
    await new Promise((resolve) => setTimeout(resolve, 5))
    return Response.json({ user: { id: 'user-1' } })
  }

  const [first, second] = await Promise.all([
    requestServerSession({ fetchImpl, timeoutMs: 100 }),
    requestServerSession({ fetchImpl, timeoutMs: 100 }),
  ])

  assert.equal(calls, 1)
  assert.deepEqual(first, second)
})
