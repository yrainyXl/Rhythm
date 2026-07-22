import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const bookshelfSource = readFileSync(new URL('../src/features/reading/components/bookshelf-row.tsx', import.meta.url), 'utf8')

test('bookshelf covers use a 3:2 landscape ratio', () => {
  assert.match(bookshelfSource, /aspect-\[3\/2\]/)
})
