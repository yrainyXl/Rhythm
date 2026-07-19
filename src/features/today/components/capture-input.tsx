'use client'

import { useState } from 'react'

export function CaptureInput() {
  const [value, setValue] = useState('')

  return (
    <div>
      <div className="flex items-center gap-2 rounded-2xl border border-rhythm-border bg-rhythm-void/60 px-3 py-2.5 transition-colors focus-within:border-[rgba(143,180,220,0.4)]">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="发生了什么,或者你正在怎么想…"
          className="flex-1 bg-transparent border-0 outline-none text-sm text-rhythm-text-primary placeholder-rhythm-text-muted"
        />
        <button
          type="button"
          disabled
          aria-label="语音记录(下阶段接入)"
          className="flex-none w-7 h-7 rounded-full grid place-items-center border border-rhythm-border-strong text-rhythm-glow bg-[rgba(143,180,220,0.06)] opacity-50 cursor-not-allowed"
        >
          <svg viewBox="0 0 24 24" className="w-3 h-3" style={{ stroke: 'rgb(143,180,220)', strokeWidth: 1.9, fill: 'none' }}>
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
          </svg>
        </button>
      </div>
      <p className="mt-2 text-[0.66rem] tracking-tight text-rhythm-text-muted">
        保存后,Rhythm 会建议关联到安排、实践或议题(下阶段接入)。
      </p>
    </div>
  )
}
