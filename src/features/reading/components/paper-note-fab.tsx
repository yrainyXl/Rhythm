'use client'

export function PaperNoteFab() {
  return (
    <button type="button"
      aria-label="纸书笔记(下阶段接入)"
      className="fixed z-15 flex items-center gap-1.5 px-4 py-2.5 rounded-full font-serifsc text-[0.78rem] tracking-tight text-white border-0 cursor-pointer shadow-lg"
      style={{
        bottom: 'calc(5.4rem + env(safe-area-inset-bottom))',
        left: 'calc(50% + 240px - 8rem)',
        background: 'rgba(143,180,220,0.9)',
        boxShadow: '0 8px 24px -6px rgba(143,180,220,0.55)',
      }}>
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" style={{ stroke: 'currentColor', strokeWidth: 2.2, fill: 'none' }}>
        <path d="M12 5v14M5 12h14" />
      </svg>
      纸书笔记
    </button>
  )
}
