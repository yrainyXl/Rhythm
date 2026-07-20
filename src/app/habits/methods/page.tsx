'use client'

import Link from 'next/link'
import { AuthGuard } from '@/features/app/components/auth-guard'
import { MethodsList } from '@/features/practice/components/methods-list'

export default function MethodsPage() {
  return (
    <AuthGuard>
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <Link
            href="/habits"
            className="flex items-center gap-1 text-xs text-rhythm-text-muted hover:text-rhythm-text-primary transition-colors">
            <svg viewBox="0 0 24 24" className="w-3 h-3" style={{ stroke: 'currentColor', strokeWidth: 2, fill: 'none' }}>
              <path d="M15 18l-6-6 6-6" />
            </svg>
            返回计划
          </Link>
        </div>
        <div>
          <h1 className="font-serifsc text-lg font-medium m-0">我的方法</h1>
          <p className="text-xs text-rhythm-text-muted mt-1">
            经过实践验证、带适用条件的个人结论
          </p>
        </div>
        <MethodsList />
      </div>
    </AuthGuard>
  )
}
