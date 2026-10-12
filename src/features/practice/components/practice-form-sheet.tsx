'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { usePracticeStore } from '@/features/practice/store/practice-store'
import { Dropdown } from '@/features/practice/components/dropdown'

const PERIOD_PRESETS = [
  { label: '7 天', value: 7 },
  { label: '14 天', value: 14 },
  { label: '21 天', value: 21 },
] as const

export function PracticeFormSheet({
  open,
  onClose,
  initialTitle,
  initialAssumption,
  sourceHighlightId,
  sourceLabel,
  sourceExcerpt,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  initialTitle?: string
  initialAssumption?: string
  sourceHighlightId?: string
  sourceLabel?: string
  sourceExcerpt?: string
  onCreated?: (practiceId: string) => void
}) {
  const { topics, loadTopics, createPractice } = usePracticeStore()
  const [title, setTitle] = useState('')
  const [assumption, setAssumption] = useState('')
  const [topicId, setTopicId] = useState<string>('')
  const [periodDays, setPeriodDays] = useState<number>(7)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLInputElement>(null)
  const actionRef = useRef<HTMLTextAreaElement>(null)
  const errorRef = useRef<HTMLParagraphElement>(null)
  const submittingRef = useRef(false)
  const savingRef = useRef(false)
  const closeRef = useRef(onClose)
  savingRef.current = saving
  closeRef.current = onClose

  const topicOptions = useMemo(
    () => [{ value: '', label: '不关联' }, ...topics.map((t) => ({ value: t.id, label: t.question }))],
    [topics],
  )

  useEffect(() => {
    if (open) {
      setTitle(initialTitle ?? '')
      setAssumption(initialAssumption ?? '')
      setTopicId('')
      setPeriodDays(7)
      setError(null)
      loadTopics()
    }
  }, [open, initialTitle, initialAssumption, loadTopics])

  useEffect(() => {
    if (!open) return
    const previousFocus = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    // Focus the dialog on touch devices without immediately opening the keyboard.
    const frame = requestAnimationFrame(() => {
      if (window.matchMedia('(pointer: fine)').matches) titleRef.current?.focus()
      else dialogRef.current?.focus()
    })
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !savingRef.current) { e.preventDefault(); closeRef.current() }
      if (e.key !== 'Tab') return
      const nodes = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex="0"]') ?? [])
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (!first) { e.preventDefault(); dialogRef.current?.focus(); return }
      if (e.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && (document.activeElement === last || document.activeElement === dialogRef.current)) { e.preventDefault(); first.focus() }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      cancelAnimationFrame(frame)
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKey)
      if (previousFocus?.isConnected) previousFocus.focus()
    }
  }, [open])

  useEffect(() => {
    if (error) errorRef.current?.focus()
  }, [error])

  const handleSubmit = async () => {
    if (submittingRef.current || !title.trim()) return
    if (sourceHighlightId && !assumption.trim()) {
      actionRef.current?.focus()
      setError('请写下本轮具体行动与想观察的变化')
      return
    }
    setError(null)
    submittingRef.current = true
    setSaving(true)
    try {
      const result = await createPractice({ title, topicId: topicId || null, assumption, periodDays, sourceHighlightId })
      if (result.error) { setError(result.error); return }
      onClose()
      if (result.practiceId) onCreated?.(result.practiceId)
    } catch {
      setError('暂时无法保存，请重试。填写的内容已保留。')
    } finally {
      submittingRef.current = false
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-rhythm-void/70 backdrop-blur-sm"
      onClick={() => { if (!saving) onClose() }}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="practice-form-title"
        tabIndex={-1}
        className="overscroll-contain r-sheet"
        style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 id="practice-form-title" className="text-[22px] font-semibold text-rhythm-text-primary m-0">发起新实践</h3>
          <button
            type="button"
            aria-label="关闭"
            onClick={() => { if (!saving) onClose() }}
            className="w-11 h-11 grid place-items-center rounded-full bg-transparent border-0 cursor-pointer text-rhythm-text-muted hover:text-rhythm-text-primary transition-colors">
            <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true" style={{ stroke: 'currentColor', strokeWidth: 1.8, fill: 'none' }}>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {sourceLabel && (
          <div className="mb-4 flex items-start gap-2 text-sm text-rhythm-text-secondary bg-rhythm-void/40 border border-rhythm-border rounded-xl px-3 py-2">
            <span aria-hidden="true">📌</span>
            <div><span>{sourceLabel}</span>
              {sourceExcerpt && <p className="mt-2 mb-0 whitespace-pre-wrap leading-relaxed">{sourceExcerpt}</p>}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="practice-title" className="r-field-label">实践名称</label>
            <input
              ref={titleRef}
              id="practice-title"
              name="practiceTitle"
              autoComplete="off"
              required
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如:找回工作日晚上的主动权"
              className="r-input min-h-11"
            />
          </div>

          <fieldset className="border-0 p-0 m-0">
            <legend className="r-field-label">
              关联议题 <span className="text-rhythm-text-muted">(可选)</span>
            </legend>
            {topics.length === 0 ? (
              <p className="text-sm text-rhythm-text-secondary py-2">还没有议题,可以先去「计划 → 议题」创建</p>
            ) : (
              <Dropdown
                value={topicId}
                onChange={setTopicId}
                options={topicOptions}
                placeholder="选择议题"
              />
            )}
          </fieldset>

          <div>
            <label htmlFor="practice-action" className="r-field-label">
              这次想尝试什么 <span className="text-rhythm-text-muted">{sourceHighlightId ? '(必填)' : '(可选)'}</span>
            </label>
            <textarea
              ref={actionRef}
              id="practice-action"
              name="practiceAction"
              autoComplete="off"
              required={!!sourceHighlightId}
              value={assumption}
              onChange={(e) => setAssumption(e.target.value)}
              placeholder="把书中的启发变成具体行动：什么时候做什么，想观察什么变化？"
              rows={3}
              className="r-input resize-none"
            />
          </div>

          <fieldset className="border-0 p-0 m-0">
            <legend className="r-field-label">尝试多久</legend>
            <div className="flex gap-2">
              {PERIOD_PRESETS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  aria-pressed={periodDays === p.value}
                  onClick={() => setPeriodDays(p.value)}
                  className={`flex-1 min-h-11 py-2 rounded-xl text-sm border cursor-pointer transition-colors ${
                    periodDays === p.value
                      ? 'bg-rhythm-glow-soft border-rhythm-border-strong text-rhythm-glow'
                      : 'bg-transparent border-rhythm-border text-rhythm-text-muted hover:text-rhythm-text-secondary'
                  }`}>
                  {p.label}
                </button>
              ))}
            </div>
          </fieldset>
        </div>

        {error && (
          <p ref={errorRef} role="alert" tabIndex={-1} className="text-sm text-rhythm-danger mt-3">{error}</p>
        )}

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
            disabled={saving || !title.trim() || (!!sourceHighlightId && !assumption.trim())}
            className="r-btn-primary flex-1 disabled:opacity-50">
            {saving ? '保存中…' : '发起实践'}
          </button>
        </div>
      </div>
    </div>
  )
}
