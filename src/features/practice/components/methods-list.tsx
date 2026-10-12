'use client'

import { useEffect, useState } from 'react'
import { usePracticeStore } from '@/features/practice/store/practice-store'
import { MethodFormSheet } from '@/features/practice/components/method-form-sheet'

const STATUS_META: Record<string, { label: string; className: string }> = {
  confirmed: {
    label: '已确认',
    className: 'text-rhythm-success bg-rhythm-success-soft border-rhythm-success',
  },
  validating: {
    label: '验证中',
    className: 'text-rhythm-warn bg-rhythm-warn-soft border-rhythm-warn',
  },
}

export function MethodsList() {
  const { methods, isLoadingMethods, loadMethods, updateMethodStatus, deleteMethod } = usePracticeStore()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  useEffect(() => {
    loadMethods()
  }, [loadMethods])

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="r-btn-primary gap-2">
          <svg viewBox="0 0 24 24" className="w-4 h-4" style={{ stroke: 'currentColor', strokeWidth: 2.2, fill: 'none' }}>
            <path d="M12 5v14M5 12h14" />
          </svg>
          写下方法
        </button>
      </div>

      {isLoadingMethods && (
        <div className="py-6 text-center text-sm text-rhythm-text-muted">加载中…</div>
      )}

      {!isLoadingMethods && methods.length === 0 && (
        <div className="rounded-2xl bg-rhythm-glow-soft p-6 text-center">
          <p className="text-sm text-rhythm-text-secondary">还没有方法</p>
          <p className="text-sm text-rhythm-text-secondary mt-2">从实践复盘中沉淀真正有效的做法</p>
        </div>
      )}

      {methods.map((m) => {
        const meta = STATUS_META[m.status] ?? STATUS_META.validating
        const toggleTarget: 'confirmed' | 'validating' = m.status === 'confirmed' ? 'validating' : 'confirmed'
        const toggleLabel = m.status === 'confirmed' ? '改为验证中' : '标记已确认'
        return (
          <div key={m.id} className="py-5 border-b border-rhythm-border">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs  px-2 py-0.5 rounded-full border ${meta.className}`}>
                {meta.label}
              </span>
              <span className="text-sm text-rhythm-text-muted">
                {new Date(m.created_at).toLocaleDateString('zh-CN')}
              </span>
            </div>
            <h3 className="text-lg font-semibold m-0 mb-1 leading-relaxed">{m.title}</h3>
            {m.condition && (
              <p className="text-sm text-rhythm-text-secondary leading-relaxed m-0 mb-3">
                <span className="text-rhythm-text-muted tracking-wider">适用　</span>{m.condition}
              </p>
            )}
            <div className="flex items-center justify-end gap-1 mt-2">
              {confirmDelete === m.id ? (
                <>
                  <button
                    type="button"
                    onClick={() => { deleteMethod(m.id); setConfirmDelete(null) }}
                    className="min-h-11 px-3 py-2 rounded-lg text-sm bg-rhythm-danger-soft border border-rhythm-danger text-rhythm-danger cursor-pointer">
                    确认删除
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(null)}
                    className="min-h-11 px-3 py-2 rounded-lg text-sm bg-transparent border border-rhythm-border text-rhythm-text-muted cursor-pointer">
                    取消
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => updateMethodStatus(m.id, toggleTarget)}
                    className="min-h-11 px-3 py-2 rounded-lg text-sm bg-transparent border border-rhythm-border text-rhythm-text-muted cursor-pointer hover:border-rhythm-border-strong hover:text-rhythm-text-secondary transition-colors">
                    {toggleLabel}
                  </button>
                  <button
                    type="button"
                    onClick={() => updateMethodStatus(m.id, 'archived')}
                    aria-label="归档"
                    title="归档"
                    className="w-11 h-11 grid place-items-center rounded-xl bg-transparent border-0 text-rhythm-text-muted cursor-pointer hover:border-rhythm-border-strong hover:text-rhythm-text-secondary transition-colors">
                    <svg viewBox="0 0 24 24" className="w-4 h-4" style={{ stroke: 'currentColor', strokeWidth: 1.8, fill: 'none' }}>
                      <path d="M21 8v13H3V8" />
                      <path d="M1 3h22v5H1z" />
                      <path d="M10 12h4" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(m.id)}
                    aria-label="删除"
                    title="删除"
                    className="w-11 h-11 grid place-items-center rounded-xl bg-transparent border-0 text-rhythm-text-muted cursor-pointer hover:border-rhythm-danger hover:text-rhythm-danger transition-colors">
                    <svg viewBox="0 0 24 24" className="w-4 h-4" style={{ stroke: 'currentColor', strokeWidth: 1.8, fill: 'none' }}>
                      <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          </div>
        )
      })}

      <MethodFormSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  )
}
