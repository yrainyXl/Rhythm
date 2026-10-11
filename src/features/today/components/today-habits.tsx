'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useHabitStore } from '@/features/habits/store/habit-store'
import { splitOccurrences } from './today-habits-view-model.ts'

function todayIsoDate() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function TodayHabits() {
  const { occurrences, generateOccurrences, completeOccurrence, resetOccurrence } = useHabitStore()
  const [todayDate] = useState(todayIsoDate)
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

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
      <div className="py-4 text-sm text-rhythm-text-secondary">
        正在加载今日打卡…
      </div>
    )
  }

  if (occurrences.length === 0) {
    return (
      <div className="py-4">
        <p className="text-sm text-rhythm-text-secondary">今天没有打卡项</p>
        <Link href="/habits/manage" className="r-link mt-2">添加一个习惯</Link>
      </div>
    )
  }

  const toggleDone = async (id: string, currentlyDone: boolean) => {
    if (savingId) return
    setSavingId(id)
    setError(null)
    try {
      if (currentlyDone) await resetOccurrence(id)
      else await completeOccurrence(id)
      const saved = useHabitStore.getState().occurrences.find((o) => o.id === id)
      if (!saved || (saved.status === 'done') === currentlyDone) setError('打卡未保存，请重试。')
    } catch {
      setError('打卡未保存，请重试。')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="divide-y divide-rhythm-border">
      {[...pending, ...done].map((o) => {
        const isDone = o.status === 'done'
        const isSkipped = o.status === 'skipped'
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => !isSkipped && toggleDone(o.id, isDone)}
            disabled={isSkipped || savingId !== null}
            aria-pressed={isDone}
            aria-label={`${o.title_snapshot}，${isSkipped ? '已跳过' : isDone ? '已完成，点击撤销' : '点击完成'}`}
            className="min-h-16 w-full flex items-center gap-3 py-4 text-left disabled:cursor-default"
          >
            <span
              className={`flex-none w-5 h-5 rounded-md border grid place-items-center transition-colors ${
                isDone
                  ? 'bg-rhythm-glow border-rhythm-glow'
                  : isSkipped
                    ? 'border-rhythm-border opacity-40'
                    : 'border-rhythm-border-strong'
              }`}
            >
              {isDone && (
                <svg viewBox="0 0 24 24" className="w-2.5 h-2.5" style={{ stroke: 'var(--r-on-glow)', strokeWidth: 3, fill: 'none' }}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </span>
            <span
              className={`min-w-0 flex-1 text-[15px] font-medium ${
                isDone || isSkipped
                  ? 'text-rhythm-text-secondary line-through decoration-rhythm-text-faint'
                  : 'text-rhythm-text-primary'
              }`}
            >
              {o.title_snapshot}
            </span>
            <span className="flex-none text-sm text-rhythm-text-secondary">
              {savingId === o.id ? '保存中…' : isSkipped ? '已跳过' : isDone ? '已完成' : '待完成'}
            </span>
          </button>
        )
      })}
      {error && <p role="alert" className="pt-3 text-sm text-rhythm-danger">{error}</p>}
    </div>
  )
}
