'use client'

import { useState } from 'react'
import type { PracticeRound } from '@/features/practice/store/practice-store'
import { ReviewFormSheet } from '@/features/practice/components/review-form-sheet'

function formatRange(start: string, end: string): string {
  const parseM = (iso: string) => {
    const [, m, d] = iso.split('-').map(Number)
    return `${m}月${d}日`
  }
  return `${parseM(start)}–${parseM(end)}`
}

/**
 * 实践复盘时间线:按轮次正序(round_number asc)线性展示。
 * 每轮一个卡片:实践内容(假设/周期/日志汇总)-> 复盘(真实/效果/调整),缺失则提供补填入口。
 */
export function ReviewTimeline({
  rounds,
  practiceAssumption,
  onReviewSaved,
}: {
  rounds: (PracticeRound & { log_count: number })[]
  practiceAssumption: string | null
  onReviewSaved?: () => void
}) {
  const [reviewTarget, setReviewTarget] = useState<{ roundId: string; roundNumber: number } | null>(null)

  // 正序:第 1 轮在最上
  const ordered = [...rounds].sort((a, b) => a.round_number - b.round_number)

  const targetRound = reviewTarget
    ? ordered.find((r) => r.id === reviewTarget.roundId)
    : null

  return (
    <div className="space-y-2">
      {ordered.map((r, idx) => {
        const hasReview = !!(r.review_reality || r.review_effect || r.review_adjustment)
        return (
          <div key={r.id} className="relative pl-5">
            {/* 时间线轴 + 节点 */}
            <span className="absolute left-1.5 top-3 w-2 h-2 rounded-full bg-rhythm-glow/70" />
            {idx < ordered.length - 1 && (
              <span className="absolute left-2 top-5 bottom-0 w-px bg-rhythm-border-strong" />
            )}

            <div className="pb-5 border-b border-rhythm-border">
              {/* 实践内容 */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-base font-semibold text-rhythm-glow">
                  第 {r.round_number} 轮
                </span>
                <span className="text-xs text-rhythm-text-muted">
                  {formatRange(r.start_date, r.end_date)} · {r.log_count} 条记录
                </span>
              </div>
              <div className="text-sm text-rhythm-text-secondary leading-relaxed my-3">
                {r.assumption ?? practiceAssumption ?? '—'}
              </div>

              {/* 复盘 */}
              {hasReview ? (
                <details className="space-y-3">
                  <summary className="min-h-[44px] cursor-pointer text-sm text-rhythm-text-primary">{r.review_effect || r.review_reality || '查看复盘'} <span className="text-rhythm-glow">· 展开</span></summary>
                  {r.review_reality && (
                    <ReviewField label="真实情况" value={r.review_reality} />
                  )}
                  {r.review_effect && (
                    <ReviewField label="效果" value={r.review_effect} />
                  )}
                  {r.review_adjustment && (
                    <ReviewField label="下一轮调整" value={r.review_adjustment} />
                  )}
                  <button
                    type="button"
                    disabled={r.status === 'active'}
                    onClick={() => setReviewTarget({ roundId: r.id, roundNumber: r.round_number })}
                    className="min-h-[44px] text-sm text-rhythm-glow hover:underline cursor-pointer mt-1">
                    编辑复盘
                  </button>
                </details>
              ) : (
                <button
                  type="button"
                  disabled={r.status === 'active'}
                    onClick={() => setReviewTarget({ roundId: r.id, roundNumber: r.round_number })}
                  className="min-h-[44px] px-3 py-2 rounded-xl text-sm bg-rhythm-glow-soft text-rhythm-text-muted hover:text-rhythm-glow hover:border-rhythm-glow/40 cursor-pointer transition-colors">
                  {r.status === 'active' ? '本轮结束后可写复盘' : '补填这轮复盘'}
                </button>
              )}
            </div>
          </div>
        )
      })}

      <ReviewFormSheet
        open={!!reviewTarget}
        onClose={(result) => { setReviewTarget(null); if (result === 'submitted') onReviewSaved?.() }}
        roundId={reviewTarget?.roundId ?? ''}
        roundNumber={reviewTarget?.roundNumber}
        mode="review"
        initial={
          targetRound
            ? {
                reviewReality: targetRound.review_reality,
                reviewEffect: targetRound.review_effect,
                reviewAdjustment: targetRound.review_adjustment,
              }
            : undefined
        }
      />
    </div>
  )
}

function ReviewField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <div className="text-xs text-rhythm-text-muted mb-0.5">{label}</div>
      <p className="text-sm text-rhythm-text-secondary leading-relaxed m-0 break-words">{value}</p>
    </div>
  )
}
