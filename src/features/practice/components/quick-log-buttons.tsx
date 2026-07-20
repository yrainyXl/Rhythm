'use client'

import { useEffect, useMemo } from 'react'
import { usePracticeStore } from '@/features/practice/store/practice-store'

type LogStatus = 'done' | 'partial' | 'skipped'

const STATES: { value: LogStatus; label: string; hint: string; active: string; inactive: string }[] = [
  {
    value: 'done',
    label: '完成',
    hint: '按计划做了',
    active: 'bg-rhythm-success-soft border-rhythm-success text-rhythm-success',
    inactive: 'text-rhythm-text-muted hover:text-rhythm-success hover:border-rhythm-success',
  },
  {
    value: 'partial',
    label: '做了一点',
    hint: '开始但没做完',
    active: 'bg-rhythm-warn-soft border-rhythm-warn text-rhythm-warn',
    inactive: 'text-rhythm-text-muted hover:text-rhythm-warn hover:border-rhythm-warn',
  },
  {
    value: 'skipped',
    label: '没开始',
    hint: '今天没做',
    active: 'bg-rhythm-danger-soft border-rhythm-danger text-rhythm-danger',
    inactive: 'text-rhythm-text-muted hover:text-rhythm-danger hover:border-rhythm-danger',
  },
]

function todayIso(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function QuickLogButtons({ roundId }: { roundId: string }) {
  const { logsByRound, loadLogsForRound, upsertLog } = usePracticeStore()

  useEffect(() => {
    loadLogsForRound(roundId)
  }, [roundId, loadLogsForRound])

  const today = todayIso()
  const logs = logsByRound[roundId] ?? []
  const todayLog = useMemo(() => logs.find((l) => l.local_date === today), [logs, today])

  const onPick = async (status: LogStatus) => {
    await upsertLog({ roundId, localDate: today, status })
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {STATES.map((s) => {
        const isActive = todayLog?.status === s.value
        return (
          <button
            key={s.value}
            type="button"
            onClick={() => onPick(s.value)}
            className={`px-2 py-2.5 rounded-xl border cursor-pointer transition-colors text-[0.75rem] font-medium text-center ${
              isActive
                ? s.active
                : `border-rhythm-border bg-rhythm-void/40 ${s.inactive}`
            }`}>
            {s.label}
          </button>
        )
      })}
    </div>
  )
}
