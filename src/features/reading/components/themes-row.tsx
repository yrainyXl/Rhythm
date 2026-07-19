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
