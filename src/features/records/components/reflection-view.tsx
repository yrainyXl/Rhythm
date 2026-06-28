'use client'

import { useState, useEffect, useCallback } from 'react'
import { create } from 'zustand'
import { createBrowserClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'

type Reflection = Database['public']['Tables']['daily_reflections']['Row']
type Mood = 'great' | 'fair' | 'poor'

interface ReflectionState {
  todayReflection: Reflection | null
  history: Reflection[]
  isSaving: boolean

  loadToday: (localDate: string) => Promise<void>
  saveReflection: (data: {
    local_date: string
    mood: Mood | null
    best_thing: string | null
    improve_thing: string | null
    tomorrow_focus: string | null
    note: string | null
    is_shared: boolean
  }) => Promise<{ error: string | null }>
}

export const useReflectionStore = create<ReflectionState>((set) => ({
  todayReflection: null,
  history: [],
  isSaving: false,

  loadToday: async (localDate) => {
    const supabase = createBrowserClient()
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return

    const { data } = await supabase
      .from('daily_reflections')
      .select('*')
      .eq('user_id', user.id)
      .eq('local_date', localDate)
      .single()

    set({ todayReflection: data ?? null })
  },

  saveReflection: async (data) => {
    const supabase = createBrowserClient()
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return { error: 'Not authenticated' }

    set({ isSaving: true })

    const { error } = await supabase.from('daily_reflections').upsert({
      user_id: user.id,
      local_date: data.local_date,
      mood: data.mood,
      best_thing: data.best_thing,
      improve_thing: data.improve_thing,
      tomorrow_focus: data.tomorrow_focus,
      note: data.note,
      is_shared: data.is_shared,
    })

    set({ isSaving: false })
    if (!error) {
      await useReflectionStore.getState().loadToday(data.local_date)
    }
    return { error: error?.message ?? null }
  },
}))

export function ReflectionView() {
  const { todayReflection, isSaving, loadToday, saveReflection } = useReflectionStore()
  const [localDate] = useState(() => new Date().toISOString().split('T')[0])
  const [mood, setMood] = useState<Mood | null>(null)
  const [bestThing, setBestThing] = useState('')
  const [improveThing, setImproveThing] = useState('')
  const [tomorrowFocus, setTomorrowFocus] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    loadToday(localDate)
  }, [localDate, loadToday])

  // Sync from existing reflection when loaded
  useEffect(() => {
    if (todayReflection) {
      setMood(todayReflection.mood)
      setBestThing(todayReflection.best_thing ?? '')
      setImproveThing(todayReflection.improve_thing ?? '')
      setTomorrowFocus(todayReflection.tomorrow_focus ?? '')
      setNote(todayReflection.note ?? '')
    }
  }, [todayReflection])

  const handleSubmit = async () => {
    setError(null)
    const result = await saveReflection({
      local_date: localDate,
      mood,
      best_thing: bestThing || null,
      improve_thing: improveThing || null,
      tomorrow_focus: tomorrowFocus || null,
      note: note || null,
      is_shared: false,
    })
    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border p-4">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">📝</span>
          <h3 className="font-bold text-gray-900">今日复盘</h3>
        </div>

        <div className="space-y-4">
          {/* Mood */}
          <div>
            <p className="text-xs text-gray-500 mb-2">今天整体状态</p>
            <div className="flex gap-3">
              {([
                { value: 'great', label: '很好', icon: '😊', color: 'border-green-300 bg-green-50' },
                { value: 'fair', label: '一般', icon: '😐', color: 'border-yellow-300 bg-yellow-50' },
                { value: 'poor', label: '较差', icon: '😞', color: 'border-red-300 bg-red-50' },
              ] as const).map(({ value, label, icon, color: colorClass }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMood(value)}
                  className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-xl border transition-colors ${
                    mood === value ? colorClass + ' border-2' : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <span className="text-xl">{icon}</span>
                  <span className="text-xs text-gray-700">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Best thing */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">今天最满意的一件事</label>
            <input
              type="text"
              value={bestThing}
              onChange={(e) => setBestThing(e.target.value)}
              placeholder="无论多小都行..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Improve thing */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">今天最需要改进的</label>
            <input
              type="text"
              value={improveThing}
              onChange={(e) => setImproveThing(e.target.value)}
              placeholder="不用太苛责自己"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Tomorrow focus */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">明天最重要的一件事</label>
            <input
              type="text"
              value={tomorrowFocus}
              onChange={(e) => setTomorrowFocus(e.target.value)}
              placeholder="明天最想完成什么？"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Free note */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">自由备注</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="随便说点什么..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-600">保存成功 ✓</p>}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isSaving ? '保存中...' : todayReflection ? '更新复盘' : '保存复盘'}
          </button>
        </div>
      </div>
    </div>
  )
}
