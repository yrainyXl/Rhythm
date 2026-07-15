import { createRouteHandlerSupabaseClient } from '@/lib/supabase/route-handler'
import { NextResponse } from 'next/server'

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

export async function POST() {
  const supabase = createRouteHandlerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.WEREAD_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: '未配置 WEREAD_API_KEY，请在 .env.local 中设置微信读书 API Key' },
      { status: 500 }
    )
  }

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

    // 只同步在读、且有划线/想法的书
    // markedStatus 实测语义: 4=读完, 1=想读, 2/3=在读。排除读完(4)。
    const targets = notebooks.filter(
      (b) => b.markedStatus !== 4 && ((b.noteCount ?? 0) > 0 || (b.reviewCount ?? 0) > 0)
    )

    let bookCount = 0
    let highlightCount = 0
    let thoughtCount = 0

    for (const nb of targets) {
      // 2) upsert 书籍 (source=weixin_read)，拿本地 book.id
      const { data: bookRow, error: bookErr } = await supabase
        .from('reading_books')
        .upsert(
          {
            user_id: user.id,
            title: nb.book?.title ?? '未知书籍',
            author: nb.book?.author ?? null,
            total_pages: nb.book?.totalPages ?? null,
            cover_url: nb.book?.cover ?? null,
            source: 'weixin_read',
            source_book_id: nb.bookId,
            status: 'reading',
          },
          { onConflict: 'user_id,source,source_book_id' }
        )
        .select('id')
        .single()

      if (bookErr || !bookRow) continue
      bookCount++
      const localBookId = bookRow.id

      // 3) 划线内容
      const bmRows: Record<string, unknown>[] = []
      if ((nb.noteCount ?? 0) > 0) {
        const bm = await gateway(apiKey, '/book/bookmarklist', { bookId: nb.bookId })
        const chapters: { chapterUid: number; title: string }[] = bm.chapters ?? []
        const chapterMap = new Map(chapters.map((c) => [c.chapterUid, c.title]))
        for (const m of (bm.updated ?? []) as Record<string, unknown>[]) {
          bmRows.push({
            user_id: user.id,
            book_id: localBookId,
            source: 'weixin_read',
            source_bookmark_id: m.bookmarkId as string,
            kind: 'highlight',
            mark_text: m.markText as string,
            chapter_title: chapterMap.get(m.chapterUid as number) ?? null,
            chapter_uid: (m.chapterUid as number) ?? null,
            color_style: (m.colorStyle as number) ?? null,
            highlighted_at: toIso(m.createTime as number),
          })
        }
        await sleep(200)
      }

      // 4) 个人想法/点评
      const rvRows: Record<string, unknown>[] = []
      if ((nb.reviewCount ?? 0) > 0) {
        const rv = await gateway(apiKey, '/review/list/mine', { bookid: nb.bookId, count: 100 })
        for (const item of (rv.reviews ?? []) as { review?: Record<string, unknown> }[]) {
          const r = item.review
          if (!r) continue
          rvRows.push({
            user_id: user.id,
            book_id: localBookId,
            source: 'weixin_read',
            source_bookmark_id: r.reviewId as string,
            kind: 'thought',
            mark_text: (r.abstract as string) ?? null,
            thought: (r.content as string) ?? null,
            chapter_title: (r.chapterName as string) ?? null,
            chapter_uid: (r.chapterUid as number) ?? null,
            highlighted_at: toIso(r.createTime as number),
          })
        }
        await sleep(200)
      }

      // 幂等 upsert
      if (bmRows.length) {
        const { error } = await supabase
          .from('reading_highlights')
          .upsert(bmRows, { onConflict: 'user_id,source,source_bookmark_id' })
        if (!error) highlightCount += bmRows.length
      }
      if (rvRows.length) {
        const { error } = await supabase
          .from('reading_highlights')
          .upsert(rvRows, { onConflict: 'user_id,source,source_bookmark_id' })
        if (!error) thoughtCount += rvRows.length
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
}
