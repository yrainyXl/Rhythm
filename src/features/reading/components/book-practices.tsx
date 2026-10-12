import Link from 'next/link'
import type { PracticeWithLatestRound } from '@/features/practice/store/practice-store'

export function BookPractices({ practices }: { practices: PracticeWithLatestRound[] }) {
  if (!practices.length) return null
  return (
    <div className="mt-3 space-y-2 border-t border-rhythm-border pt-3">
      {practices.map((practice) => {
        const round = practice.latestRound
        return (
          <div key={practice.id} className="text-sm">
            <Link href={`/habits/practices/${practice.id}`} className="r-link">
              {practice.title} · {practice.status === 'ended' ? '已结束' : '实践中'} →
            </Link>
            {round && <p className="mt-1 mb-0 text-rhythm-text-muted">第 {round.round_number} 轮 · {round.status === 'ended' ? (round.review_reality || round.review_effect || round.review_adjustment || round.conclusion ? '已复盘' : '已结束') : '记录中'}</p>}
            {round?.review_reality && <p className="mt-1 mb-0 text-rhythm-text-secondary whitespace-pre-wrap">实际发生：{round.review_reality}</p>}
            {round?.review_effect && <p className="mt-1 mb-0 text-rhythm-text-secondary whitespace-pre-wrap">效果：{round.review_effect}</p>}
            {round?.review_adjustment && <p className="mt-1 mb-0 text-rhythm-text-secondary whitespace-pre-wrap">下轮调整：{round.review_adjustment}</p>}
            {round?.conclusion && <p className="mt-1 mb-0 text-rhythm-text-secondary whitespace-pre-wrap">结论：{round.conclusion}</p>}
          </div>
        )
      })}
    </div>
  )
}
