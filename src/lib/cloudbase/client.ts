import cloudbase from '@cloudbase/js-sdk'

export type { cloudbase }

let cloudbaseClient: ReturnType<typeof cloudbase.init> | null = null

// Client only needs the public env id, which Next.js inlines at build time.
// Do NOT import the shared env.ts here - it pulls in Zod and server-only secrets.
const CLOUDBASE_ENV_ID = process.env.NEXT_PUBLIC_CLOUDBASE_ENV_ID

export function createCloudbaseClient() {
  if (cloudbaseClient) {
    return cloudbaseClient
  }
  if (!CLOUDBASE_ENV_ID) {
    throw new Error('NEXT_PUBLIC_CLOUDBASE_ENV_ID is not configured')
  }
  cloudbaseClient = cloudbase.init({
    env: CLOUDBASE_ENV_ID,
  })
  // Expose to window for debugging token
  if (typeof window !== 'undefined') {
    ;(window as unknown as { __CLOUDBASE_CLIENT: unknown }).__CLOUDBASE_CLIENT =
      cloudbaseClient
  }
  return cloudbaseClient
}

type CloudbaseApp = ReturnType<typeof cloudbase.init>
type CloudbaseAuth = ReturnType<CloudbaseApp['auth']>
type CloudbaseUser = NonNullable<
  NonNullable<Awaited<ReturnType<CloudbaseAuth['getLoginState']>>>['user']
>

export async function getCurrentUser(client: CloudbaseApp): Promise<CloudbaseUser | null> {
  const auth = client.auth()
  const state = await auth.getLoginState()
  return state?.user ?? null
}

export async function signInWithPassword(
  client: CloudbaseApp,
  username: string,
  password: string,
) {
  const auth = client.auth()
  // v3: 返回 { data, error },不抛异常
  return auth.signInWithPassword({ username, password })
}

export async function signOut(client: CloudbaseApp) {
  const auth = client.auth()
  return auth.signOut()
}

export function onAuthStateChange(
  client: CloudbaseApp,
  callback: (user: CloudbaseUser | null) => void,
) {
  const auth = client.auth()
  // v3 onAuthStateChange 同步返回 { data: { subscription: { unsubscribe } } }
  const result = auth.onAuthStateChange((loginState: { user?: CloudbaseUser | null } | null) => {
    callback(loginState?.user ?? null)
  })
  const unsubscribe = result?.data?.subscription?.unsubscribe
  return typeof unsubscribe === 'function' ? (unsubscribe as () => void) : undefined
}
