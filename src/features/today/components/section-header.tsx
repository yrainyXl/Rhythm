'use client'

export { buildSectionHeaderClasses } from './section-header.ts'
import { buildSectionHeaderClasses } from './section-header.ts'

export function SectionHeader({
  label,
  actionLabel,
  onAction,
}: {
  label: string
  actionLabel?: string
  onAction?: () => void
}) {
  const c = buildSectionHeaderClasses()
  return (
    <div className={c.wrapper}>
      <div className="flex items-center gap-2">
        <span className={c.dot} />
        <span className={c.label}>{label}</span>
      </div>
      {actionLabel && (
        <button type="button" onClick={onAction} className={c.action}>
          {actionLabel}
        </button>
      )}
    </div>
  )
}
