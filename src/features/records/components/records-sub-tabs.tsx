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
          id={`records-sub-tab-${tab.id}`}
          aria-controls={`records-view-${tab.id}`}
          tabIndex={active === tab.id ? 0 : -1}
          onKeyDown={(event) => {
            const items = RECORDS_SUB_TABS
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
          className={`min-h-[44px] px-1 text-sm font-medium transition-colors border-b-2 -mb-px ${
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
