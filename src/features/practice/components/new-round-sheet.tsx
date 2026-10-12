'use client'

import { useEffect, useRef, useState } from 'react'
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
  const dialogRef = useRef<HTMLDivElement>(null)
  const savingRef = useRef(false)
  const closeRef = useRef(onClose)
  savingRef.current = saving
  closeRef.current = onClose
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
    const previousFocus = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const frame = requestAnimationFrame(() => dialogRef.current?.focus())
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !savingRef.current) { event.preventDefault(); closeRef.current() }
      if (event.key !== 'Tab') return
      const nodes = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), summary, [tabindex="0"]') ?? [])
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (!first) { event.preventDefault(); dialogRef.current?.focus(); return }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialogRef.current)) { event.preventDefault(); first.focus() }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      cancelAnimationFrame(frame)
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKey)
      if (previousFocus?.isConnected) previousFocus.focus()
    }
  }, [open])

  if (!open) return null

  const handleSubmit = async () => {
    if (savingRef.current) return
    if (!Number.isInteger(period) || period < 3 || period > 60) { setError('请选择 3–60 天的整数周期'); return }
    savingRef.current = true
    setSaving(true)
    setError(null)
    const r = await createRound(practiceId, {
      assumption: assumption.trim() || undefined,
      periodDays: period,
    })
    savingRef.current = false
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
      onClick={() => { if (!saving) onClose() }}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-round-sheet-title"
        tabIndex={-1}
        className="r-sheet"
        style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 id="new-round-sheet-title" className="text-[22px] font-semibold text-rhythm-text-primary m-0">发起第 {nextRoundNumber} 轮</h3>
          <button
            type="button"
            aria-label="关闭"
            onClick={() => { if (!saving) onClose() }}
            className="w-11 h-11 grid place-items-center rounded-full bg-transparent border-0 cursor-pointer text-rhythm-text-muted hover:text-rhythm-text-primary transition-colors">
            <svg viewBox="0 0 24 24" className="w-5 h-5" style={{ stroke: 'currentColor', strokeWidth: 1.8, fill: 'none' }}>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="r-field-label">
              这轮想尝试什么 <span className="text-rhythm-text-muted">(可选)</span>
            </label>
            <input
              aria-label="这轮想尝试什么"
              name="new-round-sheet-0"
              autoComplete="off"
              type="text"
              value={assumption}
              onChange={(e) => setAssumption(e.target.value)}
              placeholder="这一轮改变了什么…"
                            className="r-input min-h-11"
            />
          </div>

          <div>
            <label className="r-field-label">尝试天数（3–60 天）</label>
            <input
              aria-label="尝试天数（3–60 天）"
              name="new-round-sheet-1"
              autoComplete="off"
              type="number"
              min={3}
              max={60}
              value={period}
              onChange={(e) => setPeriod(Number(e.target.value))}
              className="w-full bg-rhythm-void/40 border border-rhythm-border rounded-xl px-3 py-2.5 text-sm text-rhythm-text-primary focus:outline-none focus:border-rhythm-border-strong"
            />
          </div>
        </div>

        {error && <p role="alert" className="text-sm text-rhythm-danger mt-3">{error}</p>}

        <div className="flex gap-2 mt-5">
          <button
            type="button"
            onClick={() => { if (!saving) onClose() }}
            disabled={saving}
            className="flex-1 min-h-11 py-2.5 rounded-xl text-sm bg-transparent border border-rhythm-border text-rhythm-text-secondary cursor-pointer disabled:opacity-50">
            取消
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 min-h-11 py-2.5 rounded-xl text-sm r-btn-primary disabled:opacity-50">
            {saving ? '创建中…' : '确认创建'}
          </button>
        </div>
      </div>
    </div>
  )
}
