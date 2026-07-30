export interface ServerTimingEntry {
  name: string
  duration: number
}

const VALID_NAME = /^[A-Za-z0-9_-]+$/

export function formatServerTiming(entries: ServerTimingEntry[]): string {
  return entries
    .filter(({ name, duration }) =>
      VALID_NAME.test(name) && Number.isFinite(duration) && duration >= 0,
    )
    .map(({ name, duration }) => `${name};dur=${duration.toFixed(1)}`)
    .join(', ')
}

