'use client'

import { AuthGuard } from '@/features/app/components/auth-guard'
import HabitsPageClient from '@/features/habits/components/habits-list'

export default function HabitsManagePage() {
  return (
    <AuthGuard>
      <HabitsPageClient />
    </AuthGuard>
  )
}
