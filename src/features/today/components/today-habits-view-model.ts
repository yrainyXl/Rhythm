interface WithStatus {
  status: string
}

/** 按状态拆分 occurrences。保留元素原类型(泛型 T)。 */
export function splitOccurrences<T extends WithStatus>(occurrences: T[]) {
  const pending = occurrences.filter((o) => o.status === 'pending')
  const done = occurrences.filter((o) => o.status === 'done' || o.status === 'skipped')
  return { pending, done }
}
