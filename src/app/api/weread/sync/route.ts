import { NextResponse, type NextRequest } from 'next/server'
import { withUser } from '@/lib/cloudbase/db'

export const runtime = 'nodejs'

const GATEWAY = 'https://i.weread.qq.com/api/agent/gateway'
const SKILL_VERSION = '1.0.4'

// 微信读书官方网关：POST 一个 api_name + 平铺业务参数，Bearer 鉴权
async function gateway(apiKey: string, apiName: string, params: Record<string, unknown> = {}) {
  const res = await fetch(GATEWAY, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ api_name: apiName, ...params, skill_version: SKILL_VERSION }),
  })
  const json = await res.json().catch(() => null)
  if (!json) throw new Error(`${apiName}: 非 JSON 响应 (HTTP ${res.status})`)
  const errcode = json.errcode ?? json.errCode ?? 0
  if (errcode !== 0) {
    throw new Error(`${apiName}: errcode=${errcode} ${json.errmsg || json.errMsg || ''}`)
  }
  return json
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const toIso = (unixSec: number | undefined | null) =>
  unixSec ? new Date(unixSec * 1000).toISOString() : null

/** POST /api/weread/sync - 从微信读书同步划线/想法到 reading_books + reading_highlights。 */
export async function POST(_request: NextRequest) {
  const apiKey = process.env.WEREAD_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: '未配置 WEREAD_API_KEY，请在环境变量中设置微信读书 API Key' },
      { status: 500 },
    )
  }

  return withUser(_request, async (userId, db) => {
    try {
      // 1) 拉全部有笔记的书（翻页），只保留「在读」(markedStatus !== 2 即未读完)
      type NotebookBook = {
        bookId: string
        book?: { title?: string; author?: string; cover?: string; totalPages?: number }
        noteCount?: number
        reviewCount?: number
        markedStatus?: number
        sort?: number
      }
      const notebooks: NotebookBook[] = []
      let lastSort: number | undefined
      for (let page = 0; page < 20; page++) {
        const params: Record<string, unknown> = { count: 20 }
        if (lastSort != null) params.lastSort = lastSort
        const data = await gateway(apiKey, '/user/notebooks', params)
        const books: NotebookBook[] = data.books ?? []
        notebooks.push(...books)
        if (data.hasMore === 1 && books.length > 0) {
          lastSort = books[books.length - 1].sort
          await sleep(200)
        } else break
      }

      // 只同步在读、且有划线/想法的书；排除读完(4)
      const targets = notebooks.filter(
        (b) => b.markedStatus !== 4 && ((b.noteCount ?? 0) > 0 || (b.reviewCount ?? 0) > 0),
      )

      let bookCount = 0
      let highlightCount = 0
      let thoughtCount = 0

      for (const nb of targets) {
        // 2) upsert 书籍 (source=weixin_read)，拿本地 book.id
        const bookRes = await db.query<{ id: string }>(
          `INSERT INTO public.reading_books
             (user_id, title, author, total_pages, cover_url, source, source_book_id, status)
           VALUES ($1,$2,$3,$4,$5,'weixin_read',$6,'reading')
           ON CONFLICT (user_id, source, source_book_id)
           DO UPDATE SET title = EXCLUDED.title, author = EXCLUDED.author,
                         total_pages = EXCLUDED.total_pages, cover_url = EXCLUDED.cover_url,
                         updated_at = now()
           RETURNING id`,
          [
            userId,
            nb.book?.title ?? '未知书籍',
            nb.book?.author ?? null,
            nb.book?.totalPages ?? null,
            nb.book?.cover ?? null,
            nb.bookId,
          ],
        )
        if (bookRes.rowCount === 0) continue
        const localBookId = bookRes.rows[0].id
        bookCount++

        // 3) 划线内容
        if ((nb.noteCount ?? 0) > 0) {
          const bm = await gateway(apiKey, '/book/bookmarklist', { bookId: nb.bookId })
          const chapters: { chapterUid: number; title: string }[] = bm.chapters ?? []
          const chapterMap = new Map(chapters.map((c) => [c.chapterUid, c.title]))
          const rows = ((bm.updated ?? []) as Record<string, unknown>[]).map((m) => [
            userId,
            localBookId,
            'weixin_read',
            m.bookmarkId as string,
            'highlight',
            m.markText as string,
            chapterMap.get(m.chapterUid as number) ?? null,
            (m.chapterUid as number) ?? null,
            (m.colorStyle as number) ?? null,
            toIso(m.createTime as number),
          ])
          if (rows.length) {
            const res = await db.query(
              `INSERT INTO public.reading_highlights
                 (user_id, book_id, source, source_bookmark_id, kind, mark_text,
                  chapter_title, chapter_uid, color_style, highlighted_at)
               VALUES ${rows
                 .map(
                   (_, i) =>
                     `($${i * 10 + 1},$${i * 10 + 2},$${i * 10 + 3},$${i * 10 + 4},$${i * 10 + 5},$${i * 10 + 6},$${i * 10 + 7},$${i * 10 + 8},$${i * 10 + 9},$${i * 10 + 10})`,
                 )
                 .join(',')}
               ON CONFLICT (user_id, source, source_bookmark_id)
               DO UPDATE SET mark_text = EXCLUDED.mark_text, chapter_title = EXCLUDED.chapter_title,
                             chapter_uid = EXCLUDED.chapter_uid, color_style = EXCLUDED.color_style,
                             highlighted_at = EXCLUDED.highlighted_at`,
              rows.flat(),
            )
            highlightCount += res.rowCount ?? 0
          }
          await sleep(200)
        }

        // 4) 个人想法/点评
        if ((nb.reviewCount ?? 0) > 0) {
          const rv = await gateway(apiKey, '/review/list/mine', { bookid: nb.bookId, count: 100 })
          const rows = ((rv.reviews ?? []) as { review?: Record<string, unknown> }[])
            .filter((item) => item.review)
            .map((item) => {
              const r = item.review!
              return [
                userId,
                localBookId,
                'weixin_read',
                r.reviewId as string,
                'thought',
                (r.abstract as string) ?? null,
                (r.content as string) ?? null,
                (r.chapterName as string) ?? null,
                (r.chapterUid as number) ?? null,
                toIso(r.createTime as number),
              ]
            })
          if (rows.length) {
            const res = await db.query(
              `INSERT INTO public.reading_highlights
                 (user_id, book_id, source, source_bookmark_id, kind, mark_text, thought,
                  chapter_title, chapter_uid, highlighted_at)
               VALUES ${rows
                 .map(
                   (_, i) =>
                     `($${i * 10 + 1},$${i * 10 + 2},$${i * 10 + 3},$${i * 10 + 4},$${i * 10 + 5},$${i * 10 + 6},$${i * 10 + 7},$${i * 10 + 8},$${i * 10 + 9},$${i * 10 + 10})`,
                 )
                 .join(',')}
               ON CONFLICT (user_id, source, source_bookmark_id)
               DO UPDATE SET mark_text = EXCLUDED.mark_text, thought = EXCLUDED.thought,
                             chapter_title = EXCLUDED.chapter_title, chapter_uid = EXCLUDED.chapter_uid,
                             highlighted_at = EXCLUDED.highlighted_at`,
              rows.flat(),
            )
            thoughtCount += res.rowCount ?? 0
          }
          await sleep(200)
        }
      }

      return NextResponse.json({
        success: true,
        books: bookCount,
        highlights: highlightCount,
        thoughts: thoughtCount,
      })
    } catch (e) {
      const message = e instanceof Error ? e.message : '同步失败'
      return NextResponse.json({ error: message }, { status: 502 })
    }
  })
}
