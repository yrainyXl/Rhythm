import type { User } from '@supabase/supabase-js'

const DEFAULT_RECOVERY_TIMEOUT_MS = 12_000

interface ServerSessionOptions {
  fetchImpl?: typeof fetch
  timeoutMs?: number
}

let recoveryInFlight: Promise<User | null> | null = null

async function performServerSessionRequest({
  fetchImpl = globalThis.fetch.bind(globalThis),
  timeoutMs = DEFAULT_RECOVERY_TIMEOUT_MS,
}: ServerSessionOptions) {
  const controller = new AbortController()
  const timeout = setTimeout(
    () => controller.abort(new DOMException('Session recovery timed out', 'TimeoutError')),
    timeoutMs
  )

  try {
    const response = await fetchImpl('/api/auth/refresh', {
      method: 'POST',
      cache: 'no-store',
      credentials: 'same-origin',
      signal: controller.signal,
    })

    if (response.status === 401) return null
    if (!response.ok) throw new Error(`Session recovery failed with HTTP ${response.status}`)

    const body = (await response.json()) as { user?: User | null }
    return body.user ?? null
  } finally {
    clearTimeout(timeout)
  }
}

export function requestServerSession(options: ServerSessionOptions = {}) {
  if (recoveryInFlight) return recoveryInFlight

  recoveryInFlight = performServerSessionRequest(options).finally(() => {
    recoveryInFlight = null
  })

  return recoveryInFlight
}
