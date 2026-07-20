'use client'

import { AuthGuard } from '@/features/app/components/auth-guard'
import { TopicsList } from '@/features/practice/components/topics-list'

export default function TopicsPage() {
  return (
    <AuthGuard>
      <TopicsList />
    </AuthGuard>
  )
}
