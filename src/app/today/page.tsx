'use client'

import { useEffect, useState, useCallback } from 'react'
import { AuthGuard } from '@/features/app/components/auth-guard'
import { useHabitStore } from '@/features/habits/store/habit-store'
import { HabitItem, HabitDetailForm } from '@/features/habits/components/habit-item'

function getLocalDate(): string {
  return new Date().toISOString().split('T')[0]
}

export default function TodayPage() {
  const { occurrences, generateOccurrences, completeOccurrence, skipOccurrence, resetOccurrence, loadHabits } = useHabitStore()
  const [completeDetailId, setCompleteDetailId] = useState<string | null>(null)
  const [todayDate] = useState(getLocalDate)
  const [isInitializing, setIsInitializing] = useState(true)

  const initToday = useCallback(async () => {
    await loadHabits()
    await generateOccurrences(todayDate)
    setIsInitializing(false)
  }, [todayDate, loadHabits, generateOccurrences])

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
      <div className="p-4 space-y-4">
        {/* Date header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <p className="text-sm text-white/80">{dateDisplay}</p>
          {!isInitializing && totalOccurrences > 0 && (
            <>
              <p className="text-lg font-bold mt-1">
                已完成 {completedOccurrences} / {totalOccurrences}
              </p>
              <div className="w-full bg-white/20 rounded-full h-1.5 mt-2">
                <div
                  className="bg-white rounded-full h-1.5 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </>
          )}
        </div>

        {/* Loading state */}
        {isInitializing && (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-400">加载今日待办...</p>
            </div>
          </div>
        )}

        {/* Pending habits */}
        {!isInitializing && pendingOccurrences.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
              待完成 · {pendingOccurrences.length}
            </p>
            <div className="space-y-2">
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
          <div className="bg-white rounded-xl border p-8 text-center">
            <p className="text-4xl mb-3">🎯</p>
            <p className="text-gray-500 text-sm">今天没有待办项</p>
            <p className="text-gray-400 text-xs mt-1">
              先去「计划」页面创建一些习惯吧
            </p>
          </div>
        )}

        {/* Quick entries */}
        <div className="grid grid-cols-2 gap-3">
          <a
            href="/records"
            className="bg-white rounded-xl border p-4 hover:shadow-sm transition-shadow"
          >
            <p className="text-2xl mb-1">😴</p>
            <p className="text-sm font-medium text-gray-900">记录睡眠</p>
            <p className="text-xs text-gray-400 mt-0.5">昨晚睡得好吗</p>
          </a>
          <a
            href="/records"
            className="bg-white rounded-xl border p-4 hover:shadow-sm transition-shadow"
          >
            <p className="text-2xl mb-1">🏃</p>
            <p className="text-sm font-medium text-gray-900">记录运动</p>
            <p className="text-xs text-gray-400 mt-0.5">今天动了吗</p>
          </a>
        </div>

        {/* Done items */}
        {!isInitializing && doneOccurrences.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
              已完成 · {doneOccurrences.length}
            </p>
            <div className="space-y-2">
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
        <a
          href="/records"
          className="block bg-white rounded-xl border p-4 hover:shadow-sm transition-shadow"
        >
          <p className="text-sm font-medium text-gray-900">📝 今日复盘</p>
          <p className="text-xs text-gray-400 mt-1">回顾今天，计划明天</p>
        </a>
      </div>
    </AuthGuard>
  )
}
