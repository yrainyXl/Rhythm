export function DayHead({ dateText, completed, total }: { dateText: string; completed: number; total: number }) {
  return (
    <section>
      <p className="text-sm text-rhythm-text-secondary">{dateText}</p>
      <h1 className="r-page-title mt-2">今天</h1>
      <p className="r-page-description">把想做的事，做一点。</p>
      {total > 0 && <div className="mt-5 flex items-center gap-3">
        <span className="text-sm text-rhythm-text-secondary">习惯已完成 <strong className="text-rhythm-text-primary">{completed} / {total}</strong></span>
        <progress aria-label="今日习惯完成进度" value={completed} max={total} className="h-1.5 w-20 overflow-hidden rounded-full accent-rhythm-glow" />
      </div>}
    </section>
  )
}
