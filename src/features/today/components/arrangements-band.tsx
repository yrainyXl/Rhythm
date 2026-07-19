'use client'

const BANDS = [
  { key: 'morning', tag: '早' },
  { key: 'afternoon', tag: '午' },
  { key: 'evening', tag: '晚' },
  { key: 'night', tag: '夜' },
] as const

export function ArrangementsBand() {
  return (
    <div className="rounded-2xl border border-rhythm-border bg-rhythm-card/80 backdrop-blur-sm p-4 space-y-2">
      {BANDS.map((b, i) => (
        <div key={b.key} className="grid grid-cols-[42px_1fr] gap-3 items-stretch">
          <div className="flex flex-col items-center gap-1.5 pt-1">
            <span className="text-[0.6rem] tracking-[0.1em] text-rhythm-text-muted">{b.tag}</span>
            <span className="w-2 h-2 rounded-full border border-rhythm-border-strong bg-rhythm-void/60" />
            {i < BANDS.length - 1 && <span className="flex-1 w-px bg-gradient-to-b from-rhythm-border-strong to-transparent" />}
          </div>
          <div className="pb-0.5">
            <div className="flex items-center gap-2 px-3 py-3 rounded-xl border border-dashed border-rhythm-border-strong text-rhythm-text-muted text-[0.8rem]">
              <span className="w-4 h-4 rounded-full grid place-items-center border border-rhythm-border-strong text-rhythm-glow text-[0.7rem]">
                +
              </span>
              添加{b.tag}间安排(下阶段接入)
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
