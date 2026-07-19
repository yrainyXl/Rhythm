'use client'

export function PracticeHero() {
  return (
    <div
      className="rounded-2xl border p-5 backdrop-blur-sm"
      style={{
        borderColor: 'rgba(143,180,220,0.22)',
        background:
          'linear-gradient(180deg, rgba(143,180,220,0.07) 0%, rgba(20,27,39,0.82) 60%)',
      }}
    >
      <div className="flex gap-3 items-start">
        <span className="flex-none w-6 h-6 rounded-lg border grid place-items-center mt-0.5"
          style={{ borderColor: 'rgba(143,180,220,0.4)', background: 'rgba(143,180,220,0.06)' }}>
          <svg viewBox="0 0 24 24" className="w-3 h-3" style={{ stroke: 'rgb(143,180,220)', strokeWidth: 2.4, fill: 'none' }}>
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-[0.9rem] font-medium tracking-tight text-rhythm-text-primary">
            实践数据下阶段接入
          </div>
          <div className="flex items-center flex-wrap gap-1.5 mt-1.5">
            <span className="text-[0.62rem] tracking-tight text-rhythm-glow border border-[rgba(143,180,220,0.3)] bg-[rgba(143,180,220,0.08)] px-1.5 py-0.5 rounded-full">
              ● 静态占位
            </span>
          </div>
          <div className="mt-2 text-[0.72rem] leading-relaxed text-rhythm-text-secondary pl-3 border-l-2 border-[rgba(143,180,220,0.25)]">
            <em className="not-italic text-rhythm-text-muted tracking-wider">占位　</em>
            进行中的实践卡将展示假设、轮次进度、快速三态记录、详细记录入口。
          </div>
        </div>
      </div>
    </div>
  )
}
