# P1-1 · 议题 CRUD 实施计划

**Goal:** 让计划页"议题"入口卡从静态占位变成可点击 → 打开列表 + 新建 sheet + 归档删除。

**Architecture:**
- 扩展 `usePracticeStore` 已有的 `topics` state + `loadTopics`,新增 `createTopic / archiveTopic / deleteTopic`
- 新增路由 `/habits/topics` 显示议题列表
- 计划页"议题" EntryCard 加 `href="/habits/topics"` + 显示真实数量
- 新增 bottom sheet 组件 `TopicFormSheet`(用于新建/编辑)
- 路由页复用 tab bar(AuthGuard 内嵌 AppLayout)

**Tech:** Zustand · Supabase · Tailwind rhythm token · client-side sheet(fixed 定位 + backdrop)

---

## File Structure

**新增:**
- `src/features/practice/components/topic-form-sheet.tsx` — 新建/编辑议题的底部弹层
- `src/features/practice/components/topics-list.tsx` — 议题列表主视图
- `src/app/habits/topics/page.tsx` — /habits/topics 路由

**修改:**
- `src/features/practice/store/practice-store.ts` — 加 `createTopic / archiveTopic / deleteTopic`,让 `loadTopics` 只加载 `status='active'`(archived 不显示)
- `src/app/habits/page.tsx` — 议题 EntryCard 的 `count` 用 `topics.length`,加 `href="/habits/topics"`

**不动:**
- 其他计划页组件

---

## Task 1: 扩展 practice-store

**Files:** Modify `src/features/practice/store/practice-store.ts`

- [ ] **Step 1:** Read current file. Add 3 new actions + adjust `loadTopics` to filter by `status='active'`.

Replace the entire file content with:

```ts
'use client'

import { create } from 'zustand'
import { createBrowserClient, getCurrentUser } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'

type Topic = Database['public']['Tables']['topics']['Row']
type Practice = Database['public']['Tables']['practices']['Row']
type PracticeRound = Database['public']['Tables']['practice_rounds']['Row']

export interface PracticeWithLatestRound extends Practice {
  latestRound: PracticeRound | null
}

interface PracticeState {
  practices: PracticeWithLatestRound[]
  topics: Topic[]
  isLoadingPractices: boolean
  isLoadingTopics: boolean

  loadPractices: () => Promise<void>
  loadTopics: () => Promise<void>
  createTopic: (question: string) => Promise<{ error: string | null }>
  archiveTopic: (id: string) => Promise<void>
  deleteTopic: (id: string) => Promise<void>
}

export const usePracticeStore = create<PracticeState>((set, get) => ({
  practices: [],
  topics: [],
  isLoadingPractices: true,
  isLoadingTopics: true,

  loadPractices: async () => {
    const supabase = createBrowserClient()
    const user = await getCurrentUser(supabase)
    if (!user) {
      set({ isLoadingPractices: false })
      return
    }

    const { data: practices } = await supabase
      .from('practices')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!practices) {
      set({ practices: [], isLoadingPractices: false })
      return
    }

    const { data: rounds } = await supabase
      .from('practice_rounds')
      .select('*')
      .eq('user_id', user.id)
      .order('round_number', { ascending: false })

    const roundsByPractice = new Map<string, PracticeRound>()
    for (const r of rounds ?? []) {
      if (!roundsByPractice.has(r.practice_id)) {
        roundsByPractice.set(r.practice_id, r)
      }
    }

    const withRounds: PracticeWithLatestRound[] = practices.map((p) => ({
      ...p,
      latestRound: roundsByPractice.get(p.id) ?? null,
    }))

    set({ practices: withRounds, isLoadingPractices: false })
  },

  loadTopics: async () => {
    const supabase = createBrowserClient()
    const user = await getCurrentUser(supabase)
    if (!user) {
      set({ isLoadingTopics: false })
      return
    }

    const { data } = await supabase
      .from('topics')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    set({ topics: data ?? [], isLoadingTopics: false })
  },

  createTopic: async (question) => {
    const supabase = createBrowserClient()
    const user = await getCurrentUser(supabase)
    if (!user) return { error: 'Not authenticated' }

    const trimmed = question.trim()
    if (!trimmed) return { error: '议题不能为空' }

    const { data, error } = await supabase
      .from('topics')
      .insert({ user_id: user.id, question: trimmed })
      .select()
      .single()

    if (error) return { error: error.message }
    if (data) {
      set({ topics: [data, ...get().topics] })
    }
    return { error: null }
  },

  archiveTopic: async (id) => {
    const supabase = createBrowserClient()
    const user = await getCurrentUser(supabase)
    if (!user) return

    await supabase.from('topics').update({ status: 'archived' }).eq('id', id).eq('user_id', user.id)
    set({ topics: get().topics.filter((t) => t.id !== id) })
  },

  deleteTopic: async (id) => {
    const supabase = createBrowserClient()
    const user = await getCurrentUser(supabase)
    if (!user) return

    await supabase.from('topics').delete().eq('id', id).eq('user_id', user.id)
    set({ topics: get().topics.filter((t) => t.id !== id) })
  },
}))
```

