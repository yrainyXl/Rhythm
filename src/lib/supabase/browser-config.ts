const DEFAULT_REQUEST_TIMEOUT_MS = 12_000

interface ProxyFetchOptions {
  supabaseUrl: string
  getOrigin?: () => string
  fetchImpl?: typeof fetch
  timeoutMs?: number
}

function rewriteSupabaseUrl(input: RequestInfo | URL, supabaseUrl: string, origin: string) {
  const rewrite = (url: string) =>
    url.startsWith(supabaseUrl) ? `${origin}/sb-proxy${url.slice(supabaseUrl.length)}` : url

  if (typeof input === 'string') return rewrite(input)
  if (input instanceof URL) return new URL(rewrite(input.toString()))

  const rewrittenUrl = rewrite(input.url)
  return rewrittenUrl === input.url ? input : new Request(rewrittenUrl, input)
}

export function createProxyFetch({
  supabaseUrl,
  getOrigin = () => window.location.origin,
  fetchImpl = globalThis.fetch.bind(globalThis),
  timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
}: ProxyFetchOptions): typeof fetch {
  return async (input, init) => {
    const controller = new AbortController()
    const callerSignal = init?.signal
    const abortFromCaller = () => controller.abort(callerSignal?.reason)
    const timeout = setTimeout(
      () => controller.abort(new DOMException('Supabase request timed out', 'TimeoutError')),
      timeoutMs
    )

    if (callerSignal?.aborted) {
      abortFromCaller()
    } else {
      callerSignal?.addEventListener('abort', abortFromCaller, { once: true })
    }

    try {
      return await fetchImpl(rewriteSupabaseUrl(input, supabaseUrl, getOrigin()), {
        ...init,
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timeout)
      callerSignal?.removeEventListener('abort', abortFromCaller)
    }
  }
}

export function createBrowserClientOptions(proxyFetch: typeof fetch) {
  return {
    global: { fetch: proxyFetch },
    auth: {
      autoRefreshToken: false,
      persistSession: true,
      detectSessionInUrl: false,
    },
    cookieEncoding: 'raw' as const,
    isSingleton: false,
  }
}
