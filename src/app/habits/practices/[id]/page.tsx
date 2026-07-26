'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { AuthGuard } from '@/features/app/components/auth-guard'
import { usePracticeStore } from '@/features/practice/store/practice-store'

function formatRange(start: string, end: string): string {
  const parseM = (iso: string) => {
    const [, m, d] = iso.split('-').map(Number)
    return `${m}月${d}日`
  }
  return `${parseM(start)}–${parseM(end)}`
}

export default function PracticeDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { detailPractice, isLoadingDetail, loadDetail, createRound, endRound, endPractice, deletePractice } =
    usePracticeStore()
  const [showNewRound, setShowNewRound] = useState(false)
  const [newAssumption, setNewAssumption] = useState('')
  const [newPeriod, setNewPeriod] = useState(6)
  const [confirmEndPractice, setConfirmEndPractice] = useState(false)

  useEffect(() => {
    if (params.id) void loadDetail(params.id)
  }, [params.id, loadDetail])

  const activeRound = detailPractice?.rounds.find((r) => r.status === 'active')
  const isActive = detailPractice?.status === 'active'

  const handleCreateRound = async () => {
    const r = await createRound(params.id, {
      assumption: newAssumption.trim() || undefined,
      periodDays: newPeriod,
    })
    if (!r.error) {
      setShowNewRound(false)
      setNewAssumption('')
      setNewPeriod(6)
    }
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
                    <div className="flex items-center gap-3 text-[0.66rem] text-rhythm-text-muted">
                      <span>{r.log_count} 条日志</span>
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
                          onClick={() => setShowNewRound(true)}
                          className="px-3 py-1.5 rounded-full text-[0.66rem] bg-rhythm-glow-soft border border-rhythm-border-strong text-rhythm-glow"
                        >
                          调整再试(新一轮)
                        </button>
                        <button
                          type="button"
                          onClick={() => void endRound(r.id)}
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

            {/* 创建下一轮表单 */}
            {showNewRound && (
              <div className="r-card p-4 space-y-3">
                <h3 className="font-serifsc text-sm m-0">发起第 {(detailPractice.rounds.at(-1)?.round_number ?? 0) + 1} 轮</h3>
                <div>
                  <label className="r-label">新假设(可选)</label>
                  <input
                    type="text"
                    value={newAssumption}
                    onChange={(e) => setNewAssumption(e.target.value)}
                    placeholder="这一轮改变了什么…"
                    className="r-input"
                  />
                </div>
                <div>
                  <label className="r-label">周期(天,3–60)</label>
                  <input
                    type="number"
                    min={3}
                    max={60}
                    value={newPeriod}
                    onChange={(e) => setNewPeriod(Number(e.target.value))}
                    className="r-input"
                  />
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => void handleCreateRound()} className="r-btn-primary flex-1">
                    确认创建
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewRound(false)}
                    className="r-btn flex-1 text-rhythm-text-muted"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}

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
        )}
      </div>
    </AuthGuard>
  )
}
