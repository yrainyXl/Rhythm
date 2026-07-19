'use client'

export function RecentActivity() {
  return (
    <div className="p-4 rounded-2xl border border-rhythm-border bg-rhythm-card/60">
      <div className="flex justify-between items-baseline mb-3">
        <span className="text-[0.6rem] tracking-[0.14em] uppercase text-rhythm-text-muted">最近动态</span>
        <a className="text-[0.68rem] text-rhythm-glow no-underline tracking-tight">全部 →</a>
      </div>
      <div className="text-[0.72rem] text-rhythm-text-muted leading-relaxed py-4 text-center">
        最近动态下阶段接入,将显示实践、议题、方法的操作时间线。
      </div>
    </div>
  )
}
