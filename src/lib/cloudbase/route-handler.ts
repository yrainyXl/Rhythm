import type { NextRequest } from 'next/server'
import { createCloudbaseServer } from './server'
import { getUserIdFromCloudbase } from './server'

export async function getCloudbaseAppUserId(request: NextRequest) {
  const cloudbase = createCloudbaseServer()
  return getUserIdFromCloudbase({ cloudbase, request })
}
