'use client'

import { useEffect, useRef, useState } from 'react'
import { usePracticeStore } from '@/features/practice/store/practice-store'

type Status = 'confirmed' | 'validating'

const STATUS_OPTIONS: { value: Status; label: string; hint: string }[] = [
  { value: 'validating', label: '验证中', hint: '还在观察是否稳定有效' },
  { value: 'confirmed', label: '已确认', hint: '在多次实践后验证有效' },
]

export function MethodFormSheet({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { createMethod } = usePracticeStore()
  const [title, setTitle] = useState('')
  const [condition, setCondition] = useState('')
  const [status, setStatus] = useState<Status>('validating')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const savingRef = useRef(false)
  const closeRef = useRef(onClose)
  savingRef.current = saving
  closeRef.current = onClose

  useEffect(() => {
    if (open) {
      setTitle('')
      setCondition('')
      setStatus('validating')
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
    const result = await createMethod({ title, condition, status })
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
        aria-labelledby="method-form-sheet-title"
        tabIndex={-1}
        className="r-sheet"
        style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 id="method-form-sheet-title" className="text-[22px] font-semibold text-rhythm-text-primary m-0">写下一个方法</h3>
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
            <label className="r-field-label">方法</label>
            <input
              aria-label="方法"
              name="method-form-sheet-0"
              autoComplete="off"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如:晚上把行动缩到 15 分钟"
                            className="r-input min-h-11"
            />
          </div>

          <div>
            <label className="r-field-label">
              适用条件 <span className="text-rhythm-text-muted">(可选)</span>
            </label>
            <textarea
              aria-label="适用条件"
              name="method-form-sheet-1"
              autoComplete="off"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              placeholder="例如:工作日晚上、疲惫状态下更适用"
              rows={3}
              className="r-input resize-none"
            />
          </div>

          <div>
            <label className="r-field-label">状态</label>
            <div className="space-y-2">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStatus(s.value)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl border cursor-pointer transition-colors ${
                    status === s.value
                      ? 'bg-rhythm-glow-soft border-rhythm-border-strong'
                      : 'bg-transparent border-rhythm-border hover:border-rhythm-border-strong'
                  }`}>
                  <div className={`text-sm ${status === s.value ? 'text-rhythm-glow' : 'text-rhythm-text-primary'}`}>
                    {s.label}
                  </div>
                  <div className="text-xs text-rhythm-text-muted mt-0.5">{s.hint}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <p role="alert" className="text-sm text-rhythm-danger mt-3">{error}</p>
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
            disabled={saving || !title.trim()}
            className="flex-1 min-h-11 py-2.5 rounded-xl text-sm r-btn-primary disabled:opacity-50">
            {saving ? '保存中…' : '保存方法'}
          </button>
        </div>
      </div>
    </div>
  )
}
