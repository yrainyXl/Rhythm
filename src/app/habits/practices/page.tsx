'use client'

import Link from 'next/link'
import { AuthGuard } from '@/features/app/components/auth-guard'
import { PracticesList } from '@/features/records/components/practices-list'

export default function PracticesPage() {
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
          <h1 className="font-serifsc text-lg font-medium m-0">实践管理</h1>
          <p className="text-xs text-rhythm-text-muted mt-1">
            持续验证一件事,直到找到适合自己的答案
          </p>
        </div>
        <PracticesList />
      </div>
    </AuthGuard>
  )
}
