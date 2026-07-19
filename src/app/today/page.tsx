'use client'

import { useEffect, useState } from 'react'
import { AuthGuard } from '@/features/app/components/auth-guard'
import { useHabitStore } from '@/features/habits/store/habit-store'
import { DayHead } from '@/features/today/components/day-head'
import { SectionHeader } from '@/features/today/components/section-header.tsx'
import { ArrangementsBand } from '@/features/today/components/arrangements-band'
import { PracticeHero } from '@/features/today/components/practice-hero'
import { TodayHabits } from '@/features/today/components/today-habits'
import { CaptureInput } from '@/features/today/components/capture-input'

function todayIsoDate() {
  return new Date().toISOString().split('T')[0]
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const weekday = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][date.getDay()]
  return `${m}月${d}日 · ${weekday}`
}

export default function TodayPage() {
  const { occurrences, generateOccurrences } = useHabitStore()
  const [todayDate] = useState(todayIsoDate)

  useEffect(() => {
    generateOccurrences(todayDate)
  }, [todayDate, generateOccurrences])

  const total = occurrences.length
  const completed = occurrences.filter((o) => o.status === 'done').length

  const dateText = formatDate(todayDate)
  const tonightHtml =
    total === 0
      ? '还没有习惯,先去「计划」添加。'
      : `今日已完成 <b>${completed} / ${total}</b>,继续保持节奏。`

  return (
    <AuthGuard>
      <div className="p-5 space-y-5">
        <DayHead dateText={dateText} tonightHtml={tonightHtml} completed={completed} total={total} />

        <section>
          <SectionHeader label="今日安排" actionLabel="添加安排" />
          <ArrangementsBand />
        </section>

        <section>
          <SectionHeader label="进行中的实践" actionLabel="查看实践" />
          <PracticeHero />
        </section>

        <section>
          <SectionHeader label="日常打卡" actionLabel="管理" />
          <TodayHabits />
        </section>

        <section>
          <SectionHeader label="记录此刻的想法" />
          <CaptureInput />
        </section>
      </div>
    </AuthGuard>
  )
}
