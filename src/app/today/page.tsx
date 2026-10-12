'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthGuard } from '@/features/app/components/auth-guard'
import { useHabitStore } from '@/features/habits/store/habit-store'
import { DayHead } from '@/features/today/components/day-head'
import { SectionHeader } from '@/features/today/components/section-header.tsx'
import { PracticeHero } from '@/features/today/components/practice-hero'
import { TodayHabits } from '@/features/today/components/today-habits'
import { CaptureInput } from '@/features/today/components/capture-input'

function todayIsoDate() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const weekday = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][date.getDay()]
  return `${m}月${d}日 · ${weekday}`
}

export default function TodayPage() {
  const router = useRouter()
  const { occurrences } = useHabitStore()
  const [todayDate] = useState(todayIsoDate)

  const total = occurrences.length
  const completed = occurrences.filter((o) => o.status === 'done').length
  const dateText = formatDate(todayDate)

  return (
    <AuthGuard>
      <div className="r-page">
        <DayHead dateText={dateText} />

        <section>
          <SectionHeader label="今天的实践" actionLabel="全部" onAction={() => router.push('/habits/practices')} />
          <PracticeHero />
        </section>

        <section>
          <SectionHeader label="日常习惯" actionLabel="管理" onAction={() => router.push('/habits/manage')} />
          {total > 0 && <div className="-mt-2 mb-2 flex items-center gap-3 text-xs text-rhythm-text-secondary"><span>{completed} / {total} 已完成</span><progress aria-label="今日习惯完成进度" value={completed} max={total} className="h-1 w-16 rounded-full" /></div>}
          <TodayHabits />
        </section>

        <section>
          <SectionHeader label="记下一个想法" />
          <CaptureInput />
        </section>
      </div>
    </AuthGuard>
  )
}
