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
  const { practices, isLoadingPractices, practicesError, loadPractices, endPractice, deletePractice } = usePracticeStore()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [confirmEnd, setConfirmEnd] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const [pending, setPending] = useState(false)
  const [actionError, setActionError] = useState<{ id: string; message: string } | null>(null)

  async function mutate(id: string, action: 'end' | 'delete') {
    setPending(true)
    setActionError(null)
    try {
      const result = await (action === 'end' ? endPractice(id) : deletePractice(id))
      if (result.error) setActionError({ id, message: result.error })
      else { setConfirmEnd(null); setConfirmDelete(null) }
    } catch {
      setActionError({ id, message: '操作失败，请重试' })
    } finally { setPending(false) }
  }

  useEffect(() => {
    loadPractices()
  }, [loadPractices])

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="r-link flex items-center gap-2">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5" style={{ stroke: 'currentColor', strokeWidth: 2.2, fill: 'none' }}>
            <path d="M12 5v14M5 12h14" />
          </svg>
          创建实践
        </button>
      </div>

      {isLoadingPractices && (
        <div role="status" className="py-6 text-sm text-rhythm-text-secondary">正在加载实践…</div>
      )}

      {practicesError && <div role="alert" className="py-3 text-sm text-rhythm-danger">{practicesError}<button type="button" onClick={loadPractices} className="r-link ml-3">重试</button></div>}

      {!isLoadingPractices && !practicesError && practices.length === 0 && (
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
          <div key={p.id} className="border-b border-rhythm-border py-5 first:pt-2">
            <Link href={`/habits/practices/${p.id}`} className="group block rounded-lg no-underline text-rhythm-text-primary transition-colors hover:text-rhythm-glow">
              <div className="flex flex-wrap gap-2 items-center justify-between mb-2 text-xs text-rhythm-text-secondary">
                <span>{active ? '进行中' : '已结束'}</span>
                {r && <span>{formatRange(r.start_date, r.end_date)}</span>}
              </div>
              <div className="flex items-center gap-3 justify-between">
                <h3 className="text-lg font-semibold leading-snug break-words">{p.title}</h3>
                <span aria-hidden="true" className="text-lg shrink-0 text-rhythm-text-muted group-hover:text-rhythm-glow">→</span>
              </div>
              {p.assumption && <p className="text-sm text-rhythm-text-secondary leading-relaxed mt-2">{p.assumption}</p>}
              {dayInfo && <p className="text-xs text-rhythm-text-secondary mt-1">已进行 {dayInfo.elapsed} 天 · 本次计划 {dayInfo.total} 天</p>}
            </Link>
            <div className="flex flex-wrap gap-2 justify-end mt-1">
                {active && confirmEnd === p.id ? (
                  <>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => mutate(p.id, 'end')}
                      className="min-h-[44px] px-3 py-2 rounded-xl text-sm bg-rhythm-warn-soft border border-rhythm-warn text-rhythm-warn cursor-pointer">
                      {pending ? '正在结束…' : '确认结束'}
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => { setConfirmEnd(null); setActionError(null) }}
                      className="min-h-[44px] px-3 py-2 rounded-xl text-sm bg-transparent border border-rhythm-border text-rhythm-text-secondary cursor-pointer">
                      取消
                    </button>
                  </>
                ) : confirmDelete === p.id ? (
                  <>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => mutate(p.id, 'delete')}
                      className="min-h-[44px] px-3 py-2 rounded-xl text-sm bg-rhythm-danger-soft border border-rhythm-danger text-rhythm-danger cursor-pointer">
                      {pending ? '正在删除…' : '确认删除'}
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => { setConfirmDelete(null); setActionError(null) }}
                      className="min-h-[44px] px-3 py-2 rounded-xl text-sm bg-transparent border border-rhythm-border text-rhythm-text-secondary cursor-pointer">
                      取消
                    </button>
                  </>
                ) : (
                  <>
                    {active && (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => { setConfirmEnd(p.id); setConfirmDelete(null); setActionError(null) }}
                        aria-label={`结束实践：${p.title}`}
                        title="结束"
                        className="min-h-[44px] px-3 py-2 rounded-xl text-sm bg-transparent text-rhythm-text-secondary cursor-pointer hover:bg-rhythm-glow-soft hover:text-rhythm-glow transition-colors">
                        结束
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => { setConfirmDelete(p.id); setConfirmEnd(null); setActionError(null) }}
                      aria-label={`删除实践：${p.title}`}
                      title="删除"
                      className="w-11 h-11 grid place-items-center rounded-xl bg-transparent text-rhythm-text-secondary cursor-pointer hover:bg-rhythm-danger-soft hover:text-rhythm-danger transition-colors">
                      <svg viewBox="0 0 24 24" className="w-4 h-4" style={{ stroke: 'currentColor', strokeWidth: 1.8, fill: 'none' }}>
                        <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
              {actionError?.id === p.id && <p role="alert" className="text-sm text-rhythm-danger mt-1">{actionError.message}</p>}
          </div>
        )
      })}

      <PracticeFormSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  )
}
