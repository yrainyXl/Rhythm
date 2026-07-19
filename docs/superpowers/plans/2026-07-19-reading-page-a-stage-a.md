# 阅读页 A · 书架 实施计划(阶段 A · UI-Only + 随机词条接线)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development

**Goal:** 把 `docs/product/prototypes/reading-a-shelf.html` 翻译成 React,新建 `/reading` 路由,更新 tabbar 第 4 位从 `/couple`(词条,情侣页)改为 `/reading`(阅读)。顶部随机词条接现有 `useReadingStore.highlights`(和 /couple 页的能力保持,只是搬到阅读页 hero);其他 6 大区块(阅读汇总/书架/词条流/AI 主题/AI 推荐/已读列表/纸书笔记 FAB)静态占位。

**Architecture:** 页面拆 8 个 client 子组件在 `src/features/reading/components/*`。仅 `RandomHighlightHero` 接现有 store,其他静态占位。`/reading` 挂 client page 组装。

**Tech:** Next.js 14 App Router · React 18 · Zustand(现有 useReadingStore)· Tailwind rhythm token

---

## Scope

- 新增 8 子组件:
  - `random-highlight-hero.tsx` — 顶部随机词条(接现有 highlights,点换句)
  - `reading-stats-bar.tsx` — 4 项汇总条(静态占位)
  - `bookshelf-row.tsx` — 在读书架横滑(静态占位)
  - `highlights-stream.tsx` — 按书分组词条流(静态占位)
  - `themes-row.tsx` — AI 跨书主题横滑(静态占位)
  - `try-recommendation.tsx` — AI 推荐尝试卡(静态占位)
  - `done-books-list.tsx` — 已读/暂停紧凑列表(静态占位)
  - `paper-note-fab.tsx` — 纸书笔记 FAB(静态占位)
- 新增路由 `src/app/reading/page.tsx` 组装
- 修改 `src/features/app/components/app-layout.tsx`:tabbar 第 4 项 `/couple` → `/reading`,label `词条` → `阅读`,不改 Icon
- 保留 `/couple` 路由(旧词条页仍可访问,不删)—— 后续可另做 spawn task 清理

不做:
- 单书详情页 `/reading/book/[id]`
- 主题详情页 `/reading/theme/[id]`
- 微信读书同步按钮(reading-highlights.tsx 已有,不复用)
- 单测

---

## File Structure

**新增:**
- `src/features/reading/components/random-highlight-hero.tsx` — 唯一接现有 store 的组件
- `src/features/reading/components/reading-stats-bar.tsx`
- `src/features/reading/components/bookshelf-row.tsx`
- `src/features/reading/components/highlights-stream.tsx`
- `src/features/reading/components/themes-row.tsx`
- `src/features/reading/components/try-recommendation.tsx`
- `src/features/reading/components/done-books-list.tsx`
- `src/features/reading/components/paper-note-fab.tsx`
- `src/app/reading/page.tsx`

**修改:**
- `src/features/app/components/app-layout.tsx` — tabbar navItems 第 4 项路径与标签

---

## Task 1: RandomHighlightHero(接现有 highlights)

**Files:** Create `src/features/reading/components/random-highlight-hero.tsx`

- [ ] **Step 1: Write component**

```tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import { useReadingStore } from '@/features/records/store/reading-store'

export function RandomHighlightHero() {
  const { highlights, loadHighlights } = useReadingStore()
  const [seed, setSeed] = useState(0)

  useEffect(() => {
    loadHighlights()
  }, [loadHighlights])

  const pool = useMemo(() => highlights.filter((h) => h.mark_text), [highlights])

  const pick = useMemo(() => {
    if (pool.length === 0) return null
    return pool[Math.floor(Math.random() * pool.length)]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool, seed])

  if (!pick) {
    return (
      <div className="p-4 rounded-2xl border border-rhythm-border bg-rhythm-card/60 text-center">
        <p className="text-sm text-rhythm-text-secondary">还没有词条</p>
        <p className="text-xs text-rhythm-text-muted mt-1">
          去「记录 · 阅读 · 词条」从微信读书同步你的划线
        </p>
      </div>
    )
  }

  const book = pick.reading_books
  return (
    <div className="p-5 rounded-2xl border relative cursor-pointer"
      style={{
        background: 'linear-gradient(180deg, rgba(143,180,220,0.08), transparent)',
        borderColor: 'rgba(150,175,205,0.10)',
      }}
      onClick={() => setSeed((s) => s + 1)}>
      <span aria-hidden="true" className="absolute top-2 left-3 font-serifsc leading-none text-[2.5rem]"
        style={{ color: 'rgba(143,180,220,0.35)' }}>❝</span>
      <button type="button"
        aria-label="换一句"
        onClick={(e) => { e.stopPropagation(); setSeed((s) => s + 1) }}
        className="absolute top-3 right-3 w-6 h-6 grid place-items-center rounded-full bg-transparent border-0 cursor-pointer text-rhythm-text-muted hover:text-rhythm-text-primary hover:bg-[rgba(143,180,220,0.1)] transition-colors">
        <svg viewBox="0 0 24 24" className="w-3 h-3" style={{ stroke: 'currentColor', strokeWidth: 1.8, fill: 'none' }}>
          <path d="M23 4v6h-6" />
          <path d="M20 9a9 9 0 0 0-14.85-3.36L1 10" />
        </svg>
      </button>
      <p className="font-serifsc font-normal text-[0.95rem] leading-loose text-rhythm-text-primary tracking-tight pt-4 px-2 m-0">
        {pick.mark_text}
      </p>
      <div className="mt-3 text-[0.66rem] tracking-tight text-rhythm-text-muted px-2">
        ——《{book?.title ?? '未知书籍'}》{book?.author ? ` · ${book.author}` : ''}
      </div>
    </div>
  )
}
```

- [ ] **Step 2:** `mkdir -p src/features/reading/components` + `npm run typecheck`

- [ ] **Step 3: Commit**

```bash
git add src/features/reading/components/random-highlight-hero.tsx
git commit -m "feat(reading): add RandomHighlightHero backed by highlights"
```

---

## Task 2: ReadingStatsBar 阅读汇总条(静态占位)

**Files:** Create `src/features/reading/components/reading-stats-bar.tsx`

- [ ] **Step 1: Write**

```tsx
'use client'

const ITEMS = [
  { key: 'week', num: '3.2', unit: 'h', label: '本周' },
  { key: 'reading', num: '2', unit: '本', label: '在读' },
  { key: 'done', num: '14', unit: '本', label: '今年读完' },
  { key: 'highlights', num: '128', unit: '条', label: '划线' },
] as const

export function ReadingStatsBar() {
  return (
    <div className="flex justify-around py-3 rounded-xl border border-rhythm-border bg-rhythm-card/40">
      {ITEMS.map((it) => (
        <div key={it.key} className="text-center">
          <div className="font-serifsc text-[1.15rem] text-rhythm-text-primary leading-tight">
            {it.num}
            <small className="font-inherit text-[0.6rem] text-rhythm-text-muted ml-0.5">{it.unit}</small>
          </div>
          <div className="text-[0.6rem] tracking-tight text-rhythm-text-muted mt-1">{it.label}</div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2:** `npm run typecheck`

- [ ] **Step 3: Commit**

```bash
git add src/features/reading/components/reading-stats-bar.tsx
git commit -m "feat(reading): add ReadingStatsBar placeholder"
```

---

## Task 3: BookshelfRow 在读书架横滑(静态占位)

**Files:** Create `src/features/reading/components/bookshelf-row.tsx`

- [ ] **Step 1: Write**

```tsx
'use client'

const BOOKS = [
  { key: 'a', title: '深度工作', author: '卡尔·纽波特', progress: '62%', highlights: '128 划线', variant: 'a' },
  { key: 'b', title: 'The Practice', author: 'Seth Godin', progress: '34%', highlights: '42 划线', variant: 'b' },
  { key: 'c', title: '被讨厌的勇气', author: '岸见一郎', progress: '已读完', highlights: '76 划线', variant: 'c' },
] as const

const VARIANT_BG: Record<string, string> = {
  a: 'linear-gradient(135deg, rgba(143,180,220,0.35), rgba(143,180,220,0.15))',
  b: 'linear-gradient(135deg, #8fa8b8, #4a5c74)',
  c: 'linear-gradient(135deg, #c5a68d, #7f6952)',
}

