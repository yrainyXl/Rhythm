'use client'

const ITEMS = [
  { key: 'week', num: '3.2', unit: 'h', label: '本周' },
  { key: 'reading', num: '2', unit: '本', label: '在读' },
  { key: 'done', num: '14', unit: '本', label: '今年读完' },
  { key: 'highlights', num: '128', unit: '条', label: '划线' },
] as const

export function ReadingStatsBar() {
  return (
    <div className="flex justify-around py-3 rounded-xl border border-rhythm-border bg-rhythm-card/40">
      {ITEMS.map((it) => (
        <div key={it.key} className="text-center">
          <div className="font-serifsc text-[1.15rem] text-rhythm-text-primary leading-tight">
            {it.num}
            <small className="font-inherit text-[0.6rem] text-rhythm-text-muted ml-0.5">{it.unit}</small>
          </div>
          <div className="text-[0.6rem] tracking-tight text-rhythm-text-muted mt-1">{it.label}</div>
        </div>
      ))}
    </div>
  )
}
