import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('reading page owns overview loading instead of display components', () => {
  const page = read('src/app/reading/page.tsx')
  assert.match(page, /function ReadingContent\(\)/)
  assert.match(page, /loadBooks/)
  assert.match(page, /loadHighlights/)
  assert.match(page, /runAnalysis/)

  for (const component of [
    'src/features/reading/components/bookshelf-row.tsx',
    'src/features/reading/components/done-books-list.tsx',
    'src/features/reading/components/random-highlight-hero.tsx',
    'src/features/reading/components/highlights-stream.tsx',
  ]) {
    const source = read(component)
    assert.doesNotMatch(source, /loadBooks|loadHighlights/, component)
  }
})

test('reading store uses single flight and analysis reuses book loading', () => {
  const store = read('src/features/records/store/reading-store.ts')
  assert.match(store, /createSingleFlight/)
  assert.match(store, /booksFlight\.run/)
  assert.match(store, /highlightsFlight\.run/)
  assert.match(store, /get\(\)\.loadBooks\(\)/)
})