export function BookshelfRow() {
  return (
    <div className="flex gap-3 overflow-x-auto py-2 -mx-1 px-1 snap-x snap-mandatory">
      {BOOKS.map((b) => (
        <a key={b.key} className="flex-none w-[102px] snap-start no-underline text-inherit cursor-pointer">
          <div className="w-full h-[145px] rounded-r-lg rounded-l-sm relative overflow-hidden p-2.5 flex flex-col justify-end"
            style={{
              background: VARIANT_BG[b.variant],
              boxShadow: '1px 3px 12px -3px rgba(0,0,0,0.4), inset 5px 0 8px -6px rgba(0,0,0,0.4)',
            }}>
            <span aria-hidden className="absolute left-0 top-0 bottom-0 w-1"
              style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.3), transparent)' }} />
            <div className="font-serifsc font-medium text-[0.75rem] leading-tight tracking-tight text-white relative z-10">
              {b.title}
            </div>
            <div className="text-[0.55rem] text-white/70 mt-0.5 relative z-10">{b.author}</div>
          </div>
          <div className="text-[0.62rem] text-rhythm-text-muted mt-1.5 tracking-tight">
            <b className="text-rhythm-text-secondary font-serifsc font-medium">{b.progress}</b>
            {b.highlights ? ` · ${b.highlights}` : ''}
          </div>
        </a>
      ))}
      <a className="flex-none w-[102px] snap-start cursor-pointer no-underline text-inherit">
        <div className="w-full h-[145px] rounded-lg grid place-items-center border-2 border-dashed border-rhythm-border-strong bg-rhythm-card/40">
          <span className="text-2xl text-rhythm-text-muted">+</span>
        </div>
        <div className="text-[0.62rem] text-rhythm-text-muted mt-1.5 tracking-tight">添加书籍</div>
      </a>
    </div>
  )
}
```

- [ ] **Step 2:** `npm run typecheck`

- [ ] **Step 3: Commit**

```bash
git add src/features/reading/components/bookshelf-row.tsx
git commit -m "feat(reading): add BookshelfRow placeholder"
```

---

## Task 4: HighlightsStream 按书分组词条流(静态占位)

**Files:** Create `src/features/reading/components/highlights-stream.tsx`

- [ ] **Step 1: Write**

```tsx
'use client'

