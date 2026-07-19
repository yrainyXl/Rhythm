'use client'

import Link from 'next/link'

import { REFLECTION_TODAY_HREF } from './reflection-cta.ts'

export { REFLECTION_TODAY_HREF } from './reflection-cta.ts'

export function ReflectionCTA({ hasReflection }: { hasReflection: boolean }) {
  return (
    <Link href={REFLECTION_TODAY_HREF} className="r-btn-primary w-full flex items-center justify-center">
      {hasReflection ? '✎ 编辑今日复盘' : '+ 写今日复盘'}
    </Link>
  )
}
