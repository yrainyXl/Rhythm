import type { HighlightWithBook } from '@/features/records/store/reading-store'

/** 按书分组词条。 */
export function groupHighlightsByBook(highlights: HighlightWithBook[]): Map<string, HighlightWithBook[]> {
  const map = new Map<string, HighlightWithBook[]>()
  highlights.forEach((h) => {
    const bookId = h.book_id
    if (!map.has(bookId)) map.set(bookId, [])
    map.get(bookId)!.push(h)
  })
  return map
}

function latestOf(list: HighlightWithBook[]): number {
  return Math.max(0, ...list.map((h) => (h.highlighted_at ? new Date(h.highlighted_at).getTime() : 0)))
}

/** 每组按 max(highlighted_at) 降序排列(最新词条的书排前面)。 */
export function sortBookGroupsByLatest(
  groups: Map<string, HighlightWithBook[]>,
): [string, HighlightWithBook[]][] {
  return Array.from(groups.entries()).sort((a, b) => latestOf(b[1]) - latestOf(a[1]))
}
