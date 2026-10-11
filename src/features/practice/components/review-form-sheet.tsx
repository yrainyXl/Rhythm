'use client'

import { useEffect, useState } from 'react'
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
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) onClose('cancelled')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, saving, onClose])

  if (!open) return null

  const buildInput = () => ({
    reviewReality: reality,
    reviewEffect: effect,
    reviewAdjustment: adjustment,
  })

  // 结束模式:跳过复盘,仅结束轮次
  const handleSkip = async () => {
    if (saving) return
    setSaving(true)
    setError(null)
    const result = await endRound(roundId)
    setSaving(false)
    if (result.error) { setError(result.error); return }
    onClose('submitted')
  }

  // 提交复盘
  const handleSubmit = async () => {
    if (saving) return
    if (!hasReviewContent(reality, effect, adjustment)) { setError('请填写至少一项复盘内容，或选择跳过'); return }
    setSaving(true)
    setError(null)
    const result = mode === 'end' ? await endRound(roundId, buildInput()) : await saveReview(roundId, buildInput())
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
        className="w-full sm:max-w-md p-5 rounded-t-2xl sm:rounded-2xl bg-rhythm-card border-t sm:border border-rhythm-border-strong max-h-[85vh] overflow-y-auto"
        style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serifsc text-base font-medium text-rhythm-text-primary m-0">{title}</h3>
          <button
            type="button"
            disabled={saving}
            aria-label="关闭"
            onClick={cancel}
            className="w-8 h-8 grid place-items-center rounded-full bg-transparent border-0 cursor-pointer text-rhythm-text-muted hover:text-rhythm-text-primary transition-colors">
            <svg viewBox="0 0 24 24" className="w-4 h-4" style={{ stroke: 'currentColor', strokeWidth: 1.8, fill: 'none' }}>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {mode === 'end' && (
          <p className="text-[0.7rem] text-rhythm-text-muted mb-4 m-0">
            这轮结束了,花一分钟记录真实情况与下一步打算。也可以跳过,之后在「复盘」里补写。
          </p>
        )}

        <section className="mb-4 rounded-xl bg-rhythm-void/40 p-3 text-xs text-rhythm-text-secondary">
          <p className="m-0 mb-2">本轮真实记录：{counts.total} 天 · 完成 {counts.done} · 做了一点 {counts.partial} · 没开始 {counts.skipped}{plannedDays !== null && ` · 未记录 ${Math.max(0, plannedDays - counts.total)} 天（按计划周期）`}</p>
          {logsErrorsByRound[roundId] ? <p role="alert" className="text-rhythm-danger">{logsErrorsByRound[roundId]} <button type="button" onClick={() => void loadLogsForRound(roundId)}>重试</button></p> : isLoadingLogs ? <p>加载记录中...</p> : logs.length === 0 ? <p>还没有记录，可返回详情补记后再复盘。</p> : (
            <div className="max-h-40 overflow-y-auto space-y-2">{[...logs].sort((a, b) => a.local_date.localeCompare(b.local_date)).map((log) => <p key={log.id} className="m-0 break-words">{log.local_date} · {{ done: '完成', partial: '做了一点', skipped: '没开始' }[log.status]}{log.note ? `：${log.note}` : ''}</p>)}</div>
          )}
        </section>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-rhythm-text-secondary tracking-tight block mb-1.5">
              真实情况 <span className="text-rhythm-text-muted">(实际做了什么)</span>
            </label>
            <textarea
              disabled={saving}
              value={reality}
              onChange={(e) => setReality(e.target.value)}
              placeholder="例如:7 天里完成 4 天,加班两天没做,周末反而坚持了"
              rows={2}
              className="w-full bg-rhythm-void/40 border border-rhythm-border rounded-xl px-3 py-2.5 text-sm text-rhythm-text-primary placeholder-rhythm-text-muted resize-none focus:outline-none focus:border-rhythm-border-strong"
            />
          </div>

          <div>
            <label className="text-xs text-rhythm-text-secondary tracking-tight block mb-1.5">
              效果怎样 <span className="text-rhythm-text-muted">(假设验证了吗)</span>
            </label>
            <textarea
              disabled={saving}
              value={effect}
              onChange={(e) => setEffect(e.target.value)}
              placeholder="例如:22:30 洗漱确实让入睡更快,但加班日很难做到"
              rows={2}
              className="w-full bg-rhythm-void/40 border border-rhythm-border rounded-xl px-3 py-2.5 text-sm text-rhythm-text-primary placeholder-rhythm-text-muted resize-none focus:outline-none focus:border-rhythm-border-strong"
            />
          </div>

          <div>
            <label className="text-xs text-rhythm-text-secondary tracking-tight block mb-1.5">
              下一轮怎么调整 <span className="text-rhythm-text-muted">(可选)</span>
            </label>
            <textarea
              disabled={saving}
              value={adjustment}
              onChange={(e) => setAdjustment(e.target.value)}
              placeholder="例如:把目标改成「工作日至少洗漱」,周末单独要求"
              rows={2}
              className="w-full bg-rhythm-void/40 border border-rhythm-border rounded-xl px-3 py-2.5 text-sm text-rhythm-text-primary placeholder-rhythm-text-muted resize-none focus:outline-none focus:border-rhythm-border-strong"
            />
          </div>
        </div>

        {error && <p className="text-xs text-rhythm-danger mt-3">{error}</p>}

        <div className="flex gap-2 mt-5">
          {mode === 'end' && (
            <button
              type="button"
              onClick={handleSkip}
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm bg-transparent border border-rhythm-border text-rhythm-text-secondary cursor-pointer disabled:opacity-50">
              跳过
            </button>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm bg-rhythm-glow-soft border border-rhythm-border-strong text-rhythm-glow cursor-pointer disabled:opacity-50">
            {saving ? '保存中...' : mode === 'end' ? '结束并保存' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}