- [ ] **Step 2:** `npm run typecheck` — expect same pre-existing store `never` errors (increased by a few due to new actions), no new class of errors.

- [ ] **Step 3:** Commit `feat(practice): add createTopic/archiveTopic/deleteTopic actions`

---

## Task 2: TopicFormSheet 组件

**Files:** Create `src/features/practice/components/topic-form-sheet.tsx`

```tsx
'use client'

import { useEffect, useState } from 'react'
import { usePracticeStore } from '@/features/practice/store/practice-store'

export function TopicFormSheet({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { createTopic } = usePracticeStore()
  const [question, setQuestion] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setQuestion('')
      setError(null)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const handleSubmit = async () => {
    setError(null)
    setSaving(true)
    const result = await createTopic(question)
    setSaving(false)
    if (result.error) {
      setError(result.error)
      return
    }
    onClose()
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-rhythm-void/70 backdrop-blur-sm"
      onClick={onClose}>
      <div
        className="w-full sm:max-w-md p-5 rounded-t-2xl sm:rounded-2xl bg-rhythm-card border-t sm:border border-rhythm-border-strong"
        style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serifsc text-base font-medium text-rhythm-text-primary m-0">新建议题</h3>
          <button
            type="button"
            aria-label="关闭"
            onClick={onClose}
            className="w-8 h-8 grid place-items-center rounded-full bg-transparent border-0 cursor-pointer text-rhythm-text-muted hover:text-rhythm-text-primary transition-colors">
            <svg viewBox="0 0 24 24" className="w-4 h-4" style={{ stroke: 'currentColor', strokeWidth: 1.8, fill: 'none' }}>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-xs text-rhythm-text-muted mb-2 tracking-tight">
          用一个真实的问题描述你想理解的事情。
        </p>

        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="例如:为什么下班回家后总会陷入游戏和手机?"
          rows={3}
          autoFocus
          className="w-full bg-rhythm-void/40 border border-rhythm-border rounded-xl px-3 py-2.5 text-sm text-rhythm-text-primary placeholder-rhythm-text-muted resize-none focus:outline-none focus:border-rhythm-border-strong"
        />

        {error && (
          <p className="text-xs text-rhythm-danger mt-2">{error}</p>
        )}

        <div className="flex gap-2 mt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm bg-transparent border border-rhythm-border text-rhythm-text-secondary cursor-pointer disabled:opacity-50">
            取消
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || !question.trim()}
            className="flex-1 py-2.5 rounded-xl text-sm bg-rhythm-glow-soft border border-rhythm-border-strong text-rhythm-glow cursor-pointer disabled:opacity-50">
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] `npm run typecheck` → commit `feat(practice): add TopicFormSheet for creating topics`

---

## Task 3: TopicsList 列表视图

**Files:** Create `src/features/practice/components/topics-list.tsx`

```tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePracticeStore } from '@/features/practice/store/practice-store'
import { TopicFormSheet } from '@/features/practice/components/topic-form-sheet'

