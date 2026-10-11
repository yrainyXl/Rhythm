import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const bookshelfSource = readFileSync(new URL('../src/features/reading/components/bookshelf-row.tsx', import.meta.url), 'utf8')

test('bookshelf covers use a 2:3 portrait ratio', () => {
  assert.match(bookshelfSource, /aspect-\[2\/3\]/)
})

test('book cover images are not darkened by a gradient overlay', () => {
  const coveredBranch = bookshelfSource.slice(bookshelfSource.indexOf('if (book.cover_url)'), bookshelfSource.indexOf('return VARIANT_BG'))
  assert.doesNotMatch(coveredBranch, /linear-gradient/)
})
