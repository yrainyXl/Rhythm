'use client'

export function HighlightsStream() {
  return (
    <div className="space-y-2">
      <div className="p-4 rounded-2xl border border-rhythm-border bg-rhythm-card/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-11 rounded-sm flex-none"
            style={{ background: 'linear-gradient(135deg, rgba(143,180,220,0.4), rgba(143,180,220,0.2))' }} />
          <div className="flex-1 min-w-0">
            <b className="block font-serifsc font-medium text-[0.85rem] tracking-tight">《深度工作》</b>
            <small className="block text-[0.65rem] text-rhythm-text-muted mt-0.5">卡尔·纽波特 · 128 条</small>
          </div>
          <span className="text-[0.6rem] text-rhythm-text-muted">下阶段接入</span>
        </div>
      </div>
      <div className="p-4 rounded-2xl border border-rhythm-border bg-rhythm-card/60 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-11 rounded-sm flex-none"
            style={{ background: 'linear-gradient(135deg, #8fa8b8, #4a5c74)' }} />
          <div className="flex-1 min-w-0">
            <b className="block font-serifsc font-medium text-[0.85rem] tracking-tight">《The Practice》</b>
            <small className="block text-[0.65rem] text-rhythm-text-muted mt-0.5">Seth Godin · 42 条</small>
          </div>
          <span className="text-[0.6rem] text-rhythm-text-muted">下阶段接入</span>
        </div>
      </div>
    </div>
  )
}
