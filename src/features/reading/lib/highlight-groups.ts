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


/** 最新笔记优先，章节标签只合并相邻项，避免跨章节重排时间线。 */
export function groupRecentHighlightsByChapter<T extends {
  id: string
  chapter_title?: string | null
  highlighted_at: string | null
  created_at: string
}>(highlights: T[]): [string, T[]][] {
  const timestamp = (h: T) => Date.parse(h.highlighted_at || h.created_at) || 0
  const sorted = [...highlights].sort((a, b) =>
    timestamp(b) - timestamp(a) || Date.parse(b.created_at) - Date.parse(a.created_at) || b.id.localeCompare(a.id),
  )
  const groups: [string, T[]][] = []
  for (const highlight of sorted) {
    const chapter = highlight.chapter_title?.trim() || '其他章节'
    const previous = groups.at(-1)
    if (previous?.[0] === chapter) previous[1].push(highlight)
    else groups.push([chapter, [highlight]])
  }
  return groups
}
