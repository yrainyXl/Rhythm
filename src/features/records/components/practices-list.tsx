'use client'

import { useEffect, useState } from 'react'
import { usePracticeStore } from '@/features/practice/store/practice-store'
import { PracticeFormSheet } from '@/features/practice/components/practice-form-sheet'
import { TabPlaceholder } from '@/features/records/components/tab-placeholder'

function formatRange(start: string, end: string): string {
  const parseM = (iso: string) => {
    const [, m, d] = iso.split('-').map(Number)
    return `${m}月${d}日`
  }
  return `${parseM(start)}–${parseM(end)}`
}

export function PracticesList() {
  const { practices, isLoadingPractices, loadPractices, endPractice, deletePractice } = usePracticeStore()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [confirmEnd, setConfirmEnd] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  useEffect(() => {
    loadPractices()
  }, [loadPractices])

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs bg-rhythm-glow-soft border border-rhythm-border-strong text-rhythm-glow cursor-pointer">
          <svg viewBox="0 0 24 24" className="w-3 h-3" style={{ stroke: 'currentColor', strokeWidth: 2.2, fill: 'none' }}>
            <path d="M12 5v14M5 12h14" />
          </svg>
          发起新实践
        </button>
      </div>

      {isLoadingPractices && (
        <div className="r-card p-6 text-center text-xs text-rhythm-text-muted">加载中...</div>
      )}

      {!isLoadingPractices && practices.length === 0 && (
        <TabPlaceholder
          title="还没有实践"
          hint="发起你的第一轮实践,记录假设和每日进展"
        />
      )}

      {practices.map((p) => {
        const active = p.status === 'active'
        const r = p.latestRound
        return (
          <div key={p.id} className="r-card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[0.6rem] tracking-[0.12em] uppercase ${
                active ? 'text-rhythm-glow' : 'text-rhythm-text-muted'
              }`}>
                {active ? '进行中' : '已完成'}
              </span>
              {r && (
                <span className="text-[0.62rem] text-rhythm-text-muted">
                  {formatRange(r.start_date, r.end_date)}
                </span>
              )}
            </div>
            <h3 className="font-serifsc text-[0.9rem] font-medium m-0 mb-1">{p.title}</h3>
            {p.assumption && (
              <p className="text-[0.72rem] text-rhythm-text-secondary leading-relaxed m-0 mb-2">
                {p.assumption}
              </p>
            )}
            <div className="flex items-center justify-between mt-2">
              {r && (
                <div className="text-[0.68rem] text-rhythm-text-muted">
                  第 <span className="font-serifsc text-rhythm-text-primary">{r.round_number}</span> 轮
                </div>
              )}
              <div className="flex gap-1 ml-auto">
                {active && confirmEnd === p.id ? (
                  <>
                    <button
                      type="button"
                      onClick={() => { endPractice(p.id); setConfirmEnd(null) }}
                      className="px-2 py-1 rounded text-[0.62rem] bg-rhythm-warn-soft border border-rhythm-warn text-rhythm-warn cursor-pointer">
                      确认结束
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmEnd(null)}
                      className="px-2 py-1 rounded text-[0.62rem] bg-transparent border border-rhythm-border text-rhythm-text-muted cursor-pointer">
                      取消
                    </button>
                  </>
                ) : confirmDelete === p.id ? (
                  <>
                    <button
                      type="button"
                      onClick={() => { deletePractice(p.id); setConfirmDelete(null) }}
                      className="px-2 py-1 rounded text-[0.62rem] bg-rhythm-danger-soft border border-rhythm-danger text-rhythm-danger cursor-pointer">
                      确认删除
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(null)}
                      className="px-2 py-1 rounded text-[0.62rem] bg-transparent border border-rhythm-border text-rhythm-text-muted cursor-pointer">
                      取消
                    </button>
                  </>
                ) : (
                  <>
                    {active && (
                      <button
                        type="button"
                        onClick={() => setConfirmEnd(p.id)}
                        aria-label="结束本轮"
                        title="结束"
                        className="px-2 py-1 rounded text-[0.62rem] bg-transparent border border-rhythm-border text-rhythm-text-muted cursor-pointer hover:border-rhythm-warn hover:text-rhythm-warn transition-colors">
                        结束
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(p.id)}
                      aria-label="删除"
                      title="删除"
                      className="w-6 h-6 grid place-items-center rounded bg-transparent border border-rhythm-border text-rhythm-text-muted cursor-pointer hover:border-rhythm-danger hover:text-rhythm-danger transition-colors">
                      <svg viewBox="0 0 24 24" className="w-3 h-3" style={{ stroke: 'currentColor', strokeWidth: 1.8, fill: 'none' }}>
                        <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )
      })}

      <PracticeFormSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  )
}
