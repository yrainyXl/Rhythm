'use client'

import { create } from 'zustand'
import { apiFetch } from '@/lib/cloudbase/api-client'

type BookStatus = 'reading' | 'finished' | 'paused' | 'dropped'
type BookSource = 'manual' | 'weixin_read' | 'kindle' | 'other'

export interface ReadingBook {
  id: string
  user_id: string
  title: string
  author: string | null
  isbn: string | null
  total_pages: number | null
  current_page: number
  status: BookStatus
  source: string
  source_book_id: string | null
  cover_url: string | null
  rating: number | null
  is_shared: boolean
  started_at: string | null
  finished_at: string | null
  created_at: string
  updated_at: string
}

interface ReadingSession {
  id: string
  book_id: string
  user_id: string
  read_date: string
  duration_minutes: number
  pages_read: number | null
  start_page: number | null
  end_page: number | null
  highlights: string | null
  note: string | null
  created_at: string
  book_title?: string
}

interface ReadingHighlight {
  id: string
  user_id: string
  book_id: string
  source: string
  source_bookmark_id: string | null
  kind: string
  mark_text: string | null
  thought: string | null
  chapter_title: string | null
  chapter_uid: number | null
  color_style: number | null
  highlighted_at: string | null
  created_at: string
  // API join 平铺字段
  title?: string
  author?: string | null
  cover_url?: string | null
  status?: BookStatus
  // API join 返回嵌套 reading_books(书名/作者/封面/状态),消费方读 first.reading_books.title
  reading_books?: {
    title: string
    author: string | null
    cover_url: string | null
    status: BookStatus
  } | null
}

export type HighlightWithBook = ReadingHighlight

export type SyncResult = { books: number; highlights: number; thoughts: number }

interface ReadingAnalysis {
  totalBooks: number
  readingBooks: number
  finishedBooks: number
  totalSessions: number
  totalDuration: number
  totalPages: number
  weeklyTrend: { week: string; duration: number; pages: number }[]
  recentSessions: (ReadingSession & { book_title: string })[]
}

interface ReadingState {
  books: ReadingBook[]
  currentBook: ReadingBook | null
  recentSessions: ReadingSession[]
  isSaving: boolean
  analysis: ReadingAnalysis | null
  isLoadingAnalysis: boolean
  highlights: HighlightWithBook[]
  isLoadingHighlights: boolean
  isSyncing: boolean
  syncError: string | null
  lastSyncResult: SyncResult | null

  loadBooks: () => Promise<void>
  loadRecentSessions: (limit?: number) => Promise<void>
  loadHighlights: () => Promise<void>
  syncWeread: () => Promise<void>
  addBook: (data: {
    title: string
    author?: string
    total_pages?: number
    source?: BookSource
  }) => Promise<ReadingBook | null>
  updateBookStatus: (bookId: string, status: BookStatus) => Promise<void>
  recordSession: (data: {
    book_id: string
    duration_minutes: number
    pages_read?: number
    note?: string
  }) => Promise<{ error: string | null }>
  runAnalysis: () => Promise<void>
}

