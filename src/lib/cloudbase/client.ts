import cloudbase from '@cloudbase/js-sdk'
import { cloudbaseEnv } from './env'

export type { cloudbase }

let cloudbaseClient: ReturnType<typeof cloudbase.init> | null = null

export function createCloudbaseClient() {
  if (cloudbaseClient) {
    return cloudbaseClient
  }
  cloudbaseClient = cloudbase.init({
    env: cloudbaseEnv.NEXT_PUBLIC_CLOUDBASE_ENV_ID,
  })
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
  return auth.onLoginStateChanged((loginState: cloudbase.auth.ILoginState | null) => {
    callback(loginState?.user || null)
  })
}
