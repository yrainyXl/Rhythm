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
        <p className="text-lg r-title">已记录！</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Active book quick record */}
      {readingBooks.length > 0 && (
        <div className="r-card p-4">
          <h3 className="r-title text-sm mb-3">正在读</h3>
          <div className="space-y-2">
            {readingBooks.map((book) => (
              <div key={book.id}>
                <button
                  type="button"
                  onClick={() => setActiveBookId(book.id === activeBookId ? null : book.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-colors ${
                    activeBookId === book.id ? 'border-rhythm-glow bg-rhythm-glow-soft' : 'border-rhythm-border hover:bg-rhythm-void/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-rhythm-text-primary truncate">{book.title}</p>
                      <p className="text-xs text-rhythm-text-muted">
                        {book.author && `${book.author}`}
                        {book.total_pages && ` · ${book.current_page ?? 0}/${book.total_pages} 页`}
                      </p>
                    </div>
                    {book.current_page != null && book.total_pages && book.total_pages > 0 && (
                      <div className="w-12 h-1.5 bg-rhythm-void/40 border border-rhythm-border rounded-full ml-2">
                        <div
                          className="bg-rhythm-glow h-1.5 rounded-full"
                          style={{ width: `${Math.round((book.current_page / book.total_pages) * 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                </button>

                {activeBookId === book.id && (
                  <div className="mt-3 pt-3 border-t border-rhythm-border space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="r-label">读了多久（分钟）</label>
                        <input
                          type="number"
                          value={sessionDuration}
                          onChange={(e) => setSessionDuration(e.target.value)}
                          min={1}
                          className="r-input"
                        />
                      </div>
                      <div>
                        <label className="r-label">读了（页）</label>
                        <input
                          type="number"
                          value={sessionPages}
                          onChange={(e) => setSessionPages(e.target.value)}
                          className="r-input"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="r-label">笔记/摘录（可选）</label>
                      <input
                        type="text"
                        value={sessionNote}
                        onChange={(e) => setSessionNote(e.target.value)}
                        placeholder="最有收获的一句话..."
                        className="r-input"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleRecordSession}
                      disabled={isSaving || !sessionDuration}
                      className="r-btn-primary w-full py-2 text-sm disabled:opacity-50"
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
          className="w-full py-3 border-2 border-dashed border-rhythm-border text-sm text-rhythm-text-muted rounded-xl hover:border-rhythm-border-strong hover:text-rhythm-text-secondary transition-colors"
        >
          + 添加新书
        </button>
      ) : (
        <div className="r-card p-4 space-y-3">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="书名*"
            className="r-input"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={newAuthor}
              onChange={(e) => setNewAuthor(e.target.value)}
              placeholder="作者"
              className="r-input"
            />
            <input
              type="number"
              value={newPages}
              onChange={(e) => setNewPages(e.target.value)}
              placeholder="总页数"
              className="r-input"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAddBook}
              disabled={!newTitle.trim() || isSaving}
              className="r-btn-primary flex-1 py-2 text-sm disabled:opacity-50"
            >
              {isSaving ? '添加中...' : '添加'}
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="r-btn-ghost px-4 py-2 text-sm"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* Finished books */}
      {finishedBooks.length > 0 && (
        <details>
          <summary className="r-eyebrow cursor-pointer py-2">
            已读完 ({finishedBooks.length})
          </summary>
          <div className="mt-2 space-y-2">
            {finishedBooks.map((book) => (
              <div key={book.id} className="r-card p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm text-rhythm-text-primary">{book.title}</p>
                  <p className="text-xs text-rhythm-text-muted">{book.author}</p>
                </div>
                <button
                  type="button"
                  onClick={() => updateBookStatus(book.id, 'reading')}
                  className="text-xs text-rhythm-glow hover:text-rhythm-text-primary"
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
      <div className="text-center py-8 text-rhythm-text-muted text-sm">
        还没有阅读数据
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="r-card p-3 text-center">
          <p className="text-xs text-rhythm-text-muted">在读</p>
          <p className="text-xl r-title">{analysis.readingBooks}</p>
        </div>
        <div className="r-card p-3 text-center">
          <p className="text-xs text-rhythm-text-muted">读完</p>
          <p className="text-xl r-title">{analysis.finishedBooks}</p>
        </div>
        <div className="r-card p-3 text-center">
          <p className="text-xs text-rhythm-text-muted">本月阅读</p>
          <p className="text-xl r-title">{Math.round((analysis.totalDuration / 60) * 10) / 10}h</p>
        </div>
      </div>

      {/* Weekly trend */}
      {analysis.weeklyTrend.length > 0 && (
        <div className="r-card p-4">
          <h3 className="r-title text-sm mb-3">每周阅读</h3>
          <div className="space-y-2">
            {analysis.weeklyTrend.map(({ week, duration, pages }) => (
              <div key={week} className="flex items-center gap-3 text-sm">
                <span className="text-rhythm-text-secondary w-16 text-xs">{week.slice(5)}</span>
                <div className="flex-1 bg-rhythm-void/40 border border-rhythm-border rounded-full h-2">
                  <div
                    className="bg-rhythm-glow rounded-full h-2"
                    style={{ width: `${(duration / 60) * 10}%` }}
                  />
                </div>
                <span className="text-xs text-rhythm-text-muted w-20 text-right">
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
