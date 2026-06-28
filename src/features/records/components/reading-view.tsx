'use client'

import { useState, useEffect } from 'react'
import { useReadingStore } from '@/features/records/store/reading-store'

export function ReadingView() {
  const { books, loadBooks, addBook, updateBookStatus, recordSession, isSaving } = useReadingStore()
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newAuthor, setNewAuthor] = useState('')
  const [newPages, setNewPages] = useState('')
  const [activeBookId, setActiveBookId] = useState<string | null>(null)
  const [sessionDuration, setSessionDuration] = useState('30')
  const [sessionPages, setSessionPages] = useState('')
  const [sessionNote, setSessionNote] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    loadBooks()
  }, [loadBooks])

  const handleAddBook = async () => {
    if (!newTitle.trim()) return
    const book = await addBook({
      title: newTitle,
      author: newAuthor || undefined,
      total_pages: newPages ? Number(newPages) : undefined,
    })
    if (book) {
      setNewTitle('')
      setNewAuthor('')
      setNewPages('')
      setShowAddForm(false)
    }
  }

  const handleRecordSession = async () => {
    if (!activeBookId || !sessionDuration) return
    const result = await recordSession({
      book_id: activeBookId,
      duration_minutes: Number(sessionDuration),
      pages_read: sessionPages ? Number(sessionPages) : undefined,
      note: sessionNote || undefined,
    })
    if (!result.error) {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
      setSessionDuration('30')
      setSessionPages('')
      setSessionNote('')
    }
  }

  const readingBooks = books.filter((b) => b.status === 'reading')
  const finishedBooks = books.filter((b) => b.status === 'finished')
  const pausedBooks = books.filter((b) => b.status === 'paused')

  if (success) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-3">📖</div>
        <p className="text-lg font-bold text-gray-900">已记录！</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Active book quick record */}
      {readingBooks.length > 0 && (
        <div className="bg-white rounded-xl border p-4">
          <h3 className="font-bold text-gray-900 text-sm mb-3">正在读</h3>
          <div className="space-y-2">
            {readingBooks.map((book) => (
              <div key={book.id}>
                <button
                  type="button"
                  onClick={() => setActiveBookId(book.id === activeBookId ? null : book.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    activeBookId === book.id ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{book.title}</p>
                      <p className="text-xs text-gray-400">
                        {book.author && `${book.author}`}
                        {book.total_pages && ` · ${book.current_page ?? 0}/${book.total_pages} 页`}
                      </p>
                    </div>
                    {book.current_page != null && book.total_pages && book.total_pages > 0 && (
                      <div className="w-12 h-1.5 bg-gray-100 rounded-full ml-2">
                        <div
                          className="bg-blue-500 h-1.5 rounded-full"
                          style={{ width: `${Math.round((book.current_page / book.total_pages) * 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                </button>

                {activeBookId === book.id && (
                  <div className="mt-3 pt-3 border-t space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">读了多久（分钟）</label>
                        <input
                          type="number"
                          value={sessionDuration}
                          onChange={(e) => setSessionDuration(e.target.value)}
                          min={1}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">读了（页）</label>
                        <input
                          type="number"
                          value={sessionPages}
                          onChange={(e) => setSessionPages(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">笔记/摘录（可选）</label>
                      <input
                        type="text"
                        value={sessionNote}
                        onChange={(e) => setSessionNote(e.target.value)}
                        placeholder="最有收获的一句话..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleRecordSession}
                      disabled={isSaving || !sessionDuration}
                      className="w-full py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {isSaving ? '保存...' : '记录'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add book */}
      {!showAddForm ? (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="w-full py-3 bg-white border-2 border-dashed border-gray-200 text-sm text-gray-400 rounded-xl hover:border-gray-300 hover:text-gray-500 transition-colors"
        >
          + 添加新书
        </button>
      ) : (
        <div className="bg-white rounded-xl border p-4 space-y-3">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="书名*"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={newAuthor}
              onChange={(e) => setNewAuthor(e.target.value)}
              placeholder="作者"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              value={newPages}
              onChange={(e) => setNewPages(e.target.value)}
              placeholder="总页数"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAddBook}
              disabled={!newTitle.trim() || isSaving}
              className="flex-1 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isSaving ? '添加中...' : '添加'}
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* Finished books */}
      {finishedBooks.length > 0 && (
        <details>
          <summary className="text-xs text-gray-400 cursor-pointer py-2">
            已读完 ({finishedBooks.length})
          </summary>
          <div className="mt-2 space-y-2">
            {finishedBooks.map((book) => (
              <div key={book.id} className="bg-white rounded-lg border p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-900">{book.title}</p>
                  <p className="text-xs text-gray-400">{book.author}</p>
                </div>
                <button
                  type="button"
                  onClick={() => updateBookStatus(book.id, 'reading')}
                  className="text-xs text-blue-500 hover:text-blue-700"
                >
                  重新开始
                </button>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}

export function ReadingAnalysis() {
  const { analysis, isLoadingAnalysis, runAnalysis } = useReadingStore()

  useEffect(() => {
    runAnalysis()
  }, [runAnalysis])

  if (isLoadingAnalysis || !analysis) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        还没有阅读数据
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border p-3 text-center">
          <p className="text-xs text-gray-400">在读</p>
          <p className="text-xl font-bold text-gray-900">{analysis.readingBooks}</p>
        </div>
        <div className="bg-white rounded-xl border p-3 text-center">
          <p className="text-xs text-gray-400">读完</p>
          <p className="text-xl font-bold text-gray-900">{analysis.finishedBooks}</p>
        </div>
        <div className="bg-white rounded-xl border p-3 text-center">
          <p className="text-xs text-gray-400">本月阅读</p>
          <p className="text-xl font-bold text-gray-900">{analysis.totalDuration}h</p>
        </div>
      </div>

      {/* Weekly trend */}
      {analysis.weeklyTrend.length > 0 && (
        <div className="bg-white rounded-xl border p-4">
          <h3 className="font-bold text-gray-900 text-sm mb-3">每周阅读</h3>
          <div className="space-y-2">
            {analysis.weeklyTrend.map(({ week, duration, pages }) => (
              <div key={week} className="flex items-center gap-3 text-sm">
                <span className="text-gray-500 w-16 text-xs">{week.slice(5)}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-purple-500 rounded-full h-2"
                    style={{ width: `${(duration / 60) * 10}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400 w-20 text-right">
                  {duration}m / {pages}页
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
