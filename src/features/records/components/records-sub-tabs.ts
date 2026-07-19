export type RecordsSubTab = 'list' | 'trends'

export const RECORDS_SUB_TABS: { id: RecordsSubTab; label: string }[] = [
  { id: 'list', label: '记录' },
  { id: 'trends', label: '趋势' },
]

export function isRecordsSubTab(value: string): value is RecordsSubTab {
  return RECORDS_SUB_TABS.some((t) => t.id === value)
}
