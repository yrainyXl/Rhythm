import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getSupabaseStorageKey,
  normalizeLegacyAuthCookies,
} from '../src/lib/supabase/legacy-auth-cookie.ts'

function jwt(payload: Record<string, unknown>) {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url')
  return `${encode({ alg: 'none' })}.${encode(payload)}.`
}

test('legacy Auth Helper cookie is converted to the session object expected by Supabase SSR', () => {
  const accessToken = jwt({
    sub: 'user-1',
    exp: 2_000_000_000,
    email: 'user@example.com',
    role: 'authenticated',
  })
  const storageKey = 'sb-project-auth-token'
  const cookies = normalizeLegacyAuthCookies(
    [{ name: storageKey, value: JSON.stringify([accessToken, 'refresh-1', null, null, ['factor-1']]) }],
    storageKey,
    1_900_000_000
  )

  const session = JSON.parse(cookies[0].value)
  assert.equal(session.access_token, accessToken)
  assert.equal(session.refresh_token, 'refresh-1')
  assert.equal(session.expires_at, 2_000_000_000)
  assert.equal(session.expires_in, 100_000_000)
  assert.equal(session.user.id, 'user-1')
  assert.equal(session.user.email, 'user@example.com')
  assert.deepEqual(session.user.factors, ['factor-1'])
})

test('current Supabase SSR cookie remains unchanged', () => {
  const storageKey = 'sb-project-auth-token'
  const value = JSON.stringify({ access_token: 'access', refresh_token: 'refresh', expires_at: 2 })
  const cookies = normalizeLegacyAuthCookies([{ name: storageKey, value }], storageKey)

  assert.equal(cookies[0].value, value)
})

test('storage key is derived from the Supabase project hostname', () => {
  assert.equal(
    getSupabaseStorageKey('https://jmkdorwbcocynczrukyp.supabase.co'),
    'sb-jmkdorwbcocynczrukyp-auth-token'
  )
})
