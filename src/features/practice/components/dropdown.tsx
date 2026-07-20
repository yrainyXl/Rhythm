'use client'

import { useEffect, useRef, useState } from 'react'

export interface DropdownOption {
  value: string
  label: string
}

/**
 * Custom dropdown that renders a popover *below* the button, avoiding the mobile
 * native <select>'s top-anchored picker which crashed the sheet layout.
 */
export function Dropdown({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  options: DropdownOption[]
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const current = options.find((o) => o.value === value)
  const displayLabel = current?.label ?? placeholder ?? '选择'

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="w-full flex items-center justify-between bg-rhythm-void/40 border border-rhythm-border rounded-xl px-3 py-2.5 text-sm text-rhythm-text-primary text-left focus:outline-none focus:border-rhythm-border-strong">
        <span className={current ? 'text-rhythm-text-primary' : 'text-rhythm-text-muted'}>
          {displayLabel}
        </span>
        <svg
          viewBox="0 0 24 24"
          className={`w-3 h-3 flex-none transition-transform ${open ? 'rotate-180' : ''}`}
          style={{ stroke: 'currentColor', strokeWidth: 2, fill: 'none' }}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute z-10 left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-xl border border-rhythm-border-strong bg-rhythm-card shadow-lg">
          {options.map((o) => {
            const selected = o.value === value
            return (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => { onChange(o.value); setOpen(false) }}
                className={`w-full text-left px-3 py-2.5 text-sm cursor-pointer transition-colors ${
                  selected
                    ? 'bg-rhythm-glow-soft text-rhythm-glow'
                    : 'text-rhythm-text-primary hover:bg-rhythm-void/40'
                }`}>
                {o.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
