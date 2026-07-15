import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createBrowserClientOptions,
  createProxyFetch,
} from '../src/lib/supabase/browser-config.ts'

test('browser client options disable browser refresh and library singleton', () => {
  const proxyFetch = async () => new Response(null, { status: 200 })
  const options = createBrowserClientOptions(proxyFetch)

  assert.equal(options.auth.autoRefreshToken, false)
  assert.equal(options.auth.persistSession, true)
  assert.equal(options.auth.detectSessionInUrl, false)
  assert.equal(options.isSingleton, false)
  assert.equal(options.cookieEncoding, 'raw')
  assert.equal(options.global.fetch, proxyFetch)
})

test('proxy fetch rewrites Supabase URLs to the current origin', async () => {
  let requestedUrl = ''
  const proxyFetch = createProxyFetch({
    supabaseUrl: 'https://project.supabase.co',
    getOrigin: () => 'https://rhythm.example.com',
    fetchImpl: async (input) => {
      requestedUrl = String(input)
      return new Response(null, { status: 200 })
    },
    timeoutMs: 100,
  })

  await proxyFetch('https://project.supabase.co/rest/v1/habits?select=*')

  assert.equal(requestedUrl, 'https://rhythm.example.com/sb-proxy/rest/v1/habits?select=*')
})

test('proxy fetch enforces its timeout even when the caller supplies a signal', async () => {
  const caller = new AbortController()
  const proxyFetch = createProxyFetch({
    supabaseUrl: 'https://project.supabase.co',
    getOrigin: () => 'https://rhythm.example.com',
    fetchImpl: (_input, init) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(init.signal?.reason), { once: true })
      }),
    timeoutMs: 5,
  })

  await assert.rejects(
    proxyFetch('https://project.supabase.co/auth/v1/token', { signal: caller.signal }),
    (error) => error instanceof Error && error.name === 'TimeoutError'
  )
  assert.equal(caller.signal.aborted, false)
})
