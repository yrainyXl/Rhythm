export function canRecordDate(date: string, start: string, end: string, today: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && date >= start && date <= end && date <= today
}

export function summarizePracticeLogs(logs: { status: 'done' | 'partial' | 'skipped' }[]) {
  const counts = { done: 0, partial: 0, skipped: 0, total: logs.length }
  for (const log of logs) counts[log.status]++
  return counts
}

export function hasReviewContent(...fields: string[]): boolean {
  return fields.some((field) => field.trim().length > 0)
}
