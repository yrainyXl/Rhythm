import assert from 'node:assert/strict'
import test from 'node:test'
import { canRecordDate, summarizePracticeLogs, hasReviewContent } from '../src/features/practice/lib/recording.ts'

test('record dates include round boundaries but exclude future and outside dates', () => {
  assert.equal(canRecordDate('2026-10-01', '2026-10-01', '2026-10-15', '2026-10-11'), true)
  assert.equal(canRecordDate('2026-10-11', '2026-10-01', '2026-10-15', '2026-10-11'), true)
  assert.equal(canRecordDate('2026-10-12', '2026-10-01', '2026-10-15', '2026-10-11'), false)
  assert.equal(canRecordDate('2026-09-30', '2026-10-01', '2026-10-15', '2026-10-11'), false)
  assert.equal(canRecordDate('2026-10-10', '2026-10-01', '2026-10-09', '2026-10-11'), false)
  assert.equal(canRecordDate('', '2026-10-01', '2026-10-15', '2026-10-11'), false)
})
test('summaries preserve partial and skipped separately from completion', () => {
  assert.deepEqual(summarizePracticeLogs([{status:'done'},{status:'partial'},{status:'skipped'},{status:'done'}]), {done:2,partial:1,skipped:1,total:4})
  assert.deepEqual(summarizePracticeLogs([]), {done:0,partial:0,skipped:0,total:0})
})
test('whitespace-only reviews cannot silently close a round', () => {
  assert.equal(hasReviewContent(' ', '\n', ''), false)
  assert.equal(hasReviewContent('', '有效果', ''), true)
})