export const useReadingStore = create<ReadingState>((set) => ({
  books: [],
  currentBook: null,
  recentSessions: [],
  isSaving: false,
  analysis: null,
  isLoadingAnalysis: false,
  highlights: [],
  isLoadingHighlights: false,
  isSyncing: false,
  syncError: null,
  lastSyncResult: null,

  loadBooks: async () => {
    try {
      const { books } = await apiFetch<{ books: ReadingBook[] }>('/api/reading/books')
      set({ books: books ?? [] })
    } catch {
      // 保持空
    }
  },

  loadRecentSessions: async (limit = 10) => {
    try {
      const { sessions } = await apiFetch<{ sessions: ReadingSession[] }>(
        `/api/reading/sessions?limit=${limit}`,
      )
      set({ recentSessions: sessions ?? [] })
    } catch {
      // 保持空
    }
  },

  loadHighlights: async () => {
    set({ isLoadingHighlights: true })
    try {
      const { highlights } = await apiFetch<{ highlights: HighlightWithBook[] }>(
        '/api/reading/highlights',
      )
      set({ highlights: highlights ?? [], isLoadingHighlights: false })
    } catch {
      set({ isLoadingHighlights: false })
    }
  },

  syncWeread: async () => {
    set({ isSyncing: true, syncError: null })
    try {
      const body = await apiFetch<SyncResult>('/api/weread/sync', { method: 'POST' })
      set({
        isSyncing: false,
        lastSyncResult: { books: body.books, highlights: body.highlights, thoughts: body.thoughts },
      })
      await useReadingStore.getState().loadBooks()
      await useReadingStore.getState().loadHighlights()
    } catch (e) {
      set({ isSyncing: false, syncError: e instanceof Error ? e.message : '同步失败' })
    }
  },

  addBook: async (data) => {
    set({ isSaving: true })
    try {
      const { book } = await apiFetch<{ book: ReadingBook }>('/api/reading/books', {
        method: 'POST',
        body: JSON.stringify({
          title: data.title,
          author: data.author ?? null,
          total_pages: data.total_pages ?? null,
          source: data.source ?? 'manual',
          status: 'reading',
        }),
      })
      set({ isSaving: false })
      await useReadingStore.getState().loadBooks()
      return book ?? null
    } catch {
      set({ isSaving: false })
      return null
    }
  },

  updateBookStatus: async (bookId, status) => {
    try {
      await apiFetch(`/api/reading/books/${bookId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      await useReadingStore.getState().loadBooks()
    } catch {
      // 忽略
    }
  },

  recordSession: async (data) => {
    set({ isSaving: true })
    try {
      await apiFetch('/api/reading/sessions', {
        method: 'POST',
        body: JSON.stringify({
          book_id: data.book_id,
          duration_minutes: data.duration_minutes,
          pages_read: data.pages_read ?? null,
          note: data.note ?? null,
        }),
      })
      set({ isSaving: false })
      await useReadingStore.getState().loadBooks()
      return { error: null }
    } catch (e) {
      set({ isSaving: false })
      return { error: e instanceof Error ? e.message : '保存失败' }
    }
  },

  runAnalysis: async () => {
    set({ isLoadingAnalysis: true })
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)
    const startStr = startDate.toISOString().split('T')[0]

    try {
      const [sessionsRes, booksRes] = await Promise.all([
        apiFetch<{ sessions: ReadingSession[] }>('/api/reading/sessions?limit=500'),
        apiFetch<{ books: ReadingBook[] }>('/api/reading/books'),
      ])
      const allBooks = booksRes.books ?? []
      const allSessions = (sessionsRes.sessions ?? []).filter((s) => s.read_date >= startStr)

      const readingBooks = allBooks.filter((b) => b.status === 'reading').length
      const finishedBooks = allBooks.filter((b) => b.status === 'finished').length
      const totalSessions = allSessions.length
      const totalDuration = allSessions.reduce((sum, s) => sum + s.duration_minutes, 0)
      const totalPages = allSessions.reduce((sum, s) => sum + (s.pages_read ?? 0), 0)

      const weeklyMap: Record<string, { duration: number; pages: number }> = {}
      allSessions.forEach((s) => {
        const d = new Date(s.read_date + 'T00:00')
        const weekStart = new Date(d)
        weekStart.setDate(d.getDate() - d.getDay() + 1)
        const weekKey = weekStart.toISOString().split('T')[0]
        if (!weeklyMap[weekKey]) weeklyMap[weekKey] = { duration: 0, pages: 0 }
        weeklyMap[weekKey].duration += s.duration_minutes
        weeklyMap[weekKey].pages += s.pages_read ?? 0
      })
      const weeklyTrend = Object.entries(weeklyMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([week, data]) => ({ week, ...data }))

      const recentSessions = allSessions.slice(0, 10).map((s) => ({
        ...s,
        book_title: s.book_title ?? '未知书籍',
      }))

      set({
        analysis: {
          totalBooks: allBooks.length,
          readingBooks,
          finishedBooks,
          totalSessions,
          totalDuration,
          totalPages,
          weeklyTrend,
          recentSessions,
        },
        isLoadingAnalysis: false,
      })
    } catch {
      set({ isLoadingAnalysis: false })
    }
  },
}))
