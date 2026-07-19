import assert from 'node:assert/strict'
import test from 'node:test'

import { RECORDS_TABS, isRecordsTab, type RecordsTab } from '../src/features/records/components/records-tabs.ts'

test('records tabs list is fixed to the four supported tabs in order', () => {
  assert.deepEqual(
    RECORDS_TABS.map((t) => t.id),
    ['records', 'sleep', 'reflection', 'review'] satisfies RecordsTab[],
  )
})

test('isRecordsTab guards unknown ids', () => {
  assert.equal(isRecordsTab('records'), true)
  assert.equal(isRecordsTab('reflection'), true)
  assert.equal(isRecordsTab('exercise'), false)
  assert.equal(isRecordsTab(''), false)
})
