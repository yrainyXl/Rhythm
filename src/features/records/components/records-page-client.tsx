'use client'

import { useState } from 'react'
import { AuthGuard } from '@/features/app/components/auth-guard'
import { SleepForm } from '@/features/records/components/sleep-form'
import { SleepAnalysis } from '@/features/records/components/sleep-analysis'
import { ExerciseForm } from '@/features/records/components/exercise-form'
import { ExerciseAnalysis } from '@/features/records/components/exercise-analysis'
import { ReadingView, ReadingAnalysis } from '@/features/records/components/reading-view'
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

  return (
    <AuthGuard>
      <div className="p-4">
        {/* Tab navigation */}
        <div className="flex gap-1 mb-4 bg-gray-100 rounded-xl p-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id)
                setShowSleepForm(false)
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
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
                  className="w-full py-3 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
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
                  className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block"
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
                  className="w-full py-3 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
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
                  className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block"
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
            <ReadingView />
            <div className="border-t pt-4">
              <p className="text-xs text-gray-400 mb-3 font-medium">阅读分析</p>
              <ReadingAnalysis />
            </div>
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
