'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/features/auth/store/auth-store'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/features/app/components/app-layout'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoading, user } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login')
    }
  }, [isLoading, user, router])

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">加载中...</p>
        </div>
      </div>
    )
  }

  return <AppLayout>{children}</AppLayout>
}
