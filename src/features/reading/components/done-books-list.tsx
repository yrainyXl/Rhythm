'use client'

const ITEMS = [
  { key: 'a', title: '被讨厌的勇气', tail: '2026-07-02 读完', status: 'done' as const },
  { key: 'b', title: '原子习惯', tail: '停在 45%', status: 'pause' as const },
] as const

export function DoneBooksList() {
  return (
    <div className="rounded-xl overflow-hidden bg-rhythm-card/40 border border-rhythm-border">
      {ITEMS.map((it, i) => (
        <div key={it.key}
          className={`flex items-center gap-2.5 px-3.5 py-2.5 ${i > 0 ? 'border-t border-rhythm-border' : ''}`}>
          <div className="w-6 h-8 rounded-sm flex-none"
            style={{ background: 'linear-gradient(135deg, rgba(150,175,205,0.35), rgba(150,175,205,0.15))' }} />
          <div className="flex-1 min-w-0">
            <b className="block text-[0.78rem] tracking-tight font-medium">《{it.title}》</b>
            <small className="block text-[0.62rem] text-rhythm-text-muted mt-0.5">{it.tail}</small>
          </div>
          <span className={`text-[0.6rem] tracking-tight px-1.5 py-0.5 rounded-full ${
            it.status === 'done' ? 'text-rhythm-success bg-rhythm-success-soft' : 'text-rhythm-warn bg-rhythm-warn-soft'
          }`}>
            {it.status === 'done' ? '读完' : '暂停'}
          </span>
        </div>
      ))}
    </div>
  )
}
