import assert from 'node:assert/strict'
import test from 'node:test'
import { createSingleFlight, createTimedSingleFlight } from '../src/lib/async/single-flight.ts'

test('single flight shares one in-flight operation and allows a later reload', async () => {
  const gate = createSingleFlight<number>()
  let calls = 0
  let release!: (value: number) => void
  const operation = () => {
    calls += 1
    return new Promise<number>((resolve) => {
      release = resolve
    })
  }

  const first = gate.run(operation)
  const second = gate.run(operation)

  assert.equal(first, second)
  assert.equal(calls, 1)
  release(7)
  assert.equal(await first, 7)

  const third = gate.run(async () => {
    calls += 1
    return 9
  })
  assert.notEqual(third, first)
  assert.equal(await third, 9)
  assert.equal(calls, 2)
})

test('single flight releases a failed operation', async () => {
  const gate = createSingleFlight<number>()
  let calls = 0

  await assert.rejects(
    gate.run(async () => {
      calls += 1
      throw new Error('temporary')
    }),
    /temporary/,
  )

  assert.equal(await gate.run(async () => {
    calls += 1
    return 3
  }), 3)
  assert.equal(calls, 2)
})

test('timed single flight reuses successful values until ttl expires', async () => {
  let now = 1_000
  const gate = createTimedSingleFlight<number>({ ttlMs: 30_000, now: () => now })
  let calls = 0
  const operation = async () => {
    calls += 1
    return calls
  }

  assert.equal(await gate.run(operation), 1)
  assert.equal(await gate.run(operation), 1)
  assert.equal(calls, 1)

  now += 30_001
  assert.equal(await gate.run(operation), 2)
  assert.equal(calls, 2)
})

test('timed single flight supports setting and clearing a fresh value', async () => {
  const gate = createTimedSingleFlight<string>({ ttlMs: 30_000 })
  let calls = 0
  const operation = async () => {
    calls += 1
    return 'network'
  }

  gate.set('signin')
  assert.equal(await gate.run(operation), 'signin')
  assert.equal(calls, 0)

  gate.clear()
  assert.equal(await gate.run(operation), 'network')
  assert.equal(calls, 1)
})

test('clearing timed single flight prevents an older request from repopulating cache', async () => {
  const gate = createTimedSingleFlight<string>({ ttlMs: 30_000 })
  let release!: (value: string) => void
  const stale = gate.run(() => new Promise<string>((resolve) => {
    release = resolve
  }))

  gate.clear()
  let calls = 0
  const fresh = gate.run(async () => {
    calls += 1
    return 'fresh'
  })
  assert.notEqual(fresh, stale)
  assert.equal(await fresh, 'fresh')

  release('stale')
  assert.equal(await stale, 'stale')
  assert.equal(await gate.run(async () => 'other'), 'fresh')
  assert.equal(calls, 1)
})
