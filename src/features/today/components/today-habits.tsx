'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useHabitStore } from '@/features/habits/store/habit-store'
import { splitOccurrences } from './today-habits-view-model.ts'

/** 普通习惯：两列小块，一点即打卡，再点撤销。 */
export function TodayHabits({ today, onRecorded }: { today: string; onRecorded: () => void }) {
  const { occurrences, generateOccurrences, completeOccurrence, resetOccurrence } = useHabitStore()
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      await generateOccurrences(today)
      if (!cancelled) setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [today, generateOccurrences])

  const { pending, done } = splitOccurrences(occurrences)
  const total = occurrences.length

  const toggleDone = async (id: string, currentlyDone: boolean) => {
    if (savingId) return
    setSavingId(id)
    setError(null)
    try {
      if (currentlyDone) await resetOccurrence(id)
      else await completeOccurrence(id)
      const saved = useHabitStore.getState().occurrences.find((o) => o.id === id)
      if (!saved || (saved.status === 'done') === currentlyDone) setError('打卡未保存，请重试。')
      else onRecorded()
    } catch {
      setError('打卡未保存，请重试。')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <section aria-labelledby="today-habits-title" className="mb-1">
      <div className="flex items-baseline justify-between px-5 pb-2 pt-3.5">
        <h2 id="today-habits-title" className="text-[22px] font-bold">
          习惯{total > 0 && <span className="ml-2 text-[15px] font-normal text-rhythm-text-secondary">{done.length} / {total}</span>}
        </h2>
        <Link href="/habits/manage" className="text-[15px] text-rhythm-glow">管理</Link>
      </div>

      {loading ? (
        <p className="px-5 py-3 text-sm text-rhythm-text-secondary">正在加载今日打卡…</p>
      ) : total === 0 ? (
        <Link href="/habits/manage" className="mx-4 flex min-h-[52px] items-center rounded-2xl bg-rhythm-card px-4 text-[15px] text-rhythm-glow">添加一个想长期坚持的习惯</Link>
      ) : (
        <div className="grid grid-cols-2 gap-2 px-4">
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
                className="flex min-h-[52px] items-center gap-2.5 rounded-2xl bg-rhythm-card px-3.5 text-left disabled:cursor-default"
              >
                <span
                  className={`grid h-[22px] w-[22px] flex-none place-items-center rounded-full transition-colors ${
                    isDone ? 'bg-rhythm-habit' : isSkipped ? 'shadow-[inset_0_0_0_1.5px_var(--r-border)]' : 'shadow-[inset_0_0_0_1.5px_var(--r-border-strong)]'
                  }`}
                >
                  {isDone && (
                    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="#fff" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12.5l4.5 4.5L19 7.5" />
                    </svg>
                  )}
                </span>
                <span className={`min-w-0 flex-1 truncate text-[15px] ${isDone || isSkipped ? 'text-rhythm-text-secondary' : 'text-rhythm-text-primary'}`}>
                  {savingId === o.id ? '保存中…' : o.title_snapshot}
                </span>
              </button>
            )
          })}
        </div>
      )}
      {error && <p role="alert" className="px-5 pt-2 text-sm text-rhythm-danger">{error}</p>}
    </section>
  )
}
