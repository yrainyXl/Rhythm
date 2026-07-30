export interface SingleFlight<T> {
  run: (operation: () => Promise<T>) => Promise<T>
}

export function createSingleFlight<T>(): SingleFlight<T> {
  let pending: Promise<T> | null = null

  return {
    run(operation) {
      if (pending) return pending
      pending = operation().finally(() => {
        pending = null
      })
      return pending
    },
  }
}

interface TimedSingleFlightOptions {
  ttlMs: number
  now?: () => number
}

export interface TimedSingleFlight<T> extends SingleFlight<T> {
  set: (value: T) => void
  clear: () => void
}

export function createTimedSingleFlight<T>({
  ttlMs,
  now = Date.now,
}: TimedSingleFlightOptions): TimedSingleFlight<T> {
  let flight = createSingleFlight<T>()
  let cached: { value: T; expiresAt: number } | null = null
  let generation = 0

  return {
    run(operation) {
      if (cached && cached.expiresAt > now()) {
        return Promise.resolve(cached.value)
      }
      const operationGeneration = generation
      return flight.run(async () => {
        const value = await operation()
        if (generation === operationGeneration) {
          cached = { value, expiresAt: now() + ttlMs }
        }
        return value
      })
    },
    set(value) {
      generation += 1
      flight = createSingleFlight<T>()
      cached = { value, expiresAt: now() + ttlMs }
    },
    clear() {
      generation += 1
      flight = createSingleFlight<T>()
      cached = null
    },
  }
}
