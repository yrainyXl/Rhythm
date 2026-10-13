import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import ts from 'typescript'
import * as input from '../src/features/practice/server/input.ts'

const require = createRequire(import.meta.url)
// Execute the real route bodies with the external auth/DB boundary replaced.
function route(path: string, db: { query: Function; transaction?: Function }) {
  const source = readFileSync(new URL(`../src/app/api/practice/${path}/route.ts`, import.meta.url), 'utf8')
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText
  const module = { exports: {} as Record<string, Function> }
  const boundary = (id: string) => {
    if (id === 'next/server') return { NextResponse: { json: (body: unknown, init?: ResponseInit) => Response.json(body, init) } }
    if (id.endsWith('/with-user')) return { withUser: (_req: unknown, handler: Function) => handler('user-a', db) }
    if (id.endsWith('/input')) return input
    return require(id)
  }
  new Function('require', 'module', 'exports', compiled)(boundary, module, module.exports)
  return module.exports
}
const request = (body: unknown) => new Request('http://localhost/api/test', { method: 'POST', body: JSON.stringify(body) })

test('source owned by another user cannot create a practice', async () => {
  let writes = 0
  const db = {
    query: async (sql: string, params: unknown[]) => { assert.equal(params[1], 'user-a'); if (sql.includes('INSERT')) writes++; return { rows: [] } },
    transaction: async (fn: Function) => fn(db),
  }
  const response = await route('practices', db).POST(request({ title: 'try', assumption: 'do it', periodDays: 7, sourceHighlightId: 'other-highlight' }))
  assert.equal(response.status, 404)
  assert.equal(writes, 0)
})

test('practice and first round use a single transaction and persist source', async () => {
  const calls: { sql: string; params: unknown[] }[] = []
  let transactions = 0
  const db = {
    query: async (sql: string, params: unknown[]) => {
      calls.push({ sql, params })
      if (sql.includes('INSERT INTO practices')) return { rows: [{ id: 'practice-a', source_highlight_id: params[4] }] }
      if (sql.includes('INSERT INTO practice_rounds')) return { rows: [{ id: 'round-a', practice_id: params[1], round_number: 1 }] }
      return { rows: [{ id: 'highlight-a' }] }
    },
    transaction: async (fn: Function) => { transactions++; return fn(db) },
  }
  const response = await route('practices', db).POST(request({ title: 'try', assumption: 'read 10 minutes', periodDays: 7, sourceHighlightId: 'highlight-a' }))
  const body = await response.json()
  assert.equal(response.status, 201)
  assert.equal(transactions, 1)
  assert.equal(body.source_highlight_id, 'highlight-a')
  assert.equal(body.latestRound.practice_id, body.id)
  assert.equal(calls.filter((c) => c.sql.includes('INSERT')).length, 2)
})

test('repeated daily records update one row and invalid dates never write', async () => {
  const saved = new Map<string, { local_date: unknown; status: unknown; note: unknown }>()
  const db = {
    query: async (sql: string, params: unknown[]) => {
      if (sql.startsWith('SELECT')) return { rows: [{ start_date: '2026-01-01', end_date: '2026-01-07' }] }
      assert.match(sql, /ON CONFLICT \(round_id, local_date\)/)
      assert.equal(params[0], 'user-a')
      const row = { local_date: params[2], status: params[3], note: params[4] }
      saved.set(`${params[1]}:${params[2]}`, row)
      return { rows: [row] }
    },
    transaction: async (fn: Function) => fn(db),
  }
  const api = route('rounds/[id]/logs', db)
  const params = { params: { id: 'round-a' } }
  await api.POST(request({ localDate: '2026-01-02', status: 'partial' }), params)
  const res = await api.POST(request({ localDate: '2026-01-02', status: 'done', note: 'worked' }), params)
  assert.equal(res.status, 200)
  assert.equal(saved.size, 1)
  assert.equal([...saved.values()][0].status, 'done')
  assert.equal((await api.POST(request({ localDate: '2026-01-08', status: 'done' }), params)).status, 400)
  assert.equal(saved.size, 1)
})

test('review content is persisted on the owned round with ended state', async () => {
  const db = { query: async (sql: string, params: unknown[]) => {
    assert.match(sql, /status = 'ended'/)
    assert.match(sql, /user_id = \$6 AND status = 'active'/)
    assert.deepEqual(params, [null, 'three days', 'helpful', 'shorter next time', 'round-a', 'user-a'])
    return { rows: [{ id: 'round-a', status: 'ended', review_effect: params[2] }] }
  } }
  const req = new Request('http://localhost/api/round?action=end', { method: 'PATCH', body: JSON.stringify({ reviewReality: 'three days', reviewEffect: 'helpful', reviewAdjustment: 'shorter next time' }) })
  const res = await route('rounds/[id]', db).PATCH(req, { params: { id: 'round-a' } })
  assert.equal((await res.json()).round.review_effect, 'helpful')
})

