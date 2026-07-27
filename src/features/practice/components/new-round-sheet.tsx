'use client'

import { useEffect, useState } from 'react'
import { usePracticeStore } from '@/features/practice/store/practice-store'

/**
 * 发起新一轮实践弹窗。
 * open 时展示假设 + 周期输入,确认后调 createRound。
 */
export function NewRoundSheet({
  open,
  onClose,
  practiceId,
  nextRoundNumber,
}: {
  open: boolean
  onClose: () => void
  practiceId: string
  nextRoundNumber: number
}) {
  const { createRound } = usePracticeStore()
  const [assumption, setAssumption] = useState('')
  const [period, setPeriod] = useState(6)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setAssumption('')
      setPeriod(6)
      setError(null)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const handleSubmit = async () => {
    if (saving) return
    setSaving(true)
    setError(null)
    const r = await createRound(practiceId, {
      assumption: assumption.trim() || undefined,
      periodDays: period,
    })
    setSaving(false)
    if (r.error) {
      setError(r.error)
      return
    }
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-rhythm-void/70 backdrop-blur-sm"
      onClick={onClose}>
      <div
        className="w-full sm:max-w-md p-5 rounded-t-2xl sm:rounded-2xl bg-rhythm-card border-t sm:border border-rhythm-border-strong max-h-[85vh] overflow-y-auto"
        style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serifsc text-base font-medium text-rhythm-text-primary m-0">发起第 {nextRoundNumber} 轮</h3>
          <button
            type="button"
            aria-label="关闭"
            onClick={onClose}
            className="w-8 h-8 grid place-items-center rounded-full bg-transparent border-0 cursor-pointer text-rhythm-text-muted hover:text-rhythm-text-primary transition-colors">
            <svg viewBox="0 0 24 24" className="w-4 h-4" style={{ stroke: 'currentColor', strokeWidth: 1.8, fill: 'none' }}>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-rhythm-text-secondary tracking-tight block mb-1.5">
              新假设 <span className="text-rhythm-text-muted">(可选)</span>
            </label>
            <input
              type="text"
              value={assumption}
              onChange={(e) => setAssumption(e.target.value)}
              placeholder="这一轮改变了什么…"
              autoFocus
              className="w-full bg-rhythm-void/40 border border-rhythm-border rounded-xl px-3 py-2.5 text-sm text-rhythm-text-primary placeholder-rhythm-text-muted focus:outline-none focus:border-rhythm-border-strong"
            />
          </div>

          <div>
            <label className="text-xs text-rhythm-text-secondary tracking-tight block mb-1.5">周期(天,3–60)</label>
            <input
              type="number"
              min={3}
              max={60}
              value={period}
              onChange={(e) => setPeriod(Number(e.target.value))}
              className="w-full bg-rhythm-void/40 border border-rhythm-border rounded-xl px-3 py-2.5 text-sm text-rhythm-text-primary focus:outline-none focus:border-rhythm-border-strong"
            />
          </div>
        </div>

        {error && <p className="text-xs text-rhythm-danger mt-3">{error}</p>}

        <div className="flex gap-2 mt-5">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm bg-transparent border border-rhythm-border text-rhythm-text-secondary cursor-pointer disabled:opacity-50">
            取消
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm bg-rhythm-glow-soft border border-rhythm-border-strong text-rhythm-glow cursor-pointer disabled:opacity-50">
            {saving ? '创建中...' : '确认创建'}
          </button>
        </div>
      </div>
    </div>
  )
}
