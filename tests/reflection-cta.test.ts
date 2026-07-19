import assert from 'node:assert/strict'
import test from 'node:test'

import { REFLECTION_TODAY_HREF } from '../src/features/records/components/reflection-cta.ts'

test('reflection CTA points to /records/reflection/today', () => {
  assert.equal(REFLECTION_TODAY_HREF, '/records/reflection/today')
})