test('invalid practice inputs never enter a write transaction', async () => {
  const db = { query: async () => { throw new Error('must not query') }, transaction: async () => { throw new Error('must not start transaction') } }
  const api = route('practices', db)
  for (const body of [{ title: '', periodDays: 7 }, { title: 'read', periodDays: 2 }, { title: 'read', periodDays: 61 }, { title: 'read', periodDays: 7, sourceHighlightId: 'highlight-a', assumption: ' ' }]) {
    assert.equal((await api.POST(request(body))).status, 400)
  }
})

test('practice detail retains its reading source and all round summaries', async () => {
  const source = { id: 'highlight-a', book_id: 'book-a', mark_text: 'start small', book_title: 'Atomic Habits' }
  const db = { query: async (sql: string, params: unknown[]) => {
    assert.equal(params[1], 'user-a')
    if (sql.includes('FROM practices')) return { rows: [{ id: 'practice-a', source_highlight_id: 'highlight-a' }] }
    if (sql.includes('FROM practice_rounds r')) {
      for (const status of ['done', 'partial', 'skipped']) assert.ok(sql.includes(`l.status = '${status}'`))
      return { rows: [{ id: 'round-a', log_count: 3, done_count: 1, partial_count: 1, skipped_count: 1 }] }
    }
    assert.equal(params[0], 'highlight-a')
    return { rows: [source] }
  } }
  const res = await route('practices/[id]', db).GET(new Request('http://localhost/api/test'), { params: { id: 'practice-a' } })
  const body = await res.json()
  assert.equal(body.sourceHighlight.book_id, 'book-a')
  assert.equal(body.rounds[0].log_count, 3)
  assert.deepEqual([body.rounds[0].done_count, body.rounds[0].partial_count, body.rounds[0].skipped_count], [1, 1, 1])
})

test('an unowned round cannot receive a daily log', async () => {
  let calls = 0
  const db = { query: async (_sql: string, params: unknown[]) => { calls++; assert.deepEqual(params, ['round-other', 'user-a']); return { rows: [] } }, transaction: async (fn: Function) => fn(db) }
  const res = await route('rounds/[id]/logs', db).POST(request({ localDate: '2026-01-02', status: 'done' }), { params: { id: 'round-other' } })
  assert.equal(res.status, 404)
  assert.equal(calls, 1)
})

test('review rejects invalid fields and reports ended rounds without overwriting', async () => {
  let calls = 0
  const db = { query: async () => { calls++; return { rows: [] } } }
  const api = route('rounds/[id]', db)
  const params = { params: { id: 'round-a' } }
  const req = (body: unknown) => new Request('http://localhost/api/round?action=end', { method: 'PATCH', body: JSON.stringify(body) })
  assert.equal((await api.PATCH(req({ reviewEffect: 1 }), params)).status, 400)
  assert.equal(calls, 0)
  assert.equal((await api.PATCH(req({ reviewEffect: 'helpful' }), params)).status, 404)
  assert.equal(calls, 1)
})

test('a useful practice conclusion can become an owned method with conditions', async () => {
  const db = { query: async (sql: string, params: unknown[]) => {
    assert.match(sql, /INSERT INTO methods/)
    assert.deepEqual(params, ['user-a', 'Read five minutes', 'After breakfast', 'validating'])
    return { rows: [{ id: 'method-a', user_id: params[0], title: params[1], condition: params[2], status: params[3] }] }
  } }
  const res = await route('methods', db).POST(request({ title: ' Read five minutes ', condition: ' After breakfast ' }))
  assert.equal(res.status, 201)
  const method = await res.json()
  assert.equal(method.status, 'validating')
  assert.equal(method.condition, 'After breakfast')
})

test('invalid method content or status returns validation errors without database writes', async () => {
  let writes = 0
  const db = { query: async () => { writes++; throw new Error('invalid method must not reach the database') } }
  const api = route('methods', db)
  const invalidBodies = [
    { title: 123 },
    { title: null },
    { title: '   ' },
    { title: 'Read five minutes', condition: { after: 'breakfast' } },
    { title: 'Read five minutes', condition: false },
    { title: 'Read five minutes', status: 'unexpected' },
    { title: 'Read five minutes', status: 1 },
  ]
  for (const body of invalidBodies) {
    const response = await api.POST(request(body))
    assert.equal(response.status, 400, JSON.stringify(body))
    assert.equal(typeof (await response.json()).error, 'string')
  }
  assert.equal(writes, 0)
})
