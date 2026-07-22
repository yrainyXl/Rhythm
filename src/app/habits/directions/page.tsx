'use client'

import { AuthGuard } from '@/features/app/components/auth-guard'
import { DirectionsList } from '@/features/practice/components/directions-list'

export default function DirectionsPage() {
  return (
    <AuthGuard>
      <DirectionsList />
    </AuthGuard>
  )
}
