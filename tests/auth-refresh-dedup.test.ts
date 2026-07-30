import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const source = readFileSync(
  new URL('../src/features/auth/store/auth-store.ts', import.meta.url),
  'utf8',
)

test('auth profile refresh uses a timed single flight', () => {
  assert.match(source, /createTimedSingleFlight/)
  assert.match(source, /refreshProfileFlight\.run/)
})

test('signin primes and signout clears the profile refresh cache', () => {
  assert.match(source, /refreshProfileFlight\.set\(user\)/)
  assert.match(source, /refreshProfileFlight\.clear\(\)/)
})

test('an older refresh cannot overwrite a newer signin or signout state', () => {
  assert.match(source, /authGeneration/)
  assert.match(source, /if \(generation !== authGeneration\) return/)
  assert.match(source, /authGeneration \+= 1/)
})
