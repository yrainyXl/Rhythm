interface AuthCookie {
  name: string
  value: string
}

export const AUTH_COOKIE_OPTIONS = {
  path: '/',
  sameSite: 'lax' as const,
  httpOnly: false,
  maxAge: 400 * 24 * 60 * 60,
}

function decodeJwtPayload(token: string) {
  const payload = token.split('.')[1]
  if (!payload) throw new Error('Invalid access token')

  const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
  return JSON.parse(new TextDecoder().decode(bytes)) as Record<string, unknown>
}

function tryDecodeCookieValue(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function normalizeLegacyValue(value: string, nowSeconds: number) {
  try {
    const decoded = tryDecodeCookieValue(value)
    const legacy = JSON.parse(decoded)
    if (!Array.isArray(legacy)) return value

    const [accessToken, refreshToken, providerToken, providerRefreshToken, factors] = legacy
    if (typeof accessToken !== 'string' || typeof refreshToken !== 'string') return value

    const { exp, sub, ...userClaims } = decodeJwtPayload(accessToken)
    if (typeof exp !== 'number' || typeof sub !== 'string') return value

    return JSON.stringify({
      access_token: accessToken,
      refresh_token: refreshToken,
      provider_token: providerToken ?? null,
      provider_refresh_token: providerRefreshToken ?? null,
      token_type: 'bearer',
      expires_at: exp,
      expires_in: exp - nowSeconds,
      user: {
        id: sub,
        factors: factors ?? null,
        ...userClaims,
      },
    })
  } catch {
    return value
  }
}

export function getSupabaseStorageKey(supabaseUrl: string) {
  return `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`
}

export function normalizeLegacyAuthCookies(
  cookies: AuthCookie[],
  storageKey: string,
  nowSeconds = Math.floor(Date.now() / 1000)
) {
  return cookies.map((cookie) =>
    cookie.name === storageKey
      ? { ...cookie, value: normalizeLegacyValue(cookie.value, nowSeconds) }
      : cookie
  )
}
