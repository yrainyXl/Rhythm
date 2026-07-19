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
      className="flex gap-1 rounded-xl p-1 border border-rhythm-border bg-rhythm-void/40"
      role="tablist"
      aria-label="记录页分类"
    >
      {RECORDS_TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium tracking-[0.04em] transition-all ${
            active === tab.id
              ? 'text-rhythm-text-primary bg-rhythm-glow-soft border border-rhythm-border-strong'
              : 'text-rhythm-text-muted hover:text-rhythm-text-secondary border border-transparent'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
