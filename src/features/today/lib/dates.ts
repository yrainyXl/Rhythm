const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
const SHORT_WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

function parse(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function todayIso(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

/** 10月14日 星期三 */
export function formatDayTitle(iso: string): string {
  const date = parse(iso)
  return `${date.getMonth() + 1}月${date.getDate()}日 ${WEEKDAYS[date.getDay()]}`
}

export function shortWeekday(iso: string): string {
  return SHORT_WEEKDAYS[parse(iso).getDay()]
}

/** 从 start 到 end（含）共多少天，以及 today 是第几天（限制在 1..total）。 */
export function roundDays(start: string, end: string, today: string): { total: number; elapsed: number } {
  const day = 86_400_000
  const s = parse(start).getTime()
  const total = Math.round((parse(end).getTime() - s) / day) + 1
  const elapsed = Math.min(total, Math.max(1, Math.round((parse(today).getTime() - s) / day) + 1))
  return { total, elapsed }
}

export function addDays(iso: string, n: number): string {
  const date = parse(iso)
  date.setDate(date.getDate() + n)
  return todayIso(date)
}

/** "19:30:00" → "19:30" */
export function shortTime(time: string | null): string | null {
  return time ? time.slice(0, 5) : null
}
