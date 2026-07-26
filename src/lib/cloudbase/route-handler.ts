import type { NextRequest } from 'next/server'
import { getUserIdFromCloudbase } from './server'

export async function getCloudbaseAppUserId(request: NextRequest) {
  return getUserIdFromCloudbase({ request })
}
