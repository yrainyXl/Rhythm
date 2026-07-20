'use client'

import { useAiRecommendationStore } from '@/features/practice/store/ai-recommendation-store'
import type { Database } from '@/lib/supabase/database.types'

type Rec = Database['public']['Tables']['ai_recommendations']['Row']

export function ObservationCard({ rec }: { rec: Rec }) {
  const { updateStatus } = useAiRecommendationStore()

  return (
    <div className="p-4 rounded-2xl border relative"
      style={{
        borderColor: 'rgba(220,180,130,0.18)',
        background: 'linear-gradient(180deg, rgba(220,180,130,0.08), transparent)',
      }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="w-5 h-5 rounded-full grid place-items-center"
          style={{ background: 'rgba(220,180,130,0.2)', color: 'rgb(220,180,130)' }}>
          <svg viewBox="0 0 24 24" className="w-3 h-3" style={{ stroke: 'currentColor', strokeWidth: 2, fill: 'none' }}>
            <path d="M12 3l9 5-9 5-9-5 9-5z" />
            <path d="M3 13l9 5 9-5" />
          </svg>
        </span>
        <span className="text-[0.6rem] tracking-[0.14em] uppercase font-medium" style={{ color: 'rgb(220,180,130)' }}>
          Rhythm 的一个观察
        </span>
      </div>
      <p className="text-[0.78rem] text-rhythm-text-primary leading-relaxed tracking-tight m-0 mb-2">
        {rec.title}
      </p>
      {rec.uncertainty_note && (
        <div className="text-[0.64rem] text-rhythm-text-muted tracking-tight mb-2 leading-normal">
          {rec.uncertainty_note}
        </div>
      )}
      <div className="flex gap-1.5">
        <button type="button" onClick={() => updateStatus(rec.id, 'confirmed')}
          className="px-2 py-1.5 rounded-lg font-inherit text-[0.68rem] tracking-tight cursor-pointer"
          style={{ background: 'rgba(220,180,130,0.16)', border: '1px solid rgba(220,180,130,0.28)', color: 'rgb(220,180,130)' }}>
          确认
        </button>
        <button type="button" onClick={() => updateStatus(rec.id, 'more_data')}
          className="px-2 py-1.5 rounded-lg font-inherit text-[0.68rem] tracking-tight cursor-pointer bg-transparent"
          style={{ border: '1px solid rgba(220,180,130,0.28)', color: 'rgb(220,180,130)' }}>
          需要更多数据
        </button>
        <button type="button" onClick={() => updateStatus(rec.id, 'dismissed')}
          className="px-2 py-1.5 rounded-lg font-inherit text-[0.68rem] tracking-tight cursor-pointer bg-transparent border border-rhythm-border text-rhythm-text-muted">
          忽略
        </button>
      </div>
    </div>
  )
}
