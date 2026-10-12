'use client'

import { useEffect, useRef, useState } from 'react'
import { usePracticeStore } from '@/features/practice/store/practice-store'

export function TopicFormSheet({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { createTopic } = usePracticeStore()
  const [question, setQuestion] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const savingRef = useRef(false)
  const closeRef = useRef(onClose)
  savingRef.current = saving
  closeRef.current = onClose

  useEffect(() => {
    if (open) {
      setQuestion('')
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

  const handleSubmit = async () => {
    if (savingRef.current) return
    setError(null)
    savingRef.current = true
    setSaving(true)
    const result = await createTopic(question)
    savingRef.current = false
    setSaving(false)
    if (result.error) {
      setError(result.error)
      return
    }
    onClose()
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
        aria-labelledby="topic-form-sheet-title"
        tabIndex={-1}
        className="r-sheet"
        style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 id="topic-form-sheet-title" className="text-[22px] font-semibold text-rhythm-text-primary m-0">新建议题</h3>
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

        <p className="text-sm text-rhythm-text-secondary mb-2 tracking-tight">
          用一个真实的问题描述你想理解的事情。
        </p>

        <label className="r-field-label" htmlFor="topic-question">你想理解的问题</label>
        <textarea
          id="topic-question"
              aria-label="议题"
              name="topic-form-sheet-0"
              autoComplete="off"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="例如:为什么下班回家后总会陷入游戏和手机?"
          rows={3}
                    className="r-input resize-none"
        />

        {error && (
          <p role="alert" className="text-sm text-rhythm-danger mt-2">{error}</p>
        )}

        <div className="flex gap-2 mt-4">
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
            disabled={saving || !question.trim()}
            className="flex-1 min-h-11 py-2.5 rounded-xl text-sm r-btn-primary disabled:opacity-50">
            {saving ? '保存中…' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}
