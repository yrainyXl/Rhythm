'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePracticeStore } from '@/features/practice/store/practice-store'
import { DirectionFormSheet } from '@/features/practice/components/direction-form-sheet'

export function DirectionsList() {
  const { directions, isLoadingDirections, loadDirections, archiveDirection, deleteDirection } = usePracticeStore()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  useEffect(() => {
    loadDirections()
  }, [loadDirections])

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <Link href="/habits" className="flex items-center gap-1 text-xs text-rhythm-text-muted hover:text-rhythm-text-primary transition-colors">
          <svg viewBox="0 0 24 24" className="w-3 h-3" style={{ stroke: 'currentColor', strokeWidth: 2, fill: 'none' }}>
            <path d="M15 18l-6-6 6-6" />
          </svg>
          返回计划
        </Link>
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs bg-rhythm-glow-soft border border-rhythm-border-strong text-rhythm-glow cursor-pointer">
          <svg viewBox="0 0 24 24" className="w-3 h-3" style={{ stroke: 'currentColor', strokeWidth: 2.2, fill: 'none' }}>
            <path d="M12 5v14M5 12h14" />
          </svg>
          新建方向
        </button>
      </div>

      <div>
        <h1 className="font-serifsc text-lg font-medium m-0">长期方向</h1>
        <p className="text-xs text-rhythm-text-muted mt-1">
          共 {directions.length} 个 · 回答：我想逐渐成为怎样、生活想往哪里走
        </p>
      </div>

      {isLoadingDirections && (
        <div className="r-card p-6 text-center text-xs text-rhythm-text-muted">加载中...</div>
      )}

      {!isLoadingDirections && directions.length === 0 && (
        <div className="r-card p-8 text-center">
          <p className="text-sm text-rhythm-text-secondary">还没有长期方向</p>
          <p className="text-xs text-rhythm-text-muted mt-1">方向会从议题与实践中逐渐形成，也可以主动定义</p>
        </div>
      )}

      <div className="space-y-2">
        {directions.map((d) => (
          <div key={d.id} className="r-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="font-serifsc text-sm font-normal text-rhythm-text-primary leading-relaxed tracking-tight m-0">
                  {d.title}
                </p>
                {d.description && (
                  <p className="text-xs text-rhythm-text-secondary mt-2 leading-relaxed">
                    {d.description}
                  </p>
                )}
              </div>
              {confirmDelete === d.id ? (
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => { deleteDirection(d.id); setConfirmDelete(null) }}
                    className="px-2 py-1 rounded text-[0.62rem] bg-rhythm-danger-soft border border-rhythm-danger text-rhythm-danger cursor-pointer">
                    确认删除
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(null)}
                    className="px-2 py-1 rounded text-[0.62rem] bg-transparent border border-rhythm-border text-rhythm-text-muted cursor-pointer">
                    取消
                  </button>
                </div>
              ) : (
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => archiveDirection(d.id)}
                    aria-label="归档"
                    title="归档"
                    className="w-7 h-7 grid place-items-center rounded-full bg-transparent border border-rhythm-border text-rhythm-text-muted cursor-pointer hover:border-rhythm-border-strong hover:text-rhythm-text-secondary transition-colors">
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" style={{ stroke: 'currentColor', strokeWidth: 1.8, fill: 'none' }}>
                      <path d="M21 8v13H3V8" />
                      <path d="M1 3h22v5H1z" />
                      <path d="M10 12h4" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(d.id)}
                    aria-label="删除"
                    title="删除"
                    className="w-7 h-7 grid place-items-center rounded-full bg-transparent border border-rhythm-border text-rhythm-text-muted cursor-pointer hover:border-rhythm-danger hover:text-rhythm-danger transition-colors">
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" style={{ stroke: 'currentColor', strokeWidth: 1.8, fill: 'none' }}>
                      <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
            <div className="mt-2 text-[0.6rem] text-rhythm-text-muted tracking-tight">
              建立于 {new Date(d.created_at).toLocaleDateString('zh-CN')}
            </div>
          </div>
        ))}
      </div>

      <DirectionFormSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  )
}