export function TopicsList() {
  const { topics, isLoadingTopics, loadTopics, archiveTopic, deleteTopic } = usePracticeStore()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  useEffect(() => {
    loadTopics()
  }, [loadTopics])

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <Link href="/habits" className="flex items-center gap-1 text-xs text-rhythm-text-muted hover:text-rhythm-text-primary transition-colors">
          <svg viewBox="0 0 24 24" className="w-3 h-3" style={{ stroke: 'currentColor', strokeWidth: 2, fill: 'none' }}>
            <path d="M15 18l-6-6 6-6" />
          </svg>
          返回计划
        </Link>
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs bg-rhythm-glow-soft border border-rhythm-border-strong text-rhythm-glow cursor-pointer">
          <svg viewBox="0 0 24 24" className="w-3 h-3" style={{ stroke: 'currentColor', strokeWidth: 2.2, fill: 'none' }}>
            <path d="M12 5v14M5 12h14" />
          </svg>
          新建议题
        </button>
      </div>

      <div>
        <h1 className="font-serifsc text-lg font-medium m-0">当前议题</h1>
        <p className="text-xs text-rhythm-text-muted mt-1">
          共 {topics.length} 个 · 你想持续理解的真实问题
        </p>
      </div>

      {isLoadingTopics && (
        <div className="r-card p-6 text-center text-xs text-rhythm-text-muted">加载中...</div>
      )}

      {!isLoadingTopics && topics.length === 0 && (
        <div className="r-card p-8 text-center">
          <p className="text-sm text-rhythm-text-secondary">还没有议题</p>
          <p className="text-xs text-rhythm-text-muted mt-1">点右上"新建议题"写下第一个真实困扰</p>
        </div>
      )}

      <div className="space-y-2">
        {topics.map((t) => (
          <div key={t.id} className="r-card p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="font-serifsc text-sm font-normal text-rhythm-text-primary leading-relaxed tracking-tight m-0 flex-1">
                {t.question}
              </p>
              {confirmDelete === t.id ? (
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => { deleteTopic(t.id); setConfirmDelete(null) }}
                    className="px-2 py-1 rounded text-[0.62rem] bg-rhythm-danger-soft border border-rhythm-danger text-rhythm-danger cursor-pointer">
                    确认删除
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(null)}
                    className="px-2 py-1 rounded text-[0.62rem] bg-transparent border border-rhythm-border text-rhythm-text-muted cursor-pointer">
                    取消
                  </button>
                </div>
              ) : (
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => archiveTopic(t.id)}
                    aria-label="归档"
                    title="归档"
                    className="w-7 h-7 grid place-items-center rounded-full bg-transparent border border-rhythm-border text-rhythm-text-muted cursor-pointer hover:border-rhythm-border-strong hover:text-rhythm-text-secondary transition-colors">
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" style={{ stroke: 'currentColor', strokeWidth: 1.8, fill: 'none' }}>
                      <path d="M21 8v13H3V8" />
                      <path d="M1 3h22v5H1z" />
                      <path d="M10 12h4" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(t.id)}
                    aria-label="删除"
                    title="删除"
                    className="w-7 h-7 grid place-items-center rounded-full bg-transparent border border-rhythm-border text-rhythm-text-muted cursor-pointer hover:border-rhythm-danger hover:text-rhythm-danger transition-colors">
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" style={{ stroke: 'currentColor', strokeWidth: 1.8, fill: 'none' }}>
                      <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
            <div className="mt-2 text-[0.6rem] text-rhythm-text-muted tracking-tight">
              建立于 {new Date(t.created_at).toLocaleDateString('zh-CN')}
            </div>
          </div>
        ))}
      </div>

      <TopicFormSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  )
}
```

- [ ] `npm run typecheck` → commit `feat(practice): add TopicsList main view`

---

## Task 4: /habits/topics 路由

**Files:** Create `src/app/habits/topics/page.tsx`

```tsx
'use client'

import { AuthGuard } from '@/features/app/components/auth-guard'
import { TopicsList } from '@/features/practice/components/topics-list'

export default function TopicsPage() {
  return (
    <AuthGuard>
      <TopicsList />
    </AuthGuard>
  )
}
```

- [ ] `npm run build` — expect `/habits/topics` in route table
- [ ] Commit `feat(habits): route /habits/topics for topic management`

---

## Task 5: 更新计划页议题入口卡

**Files:** Modify `src/app/habits/page.tsx`

- [ ] **Step 1:** Read current file. Locate the 议题 EntryCard block. It currently has `count={0}`.

- [ ] **Step 2:** Add these:
   - Import: `import { usePracticeStore } from '@/features/practice/store/practice-store'`
   - Inside component, add:
     ```tsx
     const { topics, loadTopics } = usePracticeStore()
     
     useEffect(() => { loadTopics() }, [loadTopics])
     ```
   - Change the 议题 EntryCard `count` and add `href`:
     ```tsx
     <EntryCard
       eyebrow="议题"
       title="当前议题"
       count={topics.length}
       unit="个"
       tail={topics.length === 0 ? '还没有议题' : '点击查看'}
       icon={/* keep same */}
       href="/habits/topics"
     />
     ```

- [ ] `npm run typecheck && npm run build` — expect success

- [ ] Commit `feat(plan): wire 议题 EntryCard to /habits/topics with real count`

---

## Task 6: 验证 + 启动 dev

- [ ] Full tests
- [ ] Full build
- [ ] Empty checkpoint commit
- [ ] Ensure dev server running at 3000, ready for user to preview
