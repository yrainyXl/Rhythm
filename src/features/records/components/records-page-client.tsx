'use client'

import { useState } from 'react'
import { AuthGuard } from '@/features/app/components/auth-guard'
import { SleepForm } from '@/features/records/components/sleep-form'
import { SleepAnalysis } from '@/features/records/components/sleep-analysis'
import { ExerciseForm } from '@/features/records/components/exercise-form'
import { ExerciseAnalysis } from '@/features/records/components/exercise-analysis'
import { ReadingView, ReadingAnalysis } from '@/features/records/components/reading-view'
import { ReadingHighlights } from '@/features/records/components/reading-highlights'
import { ReflectionView } from '@/features/records/components/reflection-view'
import { WeeklyReport } from '@/features/records/components/weekly-report'

type RecordTab = 'sleep' | 'exercise' | 'reading' | 'reflection' | 'weekly'

const tabs: { id: RecordTab; label: string; icon: string }[] = [
  { id: 'sleep', label: '睡眠', icon: '😴' },
  { id: 'exercise', label: '运动', icon: '🏃' },
  { id: 'reading', label: '阅读', icon: '📚' },
  { id: 'reflection', label: '复盘', icon: '📝' },
  { id: 'weekly', label: '周报', icon: '📈' },
]

export default function RecordsPageClient() {
  const [activeTab, setActiveTab] = useState<RecordTab>('sleep')
  const [showSleepForm, setShowSleepForm] = useState(false)
  const [showExerciseForm, setShowExerciseForm] = useState(false)
  const [readingSubTab, setReadingSubTab] = useState<'record' | 'highlights'>('record')

  return (
    <AuthGuard>
      <div className="p-5">
        {/* Tab navigation */}
        <div className="flex gap-1 mb-5 rounded-2xl p-1 overflow-x-auto border border-rhythm-border bg-rhythm-void/40">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id)
                setShowSleepForm(false)
              }}
              className={`px-4 py-2 rounded-xl text-xs font-medium tracking-[0.04em] transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-rhythm-text-primary bg-rhythm-glow-soft border border-rhythm-border-strong'
                  : 'text-rhythm-text-muted hover:text-rhythm-text-secondary border border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sleep tab */}
        {activeTab === 'sleep' && (
          <div className="space-y-4">
            {!showSleepForm ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowSleepForm(true)}
                  className="r-btn-primary w-full"
                >
                  + 记录睡眠
                </button>
                <SleepAnalysis />
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setShowSleepForm(false)}
                  className="text-sm text-rhythm-text-secondary hover:text-rhythm-text-primary mb-2 inline-block transition-colors"
                >
                  ← 返回分析
                </button>
                <SleepForm onBack={() => setShowSleepForm(false)} />
              </>
            )}
          </div>
        )}

        {/* Exercise tab */}
        {activeTab === 'exercise' && (
          <div className="space-y-4">
            {!showExerciseForm ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowExerciseForm(true)}
                  className="r-btn-primary w-full"
                >
                  + 记录运动
                </button>
                <ExerciseAnalysis />
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setShowExerciseForm(false)}
                  className="text-sm text-rhythm-text-secondary hover:text-rhythm-text-primary mb-2 inline-block transition-colors"
                >
                  ← 返回分析
                </button>
                <ExerciseForm onBack={() => setShowExerciseForm(false)} />
              </>
            )}
          </div>
        )}

        {/* Reading tab */}
        {activeTab === 'reading' && (
          <div className="space-y-4">
            {/* Sub-tab: 记录 / 词条 */}
            <div className="flex gap-1 rounded-xl p-1 border border-rhythm-border bg-rhythm-void/40">
              {([
                { id: 'record' as const, label: '记录' },
                { id: 'highlights' as const, label: '词条' },
              ]).map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setReadingSubTab(sub.id)}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    readingSubTab === sub.id
                      ? 'text-rhythm-text-primary bg-rhythm-glow-soft border border-rhythm-border-strong'
                      : 'text-rhythm-text-muted hover:text-rhythm-text-secondary border border-transparent'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>

            {readingSubTab === 'record' ? (
              <>
                <ReadingView />
                <div className="border-t border-rhythm-border pt-4">
                  <p className="r-eyebrow mb-3">阅读分析</p>
                  <ReadingAnalysis />
                </div>
              </>
            ) : (
              <ReadingHighlights />
            )}
          </div>
        )}

        {/* Reflection tab */}
        {activeTab === 'reflection' && (
          <ReflectionView />
        )}

        {/* Weekly tab */}
        {activeTab === 'weekly' && (
          <WeeklyReport />
        )}
      </div>
    </AuthGuard>
  )
}
