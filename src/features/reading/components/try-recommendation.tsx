'use client'

export function TryRecommendation() {
  return (
    <div className="p-4 rounded-2xl border relative"
      style={{ borderColor: 'rgba(220,180,130,0.22)', background: 'linear-gradient(180deg, rgba(220,180,130,0.07), transparent)' }}>
      <div className="text-[0.6rem] tracking-[0.14em] uppercase mb-2" style={{ color: 'rgb(220,180,130)' }}>
        来自《深度工作》· 关联你的议题(占位)
      </div>
      <p className="text-[0.78rem] text-rhythm-text-secondary leading-relaxed m-0 mb-2">
        <b className="text-rhythm-text-primary font-serifsc font-medium">用「分块专注 90 分钟」验证晚上的开始率。</b>
        接入后 AI 会基于阅读内容和你的当前议题生成候选实践。
      </p>
      <div className="text-[0.62rem] text-rhythm-text-muted mb-2 pb-2 border-b border-dashed border-rhythm-border">
        依据:接入后显示相关划线数量与议题匹配度
      </div>
      <div className="flex gap-1.5">
        <button type="button" className="px-2 py-1.5 rounded-lg text-[0.68rem] tracking-tight cursor-pointer"
          style={{ background: 'rgba(220,180,130,0.16)', border: '1px solid rgba(220,180,130,0.28)', color: 'rgb(220,180,130)' }}>
          发起实践
        </button>
        <button type="button" className="px-2 py-1.5 rounded-lg text-[0.68rem] tracking-tight cursor-pointer bg-transparent"
          style={{ border: '1px solid rgba(220,180,130,0.28)', color: 'rgb(220,180,130)' }}>
          先收藏
        </button>
        <button type="button" className="px-2 py-1.5 rounded-lg text-[0.68rem] tracking-tight cursor-pointer bg-transparent border border-rhythm-border text-rhythm-text-muted">
          忽略
        </button>
      </div>
    </div>
  )
}
