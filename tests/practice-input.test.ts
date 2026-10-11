import assert from 'node:assert/strict'
import test from 'node:test'
import { practiceDates, validPeriod, validateLog } from '../src/features/practice/server/input.ts'

test('practice period rejects missing, fractional and out of range values', () => {
  for (const value of [undefined, null, NaN, 2, 61, 3.5, '7']) assert.equal(validPeriod(value), false)
  assert.equal(validPeriod(7), true)
})
test('practice dates use Shanghai day and include the final day across months', () => {
  assert.deepEqual(practiceDates(3, new Date('2026-10-31T17:00:00Z')), { startDate: '2026-11-01', endDate: '2026-11-03' })
})
test('log validation accepts past entries but rejects invalid, future and outside dates', () => {
  const round = { start_date: '2026-10-01', end_date: '2026-10-15' }
  assert.equal(validateLog({ localDate: '2026-10-02', status: 'partial', note: 'test' }, round, '2026-10-11'), null)
  for (const date of ['2026-02-30', '2026-9-1', '2026-10-16', '2026-09-30', '2026-10-12']) {
    assert.ok(validateLog({ localDate: date, status: 'done' }, round, '2026-10-11'))
  }
  assert.ok(validateLog({ localDate: '2026-10-02', status: 'invalid' }, round, '2026-10-11'))
  assert.ok(validateLog({ localDate: '2026-10-02', status: 'done', note: 123 }, round, '2026-10-11'))
})
