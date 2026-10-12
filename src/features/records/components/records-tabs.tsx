'use client'

import { RECORDS_TABS, type RecordsTab } from './records-tabs.ts'

export { RECORDS_TABS, isRecordsTab, type RecordsTab } from './records-tabs.ts'

export function RecordsTabs({
  active,
  onChange,
}: {
  active: RecordsTab
  onChange: (t: RecordsTab) => void
}) {
  return (
    <div
      className="flex gap-1 rounded-2xl p-1 bg-rhythm-glow-soft"
      role="tablist"
      aria-label="记录页分类"
    >
      {RECORDS_TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          id={`records-tab-${tab.id}`}
          aria-controls={`records-panel-${tab.id}`}
          tabIndex={active === tab.id ? 0 : -1}
          onKeyDown={(event) => {
            const items = RECORDS_TABS
            const current = items.findIndex((item) => item.id === tab.id)
            let index = current
            if (event.key === 'ArrowRight') index = (current + 1) % items.length
            else if (event.key === 'ArrowLeft') index = (current + items.length - 1) % items.length
            else if (event.key === 'Home') index = 0
            else if (event.key === 'End') index = items.length - 1
            else return
            event.preventDefault()
            onChange(items[index].id)
            const buttons = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
            buttons?.[index]?.focus()
          }}
          role="tab"
          aria-selected={active === tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex-1 min-h-[44px] px-2 py-2 rounded-xl text-sm font-medium transition-colors ${
            active === tab.id
              ? 'text-rhythm-glow bg-rhythm-card shadow-sm'
              : 'text-rhythm-text-secondary hover:text-rhythm-glow'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
