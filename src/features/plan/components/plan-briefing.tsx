'use client'

export function PlanBriefing() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-rhythm-border"
      style={{ background: 'linear-gradient(180deg, rgba(143,180,220,0.08), transparent)' }}>
      <div className="flex-none w-9 h-9 rounded-full grid place-items-center"
        style={{ background: 'rgba(143,180,220,0.18)', color: 'rgb(143,180,220)' }}>
        <svg viewBox="0 0 24 24" className="w-4 h-4" style={{ stroke: 'currentColor', strokeWidth: 1.8, fill: 'none' }}>
          <path d="M12 8v4l3 2" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      </div>
      <div className="flex-1 text-xs text-rhythm-text-secondary leading-relaxed">
        实践与议题数据下阶段接入,先看结构。
      </div>
      <button type="button" className="text-[0.68rem] tracking-tight text-rhythm-glow bg-transparent border-0 cursor-pointer">
        了解 →
      </button>
    </div>
  )
}
