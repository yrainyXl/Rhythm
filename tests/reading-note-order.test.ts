import assert from 'node:assert/strict'
import test from 'node:test'
import { groupRecentHighlightsByChapter } from '../src/features/reading/lib/highlight-groups.ts'

test('newest notes stay first even when their chapters are interleaved', () => {
  const notes = [
    { id: 'old', chapter_title: 'A', highlighted_at: '2026-10-01T10:00:00Z', created_at: '2026-10-11T00:00:00Z' },
    { id: 'new', chapter_title: 'A', highlighted_at: '2026-10-11T10:00:00Z', created_at: '2026-10-11T00:00:00Z' },
    { id: 'middle', chapter_title: 'B', highlighted_at: null, created_at: '2026-10-10T10:00:00Z' },
  ]
  const groups = groupRecentHighlightsByChapter(notes)
  assert.deepEqual(groups.flatMap(([, items]) => items.map((h) => h.id)), ['new', 'middle', 'old'])
  assert.deepEqual(groups.map(([chapter]) => chapter), ['A', 'B', 'A'])
  assert.equal(notes[0].id, 'old')
})
