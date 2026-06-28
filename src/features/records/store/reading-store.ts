'use client'

import { create } from 'zustand'
import { createBrowserClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'

type ReadingBook = Database['public']['Tables']['reading_books']['Row']
type ReadingSession = Database['public']['Tables']['reading_sessions']['Row']
type BookStatus = 'reading' | 'finished' | 'paused' | 'dropped'
type BookSource = 'manual' | 'weixin_read' | 'kindle' | 'other'

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

  loadBooks: () => Promise<void>
  loadRecentSessions: (limit?: number) => Promise<void>
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

  loadBooks: async () => {
    const supabase = createBrowserClient()
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return

    const { data } = await supabase
      .from('reading_books')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    set({ books: data ?? [] })
  },

  loadRecentSessions: async (limit = 10) => {
    const supabase = createBrowserClient()
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return

    const { data } = await supabase
      .from('reading_sessions')
      .select('*, reading_books!inner(title)')
      .eq('user_id', user.id)
      .order('read_date', { ascending: false })
      .limit(limit)

    set({ recentSessions: data ?? [] })
  },

  addBook: async (data) => {
    const supabase = createBrowserClient()
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return null

    set({ isSaving: true })
    const { data: book, error } = await supabase
      .from('reading_books')
      .insert({
        user_id: user.id,
        title: data.title,
        author: data.author ?? null,
        total_pages: data.total_pages ?? null,
        source: data.source ?? 'manual',
        status: 'reading',
      })
      .select()
      .single()

    set({ isSaving: false })
    if (!error) await useReadingStore.getState().loadBooks()
    return book ?? null
  },

  updateBookStatus: async (bookId, status) => {
    const supabase = createBrowserClient()
    const now = status === 'finished' ? new Date().toISOString().split('T')[0] : null

    await supabase
      .from('reading_books')
      .update({
        status,
        finished_at: now,
      })
      .eq('id', bookId)

    await useReadingStore.getState().loadBooks()
  },

  recordSession: async (data) => {
    const supabase = createBrowserClient()
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return { error: 'Not authenticated' }

    set({ isSaving: true })

    const { error } = await supabase.from('reading_sessions').insert({
      book_id: data.book_id,
      user_id: user.id,
      read_date: new Date().toISOString().split('T')[0],
      duration_minutes: data.duration_minutes,
      pages_read: data.pages_read ?? null,
      note: data.note ?? null,
    })

    if (!error && data.pages_read) {
      // Read current book to get current_page
      const { data: book } = await supabase
        .from('reading_books')
        .select('current_page')
        .eq('id', data.book_id)
        .single()

      if (book) {
        await supabase
          .from('reading_books')
          .update({ current_page: (book.current_page ?? 0) + data.pages_read })
          .eq('id', data.book_id)
      }
    }

    set({ isSaving: false })
    return { error: error?.message ?? null }
  },

  runAnalysis: async () => {
    set({ isLoadingAnalysis: true })
    const supabase = createBrowserClient()
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)
    const startStr = startDate.toISOString().split('T')[0]

    const { data: sessions } = await supabase
      .from('reading_sessions')
      .select('*, reading_books!inner(title)')
      .eq('user_id', user.id)
      .gte('read_date', startStr)
      .order('read_date', { ascending: false })

    const { data: books } = await supabase
      .from('reading_books')
      .select('*')
      .eq('user_id', user.id)

    const allBooks = books ?? []
    const allSessions = (sessions ?? []) as (ReadingSession & { reading_books: { title: string } })[]

    const readingBooks = allBooks.filter((b) => b.status === 'reading').length
    const finishedBooks = allBooks.filter((b) => b.status === 'finished').length
    const totalSessions = allSessions.length
    const totalDuration = allSessions.reduce((sum, s) => sum + s.duration_minutes, 0)
    const totalPages = allSessions.reduce((sum, s) => sum + (s.pages_read ?? 0), 0)

    // Weekly trend
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

    // Recent sessions with book titles
    const recentSessions = allSessions.slice(0, 10).map((s) => ({
      ...s,
      book_title: s.reading_books?.title ?? '未知书籍',
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
  },
}))
