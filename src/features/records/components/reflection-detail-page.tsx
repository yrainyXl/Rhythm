'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthGuard } from '@/features/app/components/auth-guard'
import { useReflectionStore } from '@/features/records/components/reflection-view'

type Mood = 'great' | 'fair' | 'poor'

function formatToday(): { display: string; iso: string } {
  const now = new Date()
  const weekday = ['日', '一', '二', '三', '四', '五', '六'][now.getDay()]
  const m = now.getMonth() + 1
  const d = now.getDate()
  const iso = `${now.getFullYear()}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  return { display: `${m}月${d}日 · 周${weekday}`, iso }
}

export function ReflectionDetailPage() {
  const router = useRouter()
  const { todayReflection, isSaving, loadToday, saveReflection } = useReflectionStore()
  const [{ display: dateDisplay, iso: localDate }] = useState(formatToday)

  const [mood, setMood] = useState<Mood | null>(null)
  const [bestThing, setBestThing] = useState('')
  const [improveThing, setImproveThing] = useState('')
  const [tomorrowFocus, setTomorrowFocus] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadToday(localDate)
  }, [localDate, loadToday])

  useEffect(() => {
    if (todayReflection) {
      setMood(todayReflection.mood as Mood | null)
      setBestThing(todayReflection.best_thing ?? '')
      setImproveThing(todayReflection.improve_thing ?? '')
      setTomorrowFocus(todayReflection.tomorrow_focus ?? '')
      setNote(todayReflection.note ?? '')
    }
  }, [todayReflection])

  const filledCount =
    (mood ? 1 : 0) +
    (bestThing.trim() ? 1 : 0) +
    (improveThing.trim() ? 1 : 0) +
    (tomorrowFocus.trim() ? 1 : 0) +
    (note.trim() ? 1 : 0)

  const handleSave = async () => {
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
      return
    }
    router.push('/records')
  }

  return (
    <AuthGuard>
      <div className="p-5 pb-24 space-y-6">
        <div className="text-center pt-2">
          <p className="r-eyebrow">Today</p>
          <h1 className="r-title text-xl mt-1">{dateDisplay}</h1>
          <p className="text-xs text-rhythm-text-muted mt-1">此刻 · 记下今天的收获与念头</p>
        </div>

        <div className="r-card p-4">
          <p className="r-label text-center mb-3">今天整体状态</p>
          <div className="flex gap-2">
            {([
              { value: 'great', label: '很好', icon: '😊' },
              { value: 'fair', label: '一般', icon: '😐' },
              { value: 'poor', label: '较差', icon: '😞' },
            ] as const).map(({ value, label, icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setMood(value)}
                className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-xl border transition-colors ${
                  mood === value
                    ? 'border-rhythm-border-strong bg-rhythm-glow-soft text-rhythm-text-primary'
                    : 'border-rhythm-border text-rhythm-text-secondary hover:bg-rhythm-void/40'
                }`}
              >
                <span className="text-xl">{icon}</span>
                <span className="text-xs">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="r-card p-4">
          <label className="r-label">今天最满意的一件事</label>
          <input
            type="text"
            value={bestThing}
            onChange={(e) => setBestThing(e.target.value)}
            placeholder="无论多小都行..."
            className="r-input"
          />
        </div>

        <div className="r-card p-4">
          <label className="r-label">今天最需要改进的</label>
          <input
            type="text"
            value={improveThing}
            onChange={(e) => setImproveThing(e.target.value)}
            placeholder="不用太苛责自己"
            className="r-input"
          />
        </div>

        <div className="r-card p-4">
          <label className="r-label">明天最重要的一件事</label>
          <input
            type="text"
            value={tomorrowFocus}
            onChange={(e) => setTomorrowFocus(e.target.value)}
            placeholder="明天最想完成什么？"
            className="r-input"
          />
        </div>

        <div className="r-card p-4">
          <label className="r-label">自由备注</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="随便说点什么..."
            rows={4}
            className="r-input resize-none"
          />
        </div>

        {error && <p className="text-sm text-rhythm-danger px-2">{error}</p>}
      </div>

      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg z-20 backdrop-blur-md bg-rhythm-void/85 border-t border-rhythm-border"
      >
        <div className="flex items-center gap-3 px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <p className="text-xs text-rhythm-text-muted flex-1">
            <b className="text-rhythm-text-secondary">{filledCount}</b> 项已填
          </p>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="r-btn-primary px-6 disabled:opacity-50"
          >
            {isSaving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </AuthGuard>
  )
}
