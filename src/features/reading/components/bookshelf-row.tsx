'use client'

import Link from 'next/link'
import { useReadingStore } from '@/features/records/store/reading-store'
export function BookshelfRow() {
  const { books } = useReadingStore()

  // Only show reading books on the homepage row
  const readingBooks = books.filter(b => b.status === 'reading').slice(0, 5)

  if (readingBooks.length === 0) {
    return <div className="py-4"><p className="text-base text-rhythm-text-secondary">书架还没有在读的书</p><Link href="/reading/books" className="r-link mt-2">去书架添加一本</Link></div>
  }

  return (
    <div className="flex gap-4 overflow-x-auto py-2 -mx-1 px-1 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {readingBooks.map((b) => (
        <Link
          key={b.id}
          href={`/reading/${b.id}`}
          className="group flex-none w-[116px] snap-start rounded-lg no-underline text-inherit cursor-pointer">
          <div className="w-full aspect-[2/3] rounded-lg relative overflow-hidden transition-shadow group-hover:shadow-md"
            style={{
              background: b.cover_url ? `url(${JSON.stringify(b.cover_url)})` : 'var(--r-subtle-background)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              border: '1px solid var(--r-border)',
            }}>
            {!b.cover_url && (
              <div className="flex h-full flex-col justify-between px-3 py-4 text-rhythm-text-primary">
                <span className="line-clamp-4 break-words text-base font-semibold leading-snug">{b.title}</span>
                {b.author && <span className="line-clamp-2 text-xs leading-relaxed text-rhythm-text-secondary">{b.author}</span>}
              </div>
            )}
          </div>
          <p className="mt-3 h-10 line-clamp-2 text-sm font-semibold leading-5 text-rhythm-text-primary transition-colors group-hover:text-rhythm-glow">{b.title}</p>
          <div className="mt-1 text-xs text-rhythm-text-secondary">
            {b.current_page && b.total_pages ? (
              <b className="text-rhythm-text-secondary font-medium">
                {Math.round((b.current_page / b.total_pages) * 100)}%
              </b>
            ) : (
              <b className="text-rhythm-text-secondary font-medium">
                {b.status === 'reading' ? '在读' : b.status}
              </b>
            )}
            {b.total_pages ? ` · ${b.total_pages} 页` : ''}
          </div>
        </Link>
      ))}
    </div>
  )
}
