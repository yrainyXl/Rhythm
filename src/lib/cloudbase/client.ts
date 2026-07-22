import cloudbase from '@cloudbase/js-sdk'

export type { cloudbase }

let cloudbaseClient: ReturnType<typeof cloudbase.init> | null = null

// Client only needs the public env id, which Next.js inlines at build time.
// Do NOT import the shared env.ts here — it pulls in Zod and server-only secrets.
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

export async function getCurrentUser(client: ReturnType<typeof cloudbase.init>) {
  const auth = client.auth({ persistence: 'local' })
  return auth.currentUser
}

export async function signInWithEmailAndPassword(
  client: ReturnType<typeof cloudbase.init>,
  email: string,
  password: string,
) {
  const auth = client.auth({ persistence: 'local' })
  return auth.signInWithEmailAndPassword(email, password)
}

export async function signOut(client: ReturnType<typeof cloudbase.init>) {
  const auth = client.auth({ persistence: 'local' })
  return auth.signOut()
}

export function onAuthStateChanged(
  client: ReturnType<typeof cloudbase.init>,
  callback: (user: cloudbase.auth.IUser | null) => void,
) {
  const auth = client.auth({ persistence: 'local' })
  // SDK 类型声明 onLoginStateChanged 返回 void,但运行时返回 unsubscribe 函数。
  const result = auth.onLoginStateChanged((loginState: cloudbase.auth.ILoginState | null) => {
    callback(loginState?.user || null)
  })
  return typeof result === 'function' ? (result as () => void) : undefined
}
