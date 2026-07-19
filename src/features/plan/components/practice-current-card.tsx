'use client'

export function PracticeCurrentCard() {
  return (
    <a className="col-span-full block p-4 rounded-2xl border relative overflow-hidden no-underline"
      style={{
        borderColor: 'rgba(143,180,220,0.28)',
        background: 'linear-gradient(180deg, rgba(143,180,220,0.10), rgba(20,27,39,0.8))',
        color: 'inherit',
      }}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-[0.58rem] tracking-[0.16em] uppercase" style={{ color: 'rgba(143,180,220,0.85)' }}>
          当前实践 · 静态占位
        </span>
        <div className="w-6 h-6 rounded-lg grid place-items-center flex-none"
          style={{ background: 'rgba(143,180,220,0.2)', color: 'rgb(143,180,220)' }}>
          <svg viewBox="0 0 24 24" className="w-3 h-3" style={{ stroke: 'currentColor', strokeWidth: 1.7, fill: 'none' }}>
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      </div>
      <h3 className="font-serifsc font-medium text-[1.05rem] tracking-tight leading-snug m-0 mb-2">
        实践数据下阶段接入
      </h3>
      <div className="text-[0.66rem] tracking-tight text-rhythm-text-secondary leading-relaxed">
        接入后:显示当前实践名称、本轮第 N/M 天、假设、快速三态记录、详细记录入口。
      </div>
      <div className="flex gap-2 mt-3 relative z-10">
        <button type="button" className="flex-1 px-2 py-2 rounded-[9px] font-inherit text-[0.7rem] tracking-tight cursor-pointer"
          style={{ background: 'rgba(143,180,220,0.22)', border: '1px solid rgba(143,180,220,0.42)', color: 'rgb(143,180,220)' }}>
          记一笔
        </button>
        <button type="button" className="flex-1 px-2 py-2 rounded-[9px] font-inherit text-[0.7rem] tracking-tight cursor-pointer bg-transparent text-rhythm-text-primary border border-rhythm-border-strong">
          调整
        </button>
        <button type="button" className="flex-1 px-2 py-2 rounded-[9px] font-inherit text-[0.7rem] tracking-tight cursor-pointer bg-transparent text-rhythm-text-primary border border-rhythm-border-strong">
          结束
        </button>
      </div>
    </a>
  )
}
