import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'

const page = readFileSync(new URL('../src/app/reading/[bookId]/page.tsx', import.meta.url), 'utf8')
const form = readFileSync(new URL('../src/features/practice/components/practice-form-sheet.tsx', import.meta.url), 'utf8')

test('reading practice creation preserves source and opens the created detail', () => {
  assert.match(page, /sourceExcerpt=/)
  assert.doesNotMatch(page, /initialAssumption=/)
  assert.match(page, /router\.push\(`\/habits\/practices\/\$\{practiceId\}`\)/)
  assert.match(form, /onCreated\?\.\(result\.practiceId\)/)
})

test('book detail owns request state and protects against stale book responses', () => {
  assert.match(page, /let cancelled = false/)
  assert.match(page, /if \(cancelled\) return/)
  assert.match(page, /bookId=\$\{bookId\}/)
  assert.match(page, /重新加载/)
  assert.doesNotMatch(page, /void loadBookDetail/)
})
