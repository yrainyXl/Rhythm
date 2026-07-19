'use client'

export function DayHead({
  dateText,
  tonightHtml,
  completed,
  total,
}: {
  dateText: string
  tonightHtml: string
  completed: number
  total: number
}) {
  const pct = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0
  return (
    <section className="flex items-end justify-between gap-4">
      <div>
        <div className="text-[0.7rem] tracking-[0.14em] uppercase text-rhythm-text-muted">
          {dateText}
        </div>
        <h1 className="mt-1 font-serifsc font-normal text-[1.6rem] leading-tight tracking-[0.04em] text-rhythm-text-primary">
          今天
        </h1>
        <p
          className="mt-2 text-[0.78rem] leading-relaxed text-rhythm-text-secondary"
          dangerouslySetInnerHTML={{ __html: tonightHtml }}
        />
      </div>
      <div
        className="flex-none w-16 h-16 rounded-full grid place-items-center relative"
        style={{
          background: `conic-gradient(rgba(143,180,220,0.7) 0deg ${pct * 3.6}deg, rgba(143,180,220,0.08) 0deg 360deg)`,
        }}
        title={`今日完成 ${completed}/${total}`}
      >
        <div className="absolute inset-[5px] rounded-full bg-rhythm-void/90" />
        <span className="relative z-10 font-serifsc text-[0.95rem] text-rhythm-glow">
          {completed}/{total}
        </span>
      </div>
    </section>
  )
}
