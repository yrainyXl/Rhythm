import assert from 'node:assert/strict'
import test from 'node:test'

import { buildSectionHeaderClasses } from '../src/features/today/components/section-header.ts'

test('section header classes always include dot + eyebrow layout', () => {
  const result = buildSectionHeaderClasses()
  assert.match(result.wrapper, /flex/)
  assert.match(result.dot, /rounded-full/)
})
