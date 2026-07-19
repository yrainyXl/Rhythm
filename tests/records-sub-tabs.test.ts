import assert from 'node:assert/strict'
import test from 'node:test'

import { RECORDS_SUB_TABS, isRecordsSubTab, type RecordsSubTab } from '../src/features/records/components/records-sub-tabs.ts'

test('records sub-tabs are list/trends only', () => {
  assert.deepEqual(
    RECORDS_SUB_TABS.map((t) => t.id),
    ['list', 'trends'] satisfies RecordsSubTab[],
  )
})

test('isRecordsSubTab rejects unknown ids', () => {
  assert.equal(isRecordsSubTab('list'), true)
  assert.equal(isRecordsSubTab('trends'), true)
  assert.equal(isRecordsSubTab('data'), false)
})
