'use client'

import { useEffect, useRef, useState } from 'react'
import { usePracticeStore } from '@/features/practice/store/practice-store'

import { hasReviewContent, summarizePracticeLogs } from '@/features/practice/lib/recording'

export interface ReviewFormSheetProps {
  open: boolean
  /** 关闭回调。result: 'submitted' = 提交/跳过(轮次已结束); 'cancelled' = 点 X/Esc/遮罩取消(无副作用) */
  onClose: (result: 'submitted' | 'cancelled') => void
  roundId: string
  /** 'end' = 结束轮次并写复盘(可跳过); 'review' = 补填/编辑复盘(不改状态) */
  mode: 'end' | 'review'
  initial?: {
    reviewReality?: string | null
    reviewEffect?: string | null
    reviewAdjustment?: string | null
  }
  roundNumber?: number
}

/**
 * 实践轮次复盘表单。
 * - end 模式:提交=结束轮次+写复盘;跳过=仅结束轮次
 * - review 模式:保存=补填/编辑复盘
 */
export function ReviewFormSheet({
  open,
  onClose,
  roundId,
  mode,
  initial,
  roundNumber,
}: ReviewFormSheetProps) {
  const { endRound, saveReview, logsByRound, logsErrorsByRound, loadLogsForRound, isLoadingLogs, detailPractice } = usePracticeStore()
  const [reality, setReality] = useState('')
  const [effect, setEffect] = useState('')
  const [adjustment, setAdjustment] = useState('')
  const [saving, setSaving] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const savingRef = useRef(false)
  const closeRef = useRef(onClose)
  savingRef.current = saving
  closeRef.current = onClose
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      void loadLogsForRound(roundId)
      setReality(initial?.reviewReality ?? '')
      setEffect(initial?.reviewEffect ?? '')
      setAdjustment(initial?.reviewAdjustment ?? '')
      setError(null)
    }
  }, [open, roundId, loadLogsForRound, initial?.reviewReality, initial?.reviewEffect, initial?.reviewAdjustment])

  useEffect(() => {
    if (!open) return
    const previousFocus = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const frame = requestAnimationFrame(() => dialogRef.current?.focus())
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !savingRef.current) { event.preventDefault(); closeRef.current('cancelled') }
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

  const buildInput = () => ({
    reviewReality: reality,
    reviewEffect: effect,
    reviewAdjustment: adjustment,
  })

  // 结束模式:跳过复盘,仅结束轮次
  const handleSkip = async () => {
    if (savingRef.current) return
    savingRef.current = true
    setSaving(true)
    setError(null)
    const result = await endRound(roundId)
    savingRef.current = false
    setSaving(false)
    if (result.error) { setError(result.error); return }
    onClose('submitted')
  }

  // 提交复盘
  const handleSubmit = async () => {
    if (savingRef.current) return
    if (!hasReviewContent(reality, effect, adjustment)) { setError('请填写至少一项复盘内容，或选择跳过'); return }
    savingRef.current = true
    setSaving(true)
    setError(null)
    const result = mode === 'end' ? await endRound(roundId, buildInput()) : await saveReview(roundId, buildInput())
    savingRef.current = false
    setSaving(false)
    if (result.error) { setError(result.error); return }
    onClose('submitted')
  }

  const cancel = () => { if (!saving) onClose('cancelled') }
  const logs = logsByRound[roundId] ?? []
  const counts = summarizePracticeLogs(logs)
  const round = detailPractice?.rounds.find((r) => r.id === roundId)
  const plannedDays = round ? Math.round((Date.parse(`${round.end_date}T00:00:00Z`) - Date.parse(`${round.start_date}T00:00:00Z`)) / 86_400_000) + 1 : null

  const title = mode === 'end'
    ? `结束第 ${roundNumber ?? ''} 轮 · 复盘`
    : `第 ${roundNumber ?? ''} 轮复盘`

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-rhythm-void/70 backdrop-blur-sm"
      onClick={cancel}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-form-sheet-title"
        tabIndex={-1}
        className="r-sheet"
        style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 id="review-form-sheet-title" className="text-[22px] font-semibold text-rhythm-text-primary m-0">{title}</h3>
          <button
            type="button"
            disabled={saving}
            aria-label="关闭"
            onClick={cancel}
            className="w-11 h-11 grid place-items-center rounded-full bg-transparent border-0 cursor-pointer text-rhythm-text-muted hover:text-rhythm-text-primary transition-colors">
            <svg viewBox="0 0 24 24" className="w-5 h-5" style={{ stroke: 'currentColor', strokeWidth: 1.8, fill: 'none' }}>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {mode === 'end' && (
          <p className="text-sm text-rhythm-text-muted mb-4 m-0">
            这轮结束了,花一分钟记录真实情况与下一步打算。也可以跳过,之后在「复盘」里补写。
          </p>
        )}

        <section aria-label="本轮记录" className="mb-5 rounded-2xl bg-rhythm-glow-soft p-4 text-sm text-rhythm-text-secondary">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h4 className="font-semibold text-rhythm-text-primary m-0">本轮记录</h4>
            <span>{counts.total} 天{plannedDays !== null && ` / ${plannedDays} 天`}</span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <span>完成 <strong className="text-rhythm-glow">{counts.done}</strong></span>
            <span>做了一点 {counts.partial}</span>
            <span>没开始 {counts.skipped}</span>
            {plannedDays !== null && <span>未记录 {Math.max(0, plannedDays - counts.total)}</span>}
          </div>
          {logsErrorsByRound[roundId] ? <p role="alert" className="text-rhythm-danger">{logsErrorsByRound[roundId]} <button className="r-link" type="button" onClick={() => void loadLogsForRound(roundId)}>重试</button></p> : isLoadingLogs ? <p role="status">加载记录中…</p> : logs.length === 0 ? <p className="mb-0">还没有记录，可返回详情补记后再复盘。</p> : (
            <details className="mt-3">
              <summary className="min-h-11 flex items-center cursor-pointer text-rhythm-glow">查看 {logs.length} 条记录</summary>
              <div className="max-h-40 overflow-y-auto space-y-2">{[...logs].sort((a, b) => a.local_date.localeCompare(b.local_date)).map((log) => <p key={log.id} className="m-0 break-words">{log.local_date} · {{ done: '完成', partial: '做了一点', skipped: '没开始' }[log.status]}{log.note ? `：${log.note}` : ''}</p>)}</div>
            </details>
          )}
        </section>
        <div className="space-y-4">
          <div>
            <label className="r-field-label">
              真实情况 <span className="text-rhythm-text-muted">(实际做了什么)</span>
            </label>
            <textarea
              aria-label="真实情况"
              name="review-form-sheet-0"
              autoComplete="off"
              disabled={saving}
              value={reality}
              onChange={(e) => setReality(e.target.value)}
              placeholder="例如:7 天里完成 4 天,加班两天没做,周末反而坚持了"
              rows={2}
              className="r-input resize-none"
            />
          </div>

          <div>
            <label className="r-field-label">
              效果怎样 <span className="text-rhythm-text-muted">(假设验证了吗)</span>
            </label>
            <textarea
              aria-label="效果怎样"
              name="review-form-sheet-1"
              autoComplete="off"
              disabled={saving}
              value={effect}
              onChange={(e) => setEffect(e.target.value)}
              placeholder="例如:22:30 洗漱确实让入睡更快,但加班日很难做到"
              rows={2}
              className="r-input resize-none"
            />
          </div>

          <div>
            <label className="r-field-label">
              下一轮怎么调整 <span className="text-rhythm-text-muted">(可选)</span>
            </label>
            <textarea
              aria-label="下一轮怎么调整"
              name="review-form-sheet-2"
              autoComplete="off"
              disabled={saving}
              value={adjustment}
              onChange={(e) => setAdjustment(e.target.value)}
              placeholder="例如:把目标改成「工作日至少洗漱」,周末单独要求"
              rows={2}
              className="r-input resize-none"
            />
          </div>
        </div>

        {error && <p role="alert" className="text-sm text-rhythm-danger mt-3">{error}</p>}

        <div className="flex gap-2 mt-5">
          {mode === 'end' && (
            <button
              type="button"
              onClick={handleSkip}
              disabled={saving}
              className="flex-1 min-h-11 py-2.5 rounded-xl text-sm bg-transparent border border-rhythm-border text-rhythm-text-secondary cursor-pointer disabled:opacity-50">
              跳过
            </button>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 min-h-11 py-2.5 rounded-xl text-sm r-btn-primary disabled:opacity-50">
            {saving ? '保存中…' : mode === 'end' ? '结束并保存' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}
