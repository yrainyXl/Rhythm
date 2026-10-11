/** 实践日期统一使用上海日历日，与部署时区一致。 */
export function practiceDates(periodDays: number, now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now)
  const part = (type: string) => parts.find((p) => p.type === type)!.value
  const startDate = `${part('year')}-${part('month')}-${part('day')}`
  const end = new Date(`${startDate}T00:00:00Z`)
  end.setUTCDate(end.getUTCDate() + periodDays - 1)
  return { startDate, endDate: end.toISOString().slice(0, 10) }
}

export function validPeriod(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 3 && value <= 60
}

export function validDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

export function validateLog(
  body: { localDate?: unknown; status?: unknown; note?: unknown },
  round: { start_date: string; end_date: string },
  today = practiceDates(1).startDate,
): string | null {
  if (!validDate(body.localDate)) return '请选择有效日期'
  if (body.localDate < round.start_date || body.localDate > round.end_date) return '记录日期必须在本轮周期内'
  if (body.localDate > today) return '不能提前记录未来日期'
  if (!['done', 'partial', 'skipped'].includes(String(body.status))) return '请选择有效记录状态'
  if (body.note != null && typeof body.note !== 'string') return '记录说明必须是文字'
  return null
}
