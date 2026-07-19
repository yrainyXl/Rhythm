export type RecordsTab = 'records' | 'sleep' | 'reflection' | 'review'

export const RECORDS_TABS: { id: RecordsTab; label: string }[] = [
  { id: 'records', label: '记录' },
  { id: 'sleep', label: '睡眠' },
  { id: 'reflection', label: '复盘' },
  { id: 'review', label: '回顾' },
]

export function isRecordsTab(value: string): value is RecordsTab {
  return RECORDS_TABS.some((t) => t.id === value)
}
