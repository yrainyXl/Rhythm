'use client'

import { useEffect, useState, useCallback } from 'react'
import { AuthGuard } from '@/features/app/components/auth-guard'
import { useHabitStore } from '@/features/habits/store/habit-store'
import { HabitItem, HabitDetailForm } from '@/features/habits/components/habit-item'

function getLocalDate(): string {
  return new Date().toISOString().split('T')[0]
}

export default function TodayPage() {
  const { occurrences, generateOccurrences, completeOccurrence, skipOccurrence, resetOccurrence } = useHabitStore()
  const [completeDetailId, setCompleteDetailId] = useState<string | null>(null)
  const [todayDate] = useState(getLocalDate)
  const [isInitializing, setIsInitializing] = useState(true)

  const initToday = useCallback(async () => {
    await generateOccurrences(todayDate)
    setIsInitializing(false)
  }, [todayDate, generateOccurrences])

  useEffect(() => {
    initToday()
  }, [initToday])

  const totalOccurrences = occurrences.length
  const completedOccurrences = occurrences.filter((o) => o.status === 'done').length
  const progressPercent = totalOccurrences > 0 ? Math.round((completedOccurrences / totalOccurrences) * 100) : 0

  const pendingOccurrences = occurrences.filter((o) => o.status === 'pending')
  const doneOccurrences = occurrences.filter((o) => o.status === 'done' || o.status === 'skipped')

  const dateDisplay = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })

  const handleComplete = async (id: string) => {
    await completeOccurrence(id)
  }

  const handleCompleteWithDetail = async (id: string, actualValue?: number, actualDuration?: number, feeling?: number, note?: string) => {
    await completeOccurrence(id, actualValue, actualDuration, feeling, note)
    setCompleteDetailId(null)
  }

  const handleSkip = async (id: string) => {
    await skipOccurrence(id)
  }

  const handleReset = async (id: string) => {
    await resetOccurrence(id)
  }

  return (
    <AuthGuard>
      <div className="p-5 space-y-5">
        {/* Date header */}
        <div className="pt-2">
          <p className="r-eyebrow">{dateDisplay}</p>
          {!isInitializing && totalOccurrences > 0 && (
            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className="r-title text-2xl">{completedOccurrences}</span>
                <span className="text-rhythm-text-muted text-sm">/ {totalOccurrences} 已完成</span>
              </div>
              <div className="w-full bg-rhythm-border rounded-full h-1 mt-3 overflow-hidden">
                <div
                  className="rounded-full h-1 transition-all duration-700"
                  style={{
                    width: `${progressPercent}%`,
                    background: 'linear-gradient(90deg, rgba(143,180,220,0.5), rgba(143,180,220,0.9))',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Loading state */}
        {isInitializing && (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="w-5 h-5 border-2 border-rhythm-glow border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-rhythm-text-muted">加载今日节奏…</p>
            </div>
          </div>
        )}

        {/* Pending habits */}
        {!isInitializing && pendingOccurrences.length > 0 && (
          <div>
            <p className="r-eyebrow mb-3">
              待完成 · {pendingOccurrences.length}
            </p>
            <div className="space-y-2.5">
              {pendingOccurrences.map((occ) => (
                <div key={occ.id}>
                  <HabitItem
                    occurrence={occ}
                    onComplete={handleComplete}
                    onCompleteWithDetail={(id) => setCompleteDetailId(id)}
                    onSkip={handleSkip}
                    onReset={handleReset}
                  />
                  {completeDetailId === occ.id && (
                    <div className="ml-4">
                      <HabitDetailForm
                        occurrence={occ}
                        onSubmit={handleCompleteWithDetail}
                        onCancel={() => setCompleteDetailId(null)}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!isInitializing && totalOccurrences === 0 && (
          <div className="r-card p-10 text-center">
            <p className="r-title text-base text-rhythm-text-secondary">今天没有待办项</p>
            <p className="text-rhythm-text-muted text-xs mt-2">
              先去「计划」创建一些习惯吧
            </p>
          </div>
        )}

        {/* Quick entries */}
        <div className="grid grid-cols-2 gap-3">
          <a href="/records" className="r-card r-card-hover p-4">
            <p className="text-sm font-medium text-rhythm-text-primary">记录睡眠</p>
            <p className="text-xs text-rhythm-text-muted mt-1">昨晚睡得好吗</p>
          </a>
          <a href="/records" className="r-card r-card-hover p-4">
            <p className="text-sm font-medium text-rhythm-text-primary">记录运动</p>
            <p className="text-xs text-rhythm-text-muted mt-1">今天动了吗</p>
          </a>
        </div>

        {/* Done items */}
        {!isInitializing && doneOccurrences.length > 0 && (
          <div>
            <p className="r-eyebrow mb-3">
              已完成 · {doneOccurrences.length}
            </p>
            <div className="space-y-2.5">
              {doneOccurrences.map((occ) => (
                <HabitItem
                  key={occ.id}
                  occurrence={occ}
                  onComplete={handleComplete}
                  onCompleteWithDetail={() => {}}
                  onSkip={handleSkip}
                  onReset={handleReset}
                />
              ))}
            </div>
          </div>
        )}

        {/* Reflection entry */}
        <a href="/records" className="block r-card r-card-hover p-4">
          <p className="text-sm font-medium text-rhythm-text-primary">今日复盘</p>
          <p className="text-xs text-rhythm-text-muted mt-1">回顾今天，计划明天</p>
        </a>
      </div>
    </AuthGuard>
  )
}
