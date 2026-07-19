'use client'

import { RECORDS_SUB_TABS, type RecordsSubTab } from './records-sub-tabs.ts'

export { RECORDS_SUB_TABS, isRecordsSubTab, type RecordsSubTab } from './records-sub-tabs.ts'

export function RecordsSubTabs({
  active,
  onChange,
}: {
  active: RecordsSubTab
  onChange: (t: RecordsSubTab) => void
}) {
  return (
    <div
      className="flex gap-4 border-b border-rhythm-border"
      role="tablist"
      aria-label="实践记录视图"
    >
      {RECORDS_SUB_TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          onClick={() => onChange(tab.id)}
          className={`pb-2 text-xs tracking-[0.06em] transition-colors border-b-2 -mb-px ${
            active === tab.id
              ? 'text-rhythm-glow border-rhythm-glow'
              : 'text-rhythm-text-muted border-transparent hover:text-rhythm-text-secondary'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
