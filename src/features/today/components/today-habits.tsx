'use client'

import { useEffect, useState } from 'react'
import { useHabitStore } from '@/features/habits/store/habit-store'
import { splitOccurrences } from './today-habits-view-model.ts'

function todayIsoDate() {
  return new Date().toISOString().split('T')[0]
}

export function TodayHabits() {
  const { occurrences, generateOccurrences, completeOccurrence, resetOccurrence } = useHabitStore()
  const [todayDate] = useState(todayIsoDate)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      await generateOccurrences(todayDate)
      if (!cancelled) setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [todayDate, generateOccurrences])

  const { pending, done } = splitOccurrences(occurrences)

  if (loading) {
    return (
      <div className="rounded-2xl border border-rhythm-border bg-rhythm-card/80 p-6 text-center text-xs text-rhythm-text-muted">
        加载中...
      </div>
    )
  }

  if (occurrences.length === 0) {
    return (
      <div className="rounded-2xl border border-rhythm-border bg-rhythm-card/80 p-6 text-center">
        <p className="text-sm text-rhythm-text-secondary">今天没有打卡项</p>
        <p className="text-xs text-rhythm-text-muted mt-1">先去「计划」创建一些习惯吧</p>
      </div>
    )
  }

  const toggleDone = async (id: string, currentlyDone: boolean) => {
    if (currentlyDone) await resetOccurrence(id)
    else await completeOccurrence(id)
  }

  return (
    <div className="rounded-2xl border border-rhythm-border bg-rhythm-card/80 backdrop-blur-sm p-4 space-y-1">
      {[...pending, ...done].map((o) => {
        const isDone = o.status === 'done'
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => toggleDone(o.id, isDone)}
            className="w-full flex items-center gap-3 py-2.5 px-1 text-left"
          >
            <span
              className={`flex-none w-5 h-5 rounded-md border grid place-items-center transition-colors ${
                isDone ? 'bg-rhythm-glow border-rhythm-glow' : 'border-rhythm-border-strong'
              }`}
            >
              {isDone && (
                <svg viewBox="0 0 24 24" className="w-2.5 h-2.5" style={{ stroke: 'rgba(11,16,25,0.9)', strokeWidth: 3, fill: 'none' }}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </span>
            <span
              className={`flex-1 text-[0.84rem] tracking-tight ${
                isDone ? 'text-rhythm-text-secondary line-through decoration-rhythm-text-faint' : 'text-rhythm-text-primary'
              }`}
            >
              {o.title_snapshot}
            </span>
            <span className="text-[0.62rem] tracking-tight text-rhythm-text-muted">
              {o.status === 'skipped' ? '已跳过' : isDone ? '今日' : '待完成'}
            </span>
          </button>
        )
      })}
    </div>
  )
}
