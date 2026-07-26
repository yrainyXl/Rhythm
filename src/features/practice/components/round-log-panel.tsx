'use client'

import { useEffect, useState } from 'react'
import { usePracticeStore } from '@/features/practice/store/practice-store'

type LogStatus = 'done' | 'partial' | 'skipped'

const STATUS_META: Record<LogStatus, { label: string; dot: string; text: string }> = {
  done: { label: '完成', dot: 'bg-rhythm-success', text: 'text-rhythm-success' },
  partial: { label: '做了一点', dot: 'bg-rhythm-warn', text: 'text-rhythm-warn' },
  skipped: { label: '没开始', dot: 'bg-rhythm-danger', text: 'text-rhythm-danger' },
}

function totalDays(start: string, end: string): number {
  const [sy, sm, sd] = start.split('-').map(Number)
  const [ey, em, ed] = end.split('-').map(Number)
  const day = 1000 * 60 * 60 * 24
  return Math.round((new Date(ey, em - 1, ed).getTime() - new Date(sy, sm - 1, sd).getTime()) / day) + 1
}

function shortDate(iso: string): string {
  const [, m, d] = iso.split('-')
  return `${Number(m)}/${Number(d)}`
}

/**
 * 实践详情页:某一轮的日志面板。
 * 折叠态显示「X 条记录」;展开后显示汇总(记录/总天数 + 三态分布)+ 日志列表。
 * 不再渲染逐日方格,避免长周期(如 16 天)出现大量方框。
 */
export function RoundLogPanel({
  roundId,
  startDate,
  endDate,
  logCount,
}: {
  roundId: string
  startDate: string
  endDate: string
  logCount: number
}) {
  const { logsByRound, loadLogsForRound } = usePracticeStore()
  const [expanded, setExpanded] = useState(false)

  // 展开时加载该轮日志(折叠态不请求,省一次往返)
  useEffect(() => {
    if (expanded && !logsByRound[roundId]) {
      loadLogsForRound(roundId)
    }
  }, [expanded, roundId, logsByRound, loadLogsForRound])

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="text-[0.66rem] text-rhythm-text-muted hover:text-rhythm-glow cursor-pointer"
      >
        {logCount} 条记录 · 展开
      </button>
    )
  }

  const logs = logsByRound[roundId] ?? []
  const total = totalDays(startDate, endDate)
  const counts = { done: 0, partial: 0, skipped: 0 }
  for (const l of logs) counts[l.status]++

  return (
    <div className="space-y-2.5">
      {/* 汇总 */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.62rem] text-rhythm-text-muted">
        <span>
          已记录 <span className="text-rhythm-text-secondary">{logs.length}</span> / {total} 天
        </span>
        {counts.done > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rhythm-success" />完成 {counts.done}
          </span>
        )}
        {counts.partial > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rhythm-warn" />一点 {counts.partial}
          </span>
        )}
        {counts.skipped > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rhythm-danger" />没开始 {counts.skipped}
          </span>
        )}
      </div>

      {/* 日志列表 */}
      {logs.length > 0 ? (
        <div className="space-y-1.5">
          {logs.map((log) => {
            const meta = STATUS_META[log.status]
            return (
              <div key={log.id} className="flex gap-2 px-2 py-1.5 rounded-lg bg-rhythm-void/30">
                <span className={`flex-none w-1.5 h-1.5 rounded-full mt-1 ${meta.dot}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[0.66rem] text-rhythm-text-secondary">{shortDate(log.local_date)}</span>
                    <span className={`text-[0.6rem] ${meta.text}`}>{meta.label}</span>
                  </div>
                  {log.note ? (
                    <p className="text-[0.7rem] text-rhythm-text-secondary leading-relaxed m-0 mt-0.5 break-words">
                      {log.note}
                    </p>
                  ) : (
                    <p className="text-[0.7rem] text-rhythm-text-faint leading-relaxed m-0 mt-0.5">
                      无补充说明
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="px-2 py-3 rounded-lg bg-rhythm-void/30 flex items-center justify-center">
          <p className="text-[0.66rem] text-rhythm-text-muted m-0">还没有记录</p>
        </div>
      )}

      <button
        type="button"
        onClick={() => setExpanded(false)}
        className="text-[0.62rem] text-rhythm-text-muted hover:text-rhythm-text-secondary cursor-pointer"
      >
        收起
      </button>
    </div>
  )
}
