'use client'

export function TabPlaceholder({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="r-card p-10 text-center">
      <p className="r-title text-base text-rhythm-text-secondary">{title}</p>
      <p className="text-rhythm-text-muted text-xs mt-2">{hint}</p>
    </div>
  )
}
