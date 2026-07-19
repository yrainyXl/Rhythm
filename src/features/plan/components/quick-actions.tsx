'use client'

const ACTIONS = [
  { key: 'practice', label: '发起实践', path: 'M12 2v6l4-4M12 8l-4-4' },
  { key: 'topic', label: '新议题', path: 'M12 8v4M12 16h.01' },
  { key: 'method', label: '写方法', path: 'M9 12l2 2 4-4' },
  { key: 'habit', label: '加习惯', path: 'M20 6L9 17l-5-5' },
] as const

export function QuickActions() {
  return (
    <div className="grid grid-cols-4 gap-2">
      {ACTIONS.map((a) => (
        <button
          key={a.key}
          type="button"
          className="flex flex-col items-center gap-1.5 px-1 py-3 rounded-xl border border-rhythm-border bg-rhythm-card/40 text-rhythm-text-secondary text-[0.68rem] tracking-tight cursor-pointer transition-colors hover:border-rhythm-border-strong hover:text-rhythm-text-primary"
        >
          <span className="flex-none w-8 h-8 rounded-[10px] grid place-items-center bg-rhythm-glow-soft text-rhythm-glow">
            <svg viewBox="0 0 24 24" className="w-4 h-4" style={{ stroke: 'currentColor', strokeWidth: 1.7, fill: 'none' }}>
              {a.key === 'topic' && <circle cx="12" cy="12" r="9" />}
              {a.key === 'method' && <circle cx="12" cy="12" r="9" />}
              {a.key === 'practice' && <circle cx="12" cy="14" r="8" />}
              <path d={a.path} />
            </svg>
          </span>
          <b className="font-medium tracking-tight leading-tight">{a.label}</b>
        </button>
      ))}
    </div>
  )
}
