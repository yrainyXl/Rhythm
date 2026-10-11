'use client'

import { useEffect, useState } from 'react'
import { usePracticeStore } from '@/features/practice/store/practice-store'

import { canRecordDate } from '@/features/practice/lib/recording'

type LogStatus = 'done' | 'partial' | 'skipped'

const STATES: { value: LogStatus; label: string; active: string; inactive: string }[] = [
  {
    value: 'done',
    label: '完成',
    active: 'bg-rhythm-success-soft border-rhythm-success text-rhythm-success',
    inactive: 'text-rhythm-text-muted hover:text-rhythm-success hover:border-rhythm-success',
  },
  {
    value: 'partial',
    label: '做了一点',
    active: 'bg-rhythm-warn-soft border-rhythm-warn text-rhythm-warn',
    inactive: 'text-rhythm-text-muted hover:text-rhythm-warn hover:border-rhythm-warn',
  },
  {
    value: 'skipped',
    label: '没开始',
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

/** 今天页内联实践打卡：选状态 -> 可选补充说明 -> 确定保存。 */
export function PracticeLogInline({ roundId, startDate, endDate }: { roundId: string; startDate?: string; endDate?: string }) {
  const { logsByRound, logsErrorsByRound, loadLogsForRound, upsertLog } = usePracticeStore()
  const [selected, setSelected] = useState<LogStatus | null>(null)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const today = todayIso()
  const maximumDate = endDate && endDate < today ? endDate : today
  const [localDate, setLocalDate] = useState(maximumDate)

  useEffect(() => {
    loadLogsForRound(roundId)
  }, [roundId, loadLogsForRound])

  const logs = logsByRound[roundId] ?? []
  const todayLog = logs.find((l) => l.local_date === localDate)
  const validDate = canRecordDate(localDate, startDate ?? today, endDate ?? today, today)

  // 同步已保存记录到本地 state(保存后 store 更新会重新触发)
  useEffect(() => {
    setSelected(todayLog?.status ?? null)
    setNote(todayLog?.note ?? '')
    setError(null)
  }, [roundId, localDate, todayLog?.status, todayLog?.note])

  const dirty = todayLog
    ? selected !== todayLog.status || (note ?? '') !== (todayLog.note ?? '')
    : selected !== null

  const onConfirm = async () => {
    if (!selected || !dirty || !validDate || saving) return
    setSaving(true)
    const result = await upsertLog({ roundId, localDate, status: selected, note })
    setError(result.error)
    setSaving(false)
  }

  return (
    <div className="space-y-2">
      {startDate && endDate && (
        <label className="block text-xs text-rhythm-text-secondary">
          记录日期（可以补记）
          <input type="date" value={localDate} min={startDate} max={maximumDate} disabled={saving} onChange={(e) => setLocalDate(e.target.value)} className="mt-1 block rounded-lg border border-rhythm-border bg-rhythm-void px-3 py-2 text-rhythm-text-primary" />
        </label>
      )}
      {!validDate && <p className="text-xs text-rhythm-warn">请选择本轮周期内且不晚于今天的日期</p>}
      {logsErrorsByRound[roundId] && <p role="alert" className="text-xs text-rhythm-danger">{logsErrorsByRound[roundId]} <button type="button" onClick={() => void loadLogsForRound(roundId)}>重试</button></p>}
      {error && <p role="alert" className="text-xs text-rhythm-danger">{error}</p>}
      <div className="grid grid-cols-3 gap-2">
        {STATES.map((s) => {
          const isActive = selected === s.value
          return (
            <button
              key={s.value}
              type="button"
              disabled={saving || !validDate}
              onClick={() => setSelected(s.value)}
              className={`px-2 py-2 rounded-xl border cursor-pointer transition-colors text-[0.75rem] font-medium text-center ${
                isActive
                  ? s.active
                  : `border-rhythm-border bg-rhythm-void/40 ${s.inactive}`
              }`}>
              {s.label}
            </button>
          )
        })}
      </div>

      {selected && (
        <div className="space-y-2">
          <textarea
            disabled={saving}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="今天实际情况、想法或原因(可选)"
            rows={2}
            className="w-full bg-rhythm-void/40 border border-rhythm-border rounded-xl px-3 py-2 text-[0.72rem] text-rhythm-text-primary placeholder-rhythm-text-muted resize-none focus:outline-none focus:border-rhythm-border-strong"
          />
          <div className="flex items-center justify-end gap-2">
            {todayLog && !dirty && (
              <span className="text-[0.62rem] text-rhythm-text-muted">已保存</span>
            )}
            <button
              type="button"
              onClick={onConfirm}
              disabled={saving || !dirty || !validDate}
              className="px-4 py-1.5 rounded-full text-[0.72rem] bg-rhythm-glow-soft border border-rhythm-border-strong text-rhythm-glow cursor-pointer disabled:opacity-40">
              {saving ? '保存中...' : '确定'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
