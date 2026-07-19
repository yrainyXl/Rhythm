'use client'

const BOOKS = [
  { key: 'a', title: '深度工作', author: '卡尔·纽波特', progress: '62%', highlights: '128 划线', variant: 'a' },
  { key: 'b', title: 'The Practice', author: 'Seth Godin', progress: '34%', highlights: '42 划线', variant: 'b' },
  { key: 'c', title: '被讨厌的勇气', author: '岸见一郎', progress: '已读完', highlights: '76 划线', variant: 'c' },
] as const

const VARIANT_BG: Record<string, string> = {
  a: 'linear-gradient(135deg, rgba(143,180,220,0.35), rgba(143,180,220,0.15))',
  b: 'linear-gradient(135deg, #8fa8b8, #4a5c74)',
  c: 'linear-gradient(135deg, #c5a68d, #7f6952)',
}

export function BookshelfRow() {
  return (
    <div className="flex gap-3 overflow-x-auto py-2 -mx-1 px-1 snap-x snap-mandatory">
      {BOOKS.map((b) => (
        <a key={b.key} className="flex-none w-[102px] snap-start no-underline text-inherit cursor-pointer">
          <div className="w-full h-[145px] rounded-r-lg rounded-l-sm relative overflow-hidden p-2.5 flex flex-col justify-end"
            style={{
              background: VARIANT_BG[b.variant],
              boxShadow: '1px 3px 12px -3px rgba(0,0,0,0.4), inset 5px 0 8px -6px rgba(0,0,0,0.4)',
            }}>
            <span aria-hidden className="absolute left-0 top-0 bottom-0 w-1"
              style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.3), transparent)' }} />
            <div className="font-serifsc font-medium text-[0.75rem] leading-tight tracking-tight text-white relative z-10">
              {b.title}
            </div>
            <div className="text-[0.55rem] text-white/70 mt-0.5 relative z-10">{b.author}</div>
          </div>
          <div className="text-[0.62rem] text-rhythm-text-muted mt-1.5 tracking-tight">
            <b className="text-rhythm-text-secondary font-serifsc font-medium">{b.progress}</b>
            {b.highlights ? ` · ${b.highlights}` : ''}
          </div>
        </a>
      ))}
      <a className="flex-none w-[102px] snap-start cursor-pointer no-underline text-inherit">
        <div className="w-full h-[145px] rounded-lg grid place-items-center border-2 border-dashed border-rhythm-border-strong bg-rhythm-card/40">
          <span className="text-2xl text-rhythm-text-muted">+</span>
        </div>
        <div className="text-[0.62rem] text-rhythm-text-muted mt-1.5 tracking-tight">添加书籍</div>
      </a>
    </div>
  )
}
