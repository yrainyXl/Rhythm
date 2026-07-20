'use client'

import { useEffect, useState } from 'react'
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
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const handleSubmit = async () => {
    setError(null)
    setSaving(true)
    const result = await createMethod({ title, condition, status })
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
      onClick={onClose}>
      <div
        className="w-full sm:max-w-md p-5 rounded-t-2xl sm:rounded-2xl bg-rhythm-card border-t sm:border border-rhythm-border-strong max-h-[85vh] overflow-y-auto"
        style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serifsc text-base font-medium text-rhythm-text-primary m-0">写下一个方法</h3>
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
            <label className="text-xs text-rhythm-text-secondary tracking-tight block mb-1.5">方法</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如:晚上把行动缩到 15 分钟"
              autoFocus
              className="w-full bg-rhythm-void/40 border border-rhythm-border rounded-xl px-3 py-2.5 text-sm text-rhythm-text-primary placeholder-rhythm-text-muted focus:outline-none focus:border-rhythm-border-strong"
            />
          </div>

          <div>
            <label className="text-xs text-rhythm-text-secondary tracking-tight block mb-1.5">
              适用条件 <span className="text-rhythm-text-muted">(可选)</span>
            </label>
            <textarea
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              placeholder="例如:工作日晚上、疲惫状态下更适用"
              rows={3}
              className="w-full bg-rhythm-void/40 border border-rhythm-border rounded-xl px-3 py-2.5 text-sm text-rhythm-text-primary placeholder-rhythm-text-muted resize-none focus:outline-none focus:border-rhythm-border-strong"
            />
          </div>

          <div>
            <label className="text-xs text-rhythm-text-secondary tracking-tight block mb-1.5">状态</label>
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
                  <div className="text-[0.68rem] text-rhythm-text-muted mt-0.5">{s.hint}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <p className="text-xs text-rhythm-danger mt-3">{error}</p>
        )}

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
            disabled={saving || !title.trim()}
            className="flex-1 py-2.5 rounded-xl text-sm bg-rhythm-glow-soft border border-rhythm-border-strong text-rhythm-glow cursor-pointer disabled:opacity-50">
            {saving ? '保存中...' : '保存方法'}
          </button>
        </div>
      </div>
    </div>
  )
}
