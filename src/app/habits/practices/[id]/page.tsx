'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { AuthGuard } from '@/features/app/components/auth-guard'
import { usePracticeStore } from '@/features/practice/store/practice-store'
import { RoundLogPanel } from '@/features/practice/components/round-log-panel'
import { ReviewFormSheet } from '@/features/practice/components/review-form-sheet'
import { ReviewTimeline } from '@/features/practice/components/review-timeline'
import { NewRoundSheet } from '@/features/practice/components/new-round-sheet'

function formatRange(start: string, end: string): string {
  const parseM = (iso: string) => {
    const [, m, d] = iso.split('-').map(Number)
    return `${m}月${d}日`
  }
  return `${parseM(start)}–${parseM(end)}`
}

type Tab = 'detail' | 'review'

export default function PracticeDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { detailPractice, isLoadingDetail, loadDetail, endRound, endPractice, deletePractice } =
    usePracticeStore()
  const [tab, setTab] = useState<Tab>('detail')
  const [showNewRound, setShowNewRound] = useState(false)
  const [confirmEndPractice, setConfirmEndPractice] = useState(false)
  // 结束轮次复盘:有 roundId 即打开;thenNew 表示结束后接着开新一轮
  const [endReview, setEndReview] = useState<{ roundId: string; roundNumber: number; thenNew?: boolean } | null>(null)

  useEffect(() => {
    if (params.id) void loadDetail(params.id)
  }, [params.id, loadDetail])

  const activeRound = detailPractice?.rounds.find((r) => r.status === 'active')
  const isActive = detailPractice?.status === 'active'
  const nextRoundNumber = (detailPractice?.rounds.at(-1)?.round_number ?? 0) + 1

  // 结束本轮:打开复盘弹窗
  const onClickEndRound = (roundId: string, roundNumber: number) => {
    setEndReview({ roundId, roundNumber })
  }

  // 调整再试:有进行中轮次先复盘结束它,再开新一轮;否则直接开新一轮
  const onClickNewRound = () => {
    if (activeRound) {
      setEndReview({ roundId: activeRound.id, roundNumber: activeRound.round_number, thenNew: true })
    } else {
      setShowNewRound(true)
    }
  }

  const onReviewSheetClose = (result: 'submitted' | 'cancelled') => {
    const thenNew = endReview?.thenNew
    setEndReview(null)
    // 仅在复盘已提交/跳过(轮次已结束)时才接着开新一轮;点 X 取消则中止
    if (thenNew && result === 'submitted') setShowNewRound(true)
  }

  return (
    <AuthGuard>
      <div className="p-5 space-y-4">
        <Link
          href="/habits/practices"
          className="flex items-center gap-1 text-xs text-rhythm-text-muted hover:text-rhythm-text-primary transition-colors"
        >
          <svg viewBox="0 0 24 24" className="w-3 h-3" style={{ stroke: 'currentColor', strokeWidth: 2, fill: 'none' }}>
            <path d="M15 18l-6-6 6-6" />
          </svg>
          返回实践列表
        </Link>

        {isLoadingDetail && !detailPractice && (
          <div className="r-card p-6 text-center text-xs text-rhythm-text-muted">加载中...</div>
        )}

        {detailPractice && (
          <>
            <div className="r-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[0.6rem] tracking-[0.12em] uppercase ${
                  isActive ? 'text-rhythm-glow' : 'text-rhythm-text-muted'
                }`}>
                  {isActive ? '进行中' : '已完成'}
                </span>
                <span className="text-[0.62rem] text-rhythm-text-muted">
                  {detailPractice.rounds.length} 轮
                </span>
              </div>
              <h1 className="font-serifsc text-lg font-medium m-0 mb-1">{detailPractice.title}</h1>
              {detailPractice.assumption && (
                <p className="text-[0.74rem] text-rhythm-text-secondary leading-relaxed m-0">
                  {detailPractice.assumption}
                </p>
              )}
            </div>

            {/* Tab 切换 */}
            <div className="flex gap-1 p-1 rounded-xl bg-rhythm-void/40 border border-rhythm-border">
              <button
                type="button"
                onClick={() => setTab('detail')}
                className={`flex-1 py-1.5 rounded-lg text-[0.74rem] cursor-pointer transition-colors ${
                  tab === 'detail' ? 'bg-rhythm-card text-rhythm-text-primary' : 'text-rhythm-text-muted hover:text-rhythm-text-secondary'
                }`}>
                实践详情
              </button>
              <button
                type="button"
                onClick={() => setTab('review')}
                className={`flex-1 py-1.5 rounded-lg text-[0.74rem] cursor-pointer transition-colors ${
                  tab === 'review' ? 'bg-rhythm-card text-rhythm-text-primary' : 'text-rhythm-text-muted hover:text-rhythm-text-secondary'
                }`}>
                复盘
              </button>
            </div>

            {tab === 'detail' ? (
              <>
                {/* 实践级别操作:始终可发起新一轮 */}
                {isActive && !showNewRound && (
                  <div className="r-card p-4 flex items-center justify-between">
                    <div>
                      <div className="text-[0.66rem] tracking-wide text-rhythm-glow">
                        {activeRound ? '当前有进行中的轮次' : '当前没有进行中的轮次'}
                      </div>
                      <div className="text-[0.62rem] text-rhythm-text-muted mt-0.5">
                        {activeRound ? '可以直接结束本轮,或提前调整再试' : '开启新一轮继续验证'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={onClickNewRound}
                      className="px-3 py-1.5 rounded-full text-[0.66rem] bg-rhythm-glow-soft border border-rhythm-border-strong text-rhythm-glow flex-none"
                    >
                      {activeRound ? '调整再试(新一轮)' : '开启新一轮'}
                    </button>
                  </div>
                )}

                {/* 轮次列表 */}
                <div className="space-y-3">
                  {[...detailPractice.rounds].reverse().map((r) => {
                    const roundActive = r.status === 'active'
                    return (
                      <div key={r.id} className={`r-card p-4 ${roundActive ? 'border-rhythm-glow/40' : ''}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-[0.66rem] tracking-wide ${
                            roundActive ? 'text-rhythm-glow' : 'text-rhythm-text-muted'
                          }`}>
                            第 {r.round_number} 轮 · {roundActive ? '进行中' : '已结束'}
                          </span>
                          <span className="text-[0.62rem] text-rhythm-text-muted">
                            {formatRange(r.start_date, r.end_date)}
                          </span>
                        </div>
                        {r.assumption && (
                          <p className="text-[0.72rem] text-rhythm-text-secondary m-0 mb-2">{r.assumption}</p>
                        )}
                        <div className="text-[0.66rem] text-rhythm-text-muted">
                          <RoundLogPanel
                            roundId={r.id}
                            startDate={r.start_date}
                            endDate={r.end_date}
                            logCount={r.log_count}
                          />
                        </div>
                        {r.conclusion && (
                          <p className="text-[0.7rem] text-rhythm-text-secondary mt-2 pt-2 border-t border-rhythm-border/60 m-0">
                            结论:{r.conclusion}
                          </p>
                        )}
                        {roundActive && (
                          <div className="flex gap-2 mt-3">
                            <button
                              type="button"
                              onClick={() => onClickEndRound(r.id, r.round_number)}
                              className="px-3 py-1.5 rounded-full text-[0.66rem] bg-transparent border border-rhythm-border text-rhythm-text-muted"
                            >
                              结束本轮
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* 创建下一轮表单已移至 NewRoundSheet 弹窗 */}

                {/* 结束/删除实践 */}
                {isActive && (
                  <div className="flex gap-2 pt-2">
                    {confirmEndPractice ? (
                      <>
                        <button
                          type="button"
                          onClick={() => { void endPractice(detailPractice.id); setConfirmEndPractice(false); router.push('/habits/practices') }}
                          className="r-btn flex-1 text-rhythm-warn"
                          style={{ border: '1px solid rgba(220,180,130,0.4)' }}
                        >
                          确认结束整个实践
                        </button>
                        <button type="button" onClick={() => setConfirmEndPractice(false)} className="r-btn flex-1 text-rhythm-text-muted">
                          取消
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmEndPractice(true)}
                        className="r-btn flex-1 text-rhythm-text-muted"
                      >
                        结束整个实践
                      </button>
                    )}
                  </div>
                )}
                {!isActive && (
                  <button
                    type="button"
                    onClick={() => { void deletePractice(detailPractice.id); router.push('/habits/practices') }}
                    className="r-btn w-full text-rhythm-danger"
                    style={{ border: '1px solid rgba(220,140,140,0.3)' }}
                  >
                    删除实践
                  </button>
                )}
              </>
            ) : (
              /* 复盘 tab */
              <ReviewTimeline
                rounds={detailPractice.rounds}
                practiceAssumption={detailPractice.assumption}
              />
            )}
          </>
        )}
      </div>

      {/* 结束本轮复盘弹窗 */}
      <ReviewFormSheet
        open={!!endReview}
        onClose={onReviewSheetClose}
        roundId={endReview?.roundId ?? ''}
        roundNumber={endReview?.roundNumber}
        mode="end"
      />

      {/* 发起新一轮弹窗 */}
      <NewRoundSheet
        open={showNewRound}
        onClose={() => setShowNewRound(false)}
        practiceId={params.id}
        nextRoundNumber={nextRoundNumber}
      />
    </AuthGuard>
  )
}
