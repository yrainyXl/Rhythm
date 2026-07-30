import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { buildOccurrenceBatchInsert } from '../src/features/habits/server/occurrence-batch.ts'

test('occurrence batch returns null when there is nothing to insert', () => {
  assert.equal(buildOccurrenceBatchInsert('user-1', '2026-07-30', []), null)
})

test('occurrence batch creates one parameterized insert for all habits', () => {
  const query = buildOccurrenceBatchInsert('user-1', '2026-07-30', [
    {
      habitId: 'habit-1',
      title: '阅读',
      targetType: 'duration',
      targetValue: 30,
      targetUnit: '分钟',
    },
    {
      habitId: 'habit-2',
      title: '复盘',
      targetType: 'boolean',
      targetValue: null,
      targetUnit: null,
    },
  ])

  assert.ok(query)
  assert.match(query.text, /VALUES \(\$1,\$2,\$3,\$4,\$5,\$6,\$7\),\(\$8,\$9,\$10,\$11,\$12,\$13,\$14\)/)
  assert.match(query.text, /ON CONFLICT \(user_id, habit_id, local_date\) DO NOTHING/)
  assert.deepEqual(query.params, [
    'user-1', 'habit-1', '2026-07-30', '阅读', 'duration', 30, '分钟',
    'user-1', 'habit-2', '2026-07-30', '复盘', 'boolean', null, null,
  ])
})

test('generate endpoint returns occurrences and the store does not reload them', () => {
  const route = readFileSync(
    new URL('../src/app/api/habits/occurrences/generate/route.ts', import.meta.url),
    'utf8',
  )
  const store = readFileSync(
    new URL('../src/features/habits/store/habit-store.ts', import.meta.url),
    'utf8',
  )

  assert.match(route, /buildOccurrenceBatchInsert/)
  assert.match(route, /occurrences:\s*occurrencesRes\.rows/)
  assert.match(store, /occurrences:\s*data\.occurrences/)
  assert.doesNotMatch(
    store.slice(store.indexOf('generateOccurrences: async'), store.indexOf('\\n  },\\n}))')),
    /loadTodayOccurrences/,
  )
})
