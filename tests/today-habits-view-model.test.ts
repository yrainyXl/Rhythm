import assert from 'node:assert/strict'
import test from 'node:test'

import { splitOccurrences } from '../src/features/today/components/today-habits-view-model.ts'

test('splitOccurrences groups pending and done', () => {
  const result = splitOccurrences([
    { id: 'a', status: 'pending' } as any,
    { id: 'b', status: 'done' } as any,
    { id: 'c', status: 'skipped' } as any,
    { id: 'd', status: 'pending' } as any,
  ])
  assert.deepEqual(result.pending.map((o) => o.id), ['a', 'd'])
  assert.deepEqual(result.done.map((o) => o.id), ['b', 'c'])
})
