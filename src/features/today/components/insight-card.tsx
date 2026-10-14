'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useWeeklyReviewStore } from '@/features/practice/store/weekly-review-store'

/** 取周回顾正文第一段作为「这周发现」的摘要。 */
function firstParagraph(md: string): string {
  const line = md.split(/\n\s*\n/).map((p) => p.replace(/^#+\s*/, '').trim()).find((p) => p.length > 0) ?? ''
  return line.replace(/[*_`>]/g, '')
}

/**
 * 这周发现：只在有未读的周回顾时出现。
 * AI 的观察只是线索，必须能回到依据，由用户确认或否定。
 */
export function InsightCard({ hidden }: { hidden: boolean }) {
  const { reviews, loadReviews, updateStatus } = useWeeklyReviewStore()
  useEffect(() => { void loadReviews() }, [loadReviews])

  const review = reviews.find((r) => r.status === 'unread' && r.ai_body_md?.trim())
  if (hidden || !review?.ai_body_md) return null

  return (
    <section aria-label="这周发现" className="mx-4 mb-3 rounded-[22px] bg-gradient-to-br from-[var(--r-insight-from)] to-[var(--r-insight-to)] p-4">
      <p className="text-[13px] font-semibold text-rhythm-glow">这周发现</p>
      <p className="mt-2 text-[19px] font-semibold leading-relaxed line-clamp-4">{firstParagraph(review.ai_body_md)}</p>
      <p className="mt-2.5 flex items-center gap-1.5 text-[13px] text-rhythm-text-secondary">
        <i className="h-1.5 w-1.5 flex-none rounded-full bg-rhythm-habit" aria-hidden="true" />
        根据 {review.week_start.slice(5).replace('-', '/')}–{review.week_end.slice(5).replace('-', '/')} 的记录整理，只是线索
      </p>
      <div className="mt-3.5 flex flex-wrap gap-2">
        <Link href="/records?tab=review" className="inline-flex h-9 items-center rounded-full bg-rhythm-glow px-4 text-[15px] font-semibold text-white">看依据</Link>
        <button type="button" onClick={() => void updateStatus(review.id, 'confirmed')} className="h-9 rounded-full bg-rhythm-card/75 px-4 text-[15px] font-semibold">说得对</button>
        <Link href="/records?tab=review" className="inline-flex h-9 items-center rounded-full bg-rhythm-card/75 px-4 text-[15px] font-semibold">不太对，去修正</Link>
      </div>
    </section>
  )
}
