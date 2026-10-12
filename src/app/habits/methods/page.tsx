'use client'

import Link from 'next/link'
import { AuthGuard } from '@/features/app/components/auth-guard'
import { MethodsList } from '@/features/practice/components/methods-list'

export default function MethodsPage() {
  return (
    <AuthGuard>
      <div className="r-subpage">
        <div className="flex items-center justify-between">
          <Link
            href="/habits"
            className="r-back">
            <svg viewBox="0 0 24 24" className="w-4 h-4" style={{ stroke: 'currentColor', strokeWidth: 2, fill: 'none' }}>
              <path d="M15 18l-6-6 6-6" />
            </svg>
            返回计划
          </Link>
        </div>
        <div>
          <h1 className="r-detail-title">我的方法</h1>
          <p className="r-page-description mt-2">
            经过实践验证、带适用条件的个人结论
          </p>
        </div>
        <MethodsList />
      </div>
    </AuthGuard>
  )
}
