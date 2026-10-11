'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
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

function daysBetween(start: string, end: string) {
  const [sy, sm, sd] = start.split('-').map(Number)
  const [ey, em, ed] = end.split('-').map(Number)
  const startD = new Date(sy, sm - 1, sd)
  const endD = new Date(ey, em - 1, ed)
  const now = new Date()
  const day = 1000 * 60 * 60 * 24
  const total = Math.round((endD.getTime() - startD.getTime()) / day) + 1
  const elapsed = Math.min(total, Math.max(1, Math.floor((now.getTime() - startD.getTime()) / day) + 1))
  return { total, elapsed }
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
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="r-btn-primary flex items-center gap-2">
          <svg viewBox="0 0 24 24" className="w-4 h-4" style={{ stroke: 'currentColor', strokeWidth: 2.2, fill: 'none' }}>
            <path d="M12 5v14M5 12h14" />
          </svg>
          创建实践
        </button>
      </div>

      {isLoadingPractices && (
        <div className="py-6 text-sm text-rhythm-text-secondary">加载中...</div>
      )}

      {!isLoadingPractices && practices.length === 0 && (
        <TabPlaceholder
          title="还没有实践"
          hint="尝试一个小行动，留下每天的结果"
        />
      )}

      {practices.map((p) => {
        const active = p.status === 'active'
        const r = p.latestRound
        const dayInfo = r && active ? daysBetween(r.start_date, r.end_date) : null
        return (
          <div key={p.id} className="r-panel">
            <Link href={`/habits/practices/${p.id}`} className="block no-underline text-rhythm-text-primary">
              <div className="flex flex-wrap gap-2 items-center justify-between mb-3 text-xs text-rhythm-text-secondary">
                <span>{active ? '进行中' : '已结束'}</span>
                {r && <span>{formatRange(r.start_date, r.end_date)}</span>}
              </div>
              <div className="flex min-h-[44px] items-start gap-3 justify-between">
                <h3 className="text-xl font-semibold leading-snug break-words">{p.title}</h3>
                <span aria-hidden="true" className="text-xl shrink-0">→</span>
              </div>
              {p.assumption && <p className="text-sm text-rhythm-text-secondary leading-relaxed mt-2">{p.assumption}</p>}
              {dayInfo && <p className="text-xs text-rhythm-text-secondary mt-3">已进行 {dayInfo.elapsed} 天 · 本次计划 {dayInfo.total} 天</p>}
            </Link>
            <div className="flex flex-wrap gap-2 justify-end mt-4">
                {active && confirmEnd === p.id ? (
                  <>
                    <button
                      type="button"
                      onClick={() => { endPractice(p.id); setConfirmEnd(null) }}
                      className="min-h-[44px] px-3 py-2 rounded-xl text-sm bg-rhythm-warn-soft border border-rhythm-warn text-rhythm-warn cursor-pointer">
                      确认结束
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmEnd(null)}
                      className="min-h-[44px] px-3 py-2 rounded-xl text-sm bg-transparent border border-rhythm-border text-rhythm-text-secondary cursor-pointer">
                      取消
                    </button>
                  </>
                ) : confirmDelete === p.id ? (
                  <>
                    <button
                      type="button"
                      onClick={() => { deletePractice(p.id); setConfirmDelete(null) }}
                      className="min-h-[44px] px-3 py-2 rounded-xl text-sm bg-rhythm-danger-soft border border-rhythm-danger text-rhythm-danger cursor-pointer">
                      确认删除
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(null)}
                      className="min-h-[44px] px-3 py-2 rounded-xl text-sm bg-transparent border border-rhythm-border text-rhythm-text-secondary cursor-pointer">
                      取消
                    </button>
                  </>
                ) : (
                  <>
                    {active && (
                      <button
                        type="button"
                        onClick={() => setConfirmEnd(p.id)}
                        aria-label={`结束实践：${p.title}`}
                        title="结束"
                        className="min-h-[44px] px-3 py-2 rounded-xl text-sm bg-transparent border border-rhythm-border text-rhythm-text-secondary cursor-pointer hover:border-rhythm-warn hover:text-rhythm-warn transition-colors">
                        结束
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(p.id)}
                      aria-label={`删除实践：${p.title}`}
                      title="删除"
                      className="w-11 h-11 grid place-items-center rounded-xl bg-transparent border border-rhythm-border text-rhythm-text-secondary cursor-pointer hover:border-rhythm-danger hover:text-rhythm-danger transition-colors">
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

      <PracticeFormSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  )
}