export function HighlightsStream() {
  return (
    <div className="space-y-2">
      <div className="p-4 rounded-2xl border border-rhythm-border bg-rhythm-card/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-11 rounded-sm flex-none"
            style={{ background: 'linear-gradient(135deg, rgba(143,180,220,0.4), rgba(143,180,220,0.2))' }} />
          <div className="flex-1 min-w-0">
            <b className="block font-serifsc font-medium text-[0.85rem] tracking-tight">《深度工作》</b>
            <small className="block text-[0.65rem] text-rhythm-text-muted mt-0.5">卡尔·纽波特 · 128 条</small>
          </div>
          <span className="text-[0.6rem] text-rhythm-text-muted">下阶段接入</span>
        </div>
      </div>
      <div className="p-4 rounded-2xl border border-rhythm-border bg-rhythm-card/60 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-11 rounded-sm flex-none"
            style={{ background: 'linear-gradient(135deg, #8fa8b8, #4a5c74)' }} />
          <div className="flex-1 min-w-0">
            <b className="block font-serifsc font-medium text-[0.85rem] tracking-tight">《The Practice》</b>
            <small className="block text-[0.65rem] text-rhythm-text-muted mt-0.5">Seth Godin · 42 条</small>
          </div>
          <span className="text-[0.6rem] text-rhythm-text-muted">下阶段接入</span>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2:** `npm run typecheck`

- [ ] **Step 3: Commit**

```bash
git add src/features/reading/components/highlights-stream.tsx
git commit -m "feat(reading): add HighlightsStream placeholder"
```

---

## Task 5: ThemesRow AI 跨书主题横滑(静态占位)

**Files:** Create `src/features/reading/components/themes-row.tsx`

- [ ] **Step 1: Write**

```tsx
'use client'

const THEMES = [
  { key: 'a', kicker: '主题 · 3 本书 8 条', title: '启动的门槛', desc: '开始一件事的关键不是意志力,而是降低单次门槛,让"启动"本身变得便宜。', refs: ['深度工作', 'The Practice', '原子习惯'] },
  { key: 'b', kicker: '主题 · 2 本书 5 条', title: '选择的边界', desc: '在充分选项面前,克制是新的自由。', refs: ['深度工作', '被讨厌的勇气'] },
  { key: 'c', kicker: '主题 · 2 本书 4 条', title: '被动的时间', desc: '被算法/通知消耗的时间不是空白,是意愿的削减。', refs: ['深度工作', '注意力商人'] },
] as const

export function ThemesRow() {
  return (
    <div className="flex gap-2.5 overflow-x-auto py-1 -mx-1 px-1 snap-x snap-mandatory">
      {THEMES.map((t) => (
        <a key={t.key} className="flex-none w-[240px] snap-start p-4 rounded-2xl border no-underline cursor-pointer text-inherit"
          style={{
            borderColor: 'rgba(143,180,220,0.24)',
            background: 'linear-gradient(180deg, rgba(143,180,220,0.09), rgba(20,27,39,0.8))',
          }}>
          <div className="text-[0.58rem] tracking-[0.16em] uppercase mb-1.5" style={{ color: 'rgba(143,180,220,0.9)' }}>
            {t.kicker}
          </div>
          <h3 className="font-serifsc font-medium text-[0.95rem] tracking-tight m-0 mb-2 leading-tight">{t.title}</h3>
          <div className="text-[0.7rem] text-rhythm-text-secondary leading-relaxed mb-3">{t.desc}</div>
          <div className="flex gap-1 flex-wrap">
            {t.refs.map((r) => (
              <span key={r} className="text-[0.6rem] text-rhythm-text-muted px-1.5 py-0.5 rounded-md border border-rhythm-border bg-rhythm-void/40">
                《{r}》
              </span>
            ))}
          </div>
        </a>
      ))}
    </div>
  )
}
```

- [ ] **Step 2:** `npm run typecheck`

- [ ] **Step 3: Commit**

```bash
git add src/features/reading/components/themes-row.tsx
git commit -m "feat(reading): add ThemesRow placeholder"
```

---

## Task 6: TryRecommendation AI 推荐尝试(静态占位)

**Files:** Create `src/features/reading/components/try-recommendation.tsx`

- [ ] **Step 1: Write**

```tsx
'use client'

export function TryRecommendation() {
  return (
    <div className="p-4 rounded-2xl border relative"
      style={{ borderColor: 'rgba(220,180,130,0.22)', background: 'linear-gradient(180deg, rgba(220,180,130,0.07), transparent)' }}>
      <div className="text-[0.6rem] tracking-[0.14em] uppercase mb-2" style={{ color: 'rgb(220,180,130)' }}>
        来自《深度工作》· 关联你的议题(占位)
      </div>
      <p className="text-[0.78rem] text-rhythm-text-secondary leading-relaxed m-0 mb-2">
        <b className="text-rhythm-text-primary font-serifsc font-medium">用「分块专注 90 分钟」验证晚上的开始率。</b>
        接入后 AI 会基于阅读内容和你的当前议题生成候选实践。
      </p>
      <div className="text-[0.62rem] text-rhythm-text-muted mb-2 pb-2 border-b border-dashed border-rhythm-border">
        依据:接入后显示相关划线数量与议题匹配度
      </div>
      <div className="flex gap-1.5">
        <button type="button" className="px-2 py-1.5 rounded-lg text-[0.68rem] tracking-tight cursor-pointer"
          style={{ background: 'rgba(220,180,130,0.16)', border: '1px solid rgba(220,180,130,0.28)', color: 'rgb(220,180,130)' }}>
          发起实践
        </button>
        <button type="button" className="px-2 py-1.5 rounded-lg text-[0.68rem] tracking-tight cursor-pointer bg-transparent"
          style={{ border: '1px solid rgba(220,180,130,0.28)', color: 'rgb(220,180,130)' }}>
          先收藏
        </button>
        <button type="button" className="px-2 py-1.5 rounded-lg text-[0.68rem] tracking-tight cursor-pointer bg-transparent border border-rhythm-border text-rhythm-text-muted">
          忽略
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2:** `npm run typecheck`

- [ ] **Step 3: Commit**

```bash
git add src/features/reading/components/try-recommendation.tsx
git commit -m "feat(reading): add TryRecommendation placeholder"
```

---

## Task 7: DoneBooksList 已读/暂停紧凑列表(静态占位)

**Files:** Create `src/features/reading/components/done-books-list.tsx`

- [ ] **Step 1: Write**

```tsx
'use client'

const ITEMS = [
  { key: 'a', title: '被讨厌的勇气', tail: '2026-07-02 读完', status: 'done' as const },
  { key: 'b', title: '原子习惯', tail: '停在 45%', status: 'pause' as const },
] as const

export function DoneBooksList() {
  return (
    <div className="rounded-xl overflow-hidden bg-rhythm-card/40 border border-rhythm-border">
      {ITEMS.map((it, i) => (
        <div key={it.key}
          className={`flex items-center gap-2.5 px-3.5 py-2.5 ${i > 0 ? 'border-t border-rhythm-border' : ''}`}>
          <div className="w-6 h-8 rounded-sm flex-none"
            style={{ background: 'linear-gradient(135deg, rgba(150,175,205,0.35), rgba(150,175,205,0.15))' }} />
          <div className="flex-1 min-w-0">
            <b className="block text-[0.78rem] tracking-tight font-medium">《{it.title}》</b>
            <small className="block text-[0.62rem] text-rhythm-text-muted mt-0.5">{it.tail}</small>
          </div>
          <span className={`text-[0.6rem] tracking-tight px-1.5 py-0.5 rounded-full ${
            it.status === 'done' ? 'text-rhythm-success bg-rhythm-success-soft' : 'text-rhythm-warn bg-rhythm-warn-soft'
          }`}>
            {it.status === 'done' ? '读完' : '暂停'}
          </span>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2:** `npm run typecheck`

- [ ] **Step 3: Commit**

```bash
git add src/features/reading/components/done-books-list.tsx
git commit -m "feat(reading): add DoneBooksList placeholder"
```

---

## Task 8: PaperNoteFab 纸书笔记 FAB(静态占位)

**Files:** Create `src/features/reading/components/paper-note-fab.tsx`

- [ ] **Step 1: Write**

```tsx
'use client'

export function PaperNoteFab() {
  return (
    <button type="button"
      aria-label="纸书笔记(下阶段接入)"
      className="fixed z-15 flex items-center gap-1.5 px-4 py-2.5 rounded-full font-serifsc text-[0.78rem] tracking-tight text-white border-0 cursor-pointer shadow-lg"
      style={{
        bottom: 'calc(5.4rem + env(safe-area-inset-bottom))',
        left: 'calc(50% + 240px - 8rem)',
        background: 'rgba(143,180,220,0.9)',
        boxShadow: '0 8px 24px -6px rgba(143,180,220,0.55)',
      }}>
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" style={{ stroke: 'currentColor', strokeWidth: 2.2, fill: 'none' }}>
        <path d="M12 5v14M5 12h14" />
      </svg>
      纸书笔记
    </button>
  )
}
```

- [ ] **Step 2:** `npm run typecheck`

- [ ] **Step 3: Commit**

```bash
git add src/features/reading/components/paper-note-fab.tsx
git commit -m "feat(reading): add PaperNoteFab placeholder"
```

---

## Task 9: 新增 /reading 路由组装

**Files:** Create `src/app/reading/page.tsx`

- [ ] **Step 1: Write**

```tsx
'use client'

import { AuthGuard } from '@/features/app/components/auth-guard'
import { RandomHighlightHero } from '@/features/reading/components/random-highlight-hero'
import { ReadingStatsBar } from '@/features/reading/components/reading-stats-bar'
import { BookshelfRow } from '@/features/reading/components/bookshelf-row'
import { HighlightsStream } from '@/features/reading/components/highlights-stream'
import { ThemesRow } from '@/features/reading/components/themes-row'
import { TryRecommendation } from '@/features/reading/components/try-recommendation'
import { DoneBooksList } from '@/features/reading/components/done-books-list'
import { PaperNoteFab } from '@/features/reading/components/paper-note-fab'

function SectionTitle({ label, action }: { label: string; action?: string }) {
  return (
    <div className="flex items-center justify-between mb-2 px-0.5">
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-rhythm-glow opacity-60" />
        <span className="text-xs tracking-[0.06em] text-rhythm-text-secondary">{label}</span>
      </div>
      {action && (
        <button type="button" className="text-xs text-rhythm-glow bg-transparent border-0 cursor-pointer">
          {action}
        </button>
      )}
    </div>
  )
}

export default function ReadingPage() {
  return (
    <AuthGuard>
      <div className="p-5 space-y-5">
        <RandomHighlightHero />
        <ReadingStatsBar />

        <section>
          <SectionTitle label="在读" action="全部书架 →" />
          <BookshelfRow />
        </section>

        <section>
          <SectionTitle label="词条 · 按书" action="全部 →" />
          <HighlightsStream />
        </section>

        <section>
          <SectionTitle label="AI · 跨书主题" />
          <ThemesRow />
        </section>

        <section>
          <SectionTitle label="想试试 · AI 推荐" />
          <TryRecommendation />
        </section>

        <section>
          <SectionTitle label="已读 · 暂停" action="14 本 →" />
          <DoneBooksList />
        </section>
      </div>
      <PaperNoteFab />
    </AuthGuard>
  )
}
```

- [ ] **Step 2:** `npm run build` — expect `/reading` in the route table.

- [ ] **Step 3: Commit**

```bash
git add src/app/reading/page.tsx
git commit -m "feat(reading): route /reading (plan A shelf layout)"
```

---

## Task 10: 更新 tabbar 第 4 项:/couple → /reading

**Files:** Modify `src/features/app/components/app-layout.tsx`

- [ ] **Step 1: Update navItems array**

Read the file first, then change the fourth entry from:
```ts
{ href: '/couple', label: '词条', Icon: BookOpen },
```
to:
```ts
{ href: '/reading', label: '阅读', Icon: BookOpen },
```

That is: replace `href: '/couple'` with `href: '/reading'` and `label: '词条'` with `label: '阅读'` on the same line. Do NOT touch other lines. Keep the same Icon.

- [ ] **Step 2:** `npm run build` — expect both `/reading` and `/couple` still present (old couple route not removed).

- [ ] **Step 3: Commit**

```bash
git add src/features/app/components/app-layout.tsx
git commit -m "refactor(app): tabbar item 4 → /reading (was /couple 词条)"
```

---

## Task 11: 全量验证

Steps:

1. Full tests: `/Users/EDY/.nvm/versions/node/v24.12.0/bin/node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/*.test.ts` — 8 files PASS.

2. Typecheck + build. Filter reading-scope errors only.

3. Build routes include: `/reading`, `/habits`, `/habits/manage`, `/today`, `/records`, `/records/reflection/today`, `/couple` (not removed), `/`.

4. Dangling ref: `grep '@/features/reading/components/' src/` — expect 8 imports, all in `src/app/reading/page.tsx`.

5. Empty commit: `chore(reading): task 11 verification checkpoint`

---

## Self-Review

**Spec coverage(以 reading-a-shelf.html 为准):**
- 顶部 title + sync 按钮 = AppLayout topbar 已有 ✓(sync 按钮在 records tab 单独走)
- 随机词条卡 = RandomHighlightHero(接现有 highlights)✓
- 阅读汇总 = ReadingStatsBar ✓
- 在读书架 = BookshelfRow ✓
- 词条流 = HighlightsStream ✓
- AI 跨书主题 = ThemesRow ✓
- AI 推荐 = TryRecommendation ✓
- 已读/暂停 = DoneBooksList ✓
- 纸书笔记 FAB = PaperNoteFab ✓
- tabbar 阅读入口 = Task 10 ✓

**Placeholder scan:** 7 处静态占位,1 处(RandomHighlightHero)接现有 store。 无 TODO/TBD。

**决策记录:**
- 保留 /couple 路由不删,只改 tabbar 指向。原随机词条能力搬到 /reading hero,/couple 可作为遗留页,后续清理。
- `random-highlight-hero.tsx` 从 `useReadingStore` 导入 —— 该 store 已在 records-highlights.tsx 使用,不新建 store。
