'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePracticeStore, type PracticeLog, type PracticeWithLatestRound } from '@/features/practice/store/practice-store'

type LogStatus = PracticeLog['status']
const LABEL: Record<LogStatus, string> = { done: '完成了', partial: '做了一点', skipped: '没开始' }

function Row({ practice, today, onRecorded }: { practice: PracticeWithLatestRound; today: string; onRecorded: () => void }) {
  const { logsByRound, loadLogsForRound, upsertLog } = usePracticeStore()
  const round = practice.latestRound!
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => { void loadLogsForRound(round.id) }, [round.id, loadLogsForRound])
  const log = (logsByRound[round.id] ?? []).find((l) => l.local_date === today)

  const pick = async (status: LogStatus) => {
    if (saving) return
    setSaving(true)
    setError(null)
    const result = await upsertLog({ roundId: round.id, localDate: today, status, note: log?.note ?? '' })
    if (result.error) setError(result.error)
    else onRecorded()
    setSaving(false)
  }

  return (
    <div className="rounded-2xl bg-rhythm-card px-4 py-3">
      <div className="flex items-center gap-3">
        <Link href={`/habits/practices/${practice.id}`} className="min-w-0 flex-1 truncate text-[15px] font-semibold">{practice.title}</Link>
        {log ? (
          <span className="text-sm font-semibold text-rhythm-practice">{LABEL[log.status]}</span>
        ) : (
          <div className="flex gap-1.5">
            {(Object.keys(LABEL) as LogStatus[]).map((s) => (
              <button key={s} type="button" disabled={saving} onClick={() => void pick(s)} className="h-8 rounded-full bg-rhythm-fill px-2.5 text-[13px] font-semibold disabled:opacity-50">
                {LABEL[s]}
              </button>
            ))}
          </div>
        )}
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-rhythm-danger">{error}</p>}
    </div>
  )
}

/** 同时进行的其他实践：一行一个，三态一点即记。 */
export function OtherPractices({ practices, today, onRecorded }: { practices: PracticeWithLatestRound[]; today: string; onRecorded: () => void }) {
  if (practices.length === 0) return null
  return (
    <div className="mx-4 mb-3 space-y-2">
      {practices.map((p) => <Row key={p.id} practice={p} today={today} onRecorded={onRecorded} />)}
    </div>
  )
}
