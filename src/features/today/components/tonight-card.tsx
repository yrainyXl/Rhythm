'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePracticeStore, type PracticeLog, type PracticeWithLatestRound } from '@/features/practice/store/practice-store'
import { useArrangementStore, type Arrangement } from '@/features/today/store/arrangement-store'
import { TonightPlanForm } from './tonight-plan-form'
import { addDays, roundDays, shortTime } from '@/features/today/lib/dates'

type LogStatus = PracticeLog['status']

const LOG_LABEL: Record<LogStatus, string> = { done: '完成了', partial: '做了一点', skipped: '没开始' }
const CHECKPOINT_EVERY = 3
const PLAN_UNTIL_HOUR = 17

function byTime(a: Arrangement, b: Arrangement) {
  if (a.scheduled_time && b.scheduled_time) return a.scheduled_time.localeCompare(b.scheduled_time)
  if (a.scheduled_time) return -1
  if (b.scheduled_time) return 1
  return a.sort_order - b.sort_order
}

function clockOf(iso: string) {
  const d = new Date(iso)
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

function ThreeChoices({ disabled, current, onPick }: { disabled: boolean; current?: LogStatus; onPick: (s: LogStatus) => void }) {
  const style: Record<LogStatus, string> = {
    done: 'bg-rhythm-practice text-[var(--r-on-practice)]',
    partial: 'bg-rhythm-habit/15 text-rhythm-warn',
    skipped: 'bg-rhythm-fill text-rhythm-text-primary',
  }
  return (
    <div className="mt-2.5 grid grid-cols-3 gap-2">
      {(Object.keys(LOG_LABEL) as LogStatus[]).map((s) => (
        <button
          key={s}
          type="button"
          disabled={disabled}
          aria-pressed={current === s}
          onClick={() => onPick(s)}
          className={`h-11 rounded-full text-[15px] font-semibold transition-transform active:scale-[0.97] disabled:opacity-50 ${style[s]} ${current === s ? 'ring-2 ring-offset-2 ring-rhythm-practice ring-offset-[rgb(var(--r-card))]' : ''}`}
        >
          {LOG_LABEL[s]}
        </button>
      ))}
    </div>
  )
}

function RoundProgress({ start, total, logs }: { start: string; total: number; logs: PracticeLog[] }) {
  const byDate = new Map(logs.map((l) => [l.local_date, l.status]))
  const counts = { done: 0, partial: 0, skipped: 0 }
  logs.forEach((l) => { counts[l.status]++ })
  const color: Record<LogStatus, string> = { done: 'bg-rhythm-practice', partial: 'bg-rhythm-habit', skipped: 'bg-rhythm-border-strong' }
  return (
    <div className="mt-3.5 flex gap-1" role="img" aria-label={`本轮 ${total} 天：完成 ${counts.done} 天，做了一点 ${counts.partial} 天，没开始 ${counts.skipped} 天`}>
      {Array.from({ length: total }, (_, i) => {
        const status = byDate.get(addDays(start, i))
        return <span key={i} className={`h-1.5 flex-1 rounded-full ${status ? color[status] : 'bg-rhythm-fill'}`} />
      })}
    </div>
  )
}

/** 记完之后的追问：到检查点时先摆事实再问一个问题，平时是可选的「详细说说」。回答写进当天记录的备注。 */
function FollowUp({ log, logs, elapsed, onSave }: { log: PracticeLog; logs: PracticeLog[]; elapsed: number; onSave: (note: string) => Promise<string | null> }) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(log.note ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isCheckpoint = elapsed % CHECKPOINT_EVERY === 0

  useEffect(() => { setValue(log.note ?? '') }, [log.note])

  const started = logs.filter((l) => l.status !== 'skipped').length
  const lastSkipNote = logs.filter((l) => l.status === 'skipped' && l.note).sort((a, b) => b.local_date.localeCompare(a.local_date))[0]?.note
  const skippedAny = logs.some((l) => l.status === 'skipped')

  const save = async () => {
    if (saving) return
    setSaving(true)
    setError(await onSave(value))
    setSaving(false)
    setOpen(false)
  }

  if (log.note && !open) {
    return (
      <div className="mt-4 border-t border-rhythm-border pt-3.5">
        <p className="text-[15px] text-rhythm-text-primary whitespace-pre-wrap break-words">{log.note}</p>
        <button type="button" onClick={() => setOpen(true)} className="mt-1 min-h-[36px] text-sm font-semibold text-rhythm-practice">改一下</button>
      </div>
    )
  }

  if (!isCheckpoint && !open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="mx-auto mt-3 block min-h-[36px] text-sm font-semibold text-rhythm-practice">
        详细说说今晚（可选）
      </button>
    )
  }

  return (
    <div className="mt-4 border-t border-rhythm-border pt-3.5">
      {isCheckpoint && !log.note ? (
        <>
          <p className="text-sm text-rhythm-text-secondary">
            {elapsed} 天开始了 {started} 次。{lastSkipNote ? `没开始那天你记了「${lastSkipNote}」。` : ''}
          </p>
          <p className="mt-1 text-[17px] font-semibold">
            {skippedAny ? '没开始的那几天，是什么拦住了你？' : '这几天，是什么让开始变得容易？'}
          </p>
        </>
      ) : (
        <p className="text-sm text-rhythm-text-secondary">今晚的真实情况、当时的想法，想到什么写什么</p>
      )}
      <div className="mt-3 flex items-center gap-2 rounded-full bg-rhythm-fill pl-4 pr-1.5">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) void save() }}
          placeholder="回答一句，或跳过"
          aria-label="补充今晚的记录"
          className="h-11 min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-rhythm-text-muted"
        />
        <button type="button" onClick={() => void save()} disabled={saving || !value.trim()} className="h-9 rounded-full bg-rhythm-glow px-4 text-sm font-semibold text-white disabled:opacity-40">
          {saving ? '保存中' : '保存'}
        </button>
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-rhythm-danger">{error}</p>}
    </div>
  )
}

/** 今晚：今日安排 + 进行中实践的打卡合成一张卡，按「安排 → 记录 → 记完」切换。 */
export function TonightCard({ today, practice, onRecorded }: { today: string; practice: PracticeWithLatestRound | null; onRecorded: () => void }) {
  const { logsByRound, logsErrorsByRound, loadLogsForRound, upsertLog } = usePracticeStore()
  const { arrangements, loadByDate, complete, cancel, reset } = useArrangementStore()
  const [skipPlan, setSkipPlan] = useState(false)
  const [addingPlan, setAddingPlan] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const round = practice?.latestRound ?? null
  useEffect(() => { void loadByDate(today) }, [today, loadByDate])
  useEffect(() => { if (round) void loadLogsForRound(round.id) }, [round, loadLogsForRound])
  useEffect(() => { setAddingPlan(false) }, [arrangements.length])

  const plans = arrangements.filter((a) => a.status !== 'cancelled').sort(byTime)
  const main = plans[0] ?? null
  const logs = round ? logsByRound[round.id] ?? [] : []
  const todayLog = logs.find((l) => l.local_date === today)
  const expired = !!round && round.end_date < today
  const upcoming = !!round && round.start_date > today
  const recordable = !!round && !expired && !upcoming
  const days = round ? roundDays(round.start_date, round.end_date, today) : null

  const kicker = practice && round ? (
    <Link href={`/habits/practices/${practice.id}`} className="text-[13px] font-semibold text-rhythm-text-secondary">
      <span className="text-rhythm-practice">{practice.title}</span> 第 {round.round_number} 轮{days && recordable ? ` · 第 ${days.elapsed} 天` : ''}
    </Link>
  ) : <p className="text-[13px] font-semibold text-rhythm-text-secondary">今晚</p>

  const record = async (status: LogStatus) => {
    if (!round || saving) return
    setSaving(true)
    setError(null)
    const result = await upsertLog({ roundId: round.id, localDate: today, status, note: todayLog?.note ?? '' })
    if (result.error) setError(result.error)
    else {
      setEditing(false)
      if (main && main.status === 'pending' && status !== 'skipped') await complete(main.id).catch(() => {})
      onRecorded()
    }
    setSaving(false)
  }

  const saveNote = async (note: string) => {
    if (!round || !todayLog) return null
    const result = await upsertLog({ roundId: round.id, localDate: today, status: todayLog.status, note })
    return result.error
  }

  const arrangementAction = async (fn: (id: string) => Promise<void>) => {
    if (!main || saving) return
    setSaving(true)
    setError(null)
    try { await fn(main.id); onRecorded() } catch { setError('没保存上，再试一次。') }
    setSaving(false)
  }

  const card = (body: React.ReactNode) => (
    <section aria-label="今晚" className="mx-4 mb-3 rounded-[22px] bg-rhythm-card p-4 shadow-[0_0_0_1.5px_rgb(var(--r-practice)/0.3)]">
      {kicker}
      {body}
      {error && <p role="alert" className="mt-3 text-sm text-rhythm-danger">{error}</p>}
      {round && logsErrorsByRound[round.id] && (
        <p role="alert" className="mt-3 text-sm text-rhythm-danger">{logsErrorsByRound[round.id]} <button type="button" className="font-semibold" onClick={() => void loadLogsForRound(round.id)}>重试</button></p>
      )}
    </section>
  )

  // 本轮已到期：先回顾再继续
  if (practice && expired) {
    return card(
      <div>
        <p className="mt-2 text-[22px] font-bold">这一轮到期了</p>
        <p className="mt-1 text-[15px] text-rhythm-text-secondary">看看这几天的记录，决定有效、调整再试，还是先放下。</p>
        <Link href={`/habits/practices/${practice.id}`} className="mt-4 flex h-12 items-center justify-center rounded-full bg-rhythm-practice font-semibold text-[var(--r-on-practice)]">回顾这一轮</Link>
      </div>,
    )
  }

  // 记完了
  if (recordable && todayLog && !editing && days) {
    return card(
      <div>
        <div className="mt-2.5 flex items-center gap-2.5">
          <span className={`grid h-7 w-7 place-items-center rounded-full ${todayLog.status === 'done' ? 'bg-rhythm-practice' : todayLog.status === 'partial' ? 'bg-rhythm-habit' : 'bg-rhythm-border-strong'}`} aria-hidden="true">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="#fff" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round">
              {todayLog.status === 'skipped' ? <path d="M6 12h12" /> : <path d="M5 12.5l4.5 4.5L19 7.5" />}
            </svg>
          </span>
          <span className="text-[20px] font-bold">{LOG_LABEL[todayLog.status]}</span>
          <button type="button" onClick={() => setEditing(true)} className="ml-auto min-h-[36px] text-sm font-semibold text-rhythm-practice">改一下</button>
        </div>
        {main && <p className="mt-1 text-[15px] text-rhythm-text-secondary">{shortTime(main.scheduled_time) ? `${shortTime(main.scheduled_time)} ` : ''}{main.title}</p>}
        <RoundProgress start={round!.start_date} total={days.total} logs={logs} />
        <FollowUp log={todayLog} logs={logs} elapsed={days.elapsed} onSave={saveNote} />
      </div>,
    )
  }

  // 没有实践、只有安排且已处理
  if (!recordable && main && main.status === 'done') {
    return card(
      <div className="mt-2.5 flex items-center gap-2.5">
        <span className="text-[20px] font-bold">做到了：{main.title}</span>
        <button type="button" onClick={() => void arrangementAction(reset)} className="ml-auto min-h-[36px] text-sm font-semibold text-rhythm-practice">撤销</button>
      </div>,
    )
  }

  const hour = new Date().getHours()
  const showPlan = (!main && !skipPlan && !editing && (hour < PLAN_UNTIL_HOUR || !recordable)) || addingPlan

  if (showPlan) {
    return card(<TonightPlanForm today={today} hint={round?.assumption ?? null} onSkip={recordable ? () => { setSkipPlan(true); setAddingPlan(false) } : undefined} />)
  }

  // 晚上：显示安排，并记录结果
  const rest = plans.slice(1).map((p) => `${shortTime(p.scheduled_time) ? `${shortTime(p.scheduled_time)} ` : ''}${p.title}`)
  return card(
    <div>
      {main ? (
        <>
          <div className="mt-2.5 flex items-baseline gap-3">
            {shortTime(main.scheduled_time) && <b className="r-rounded text-[40px] font-bold leading-none">{shortTime(main.scheduled_time)}</b>}
            <span className="text-[20px] font-semibold leading-snug">{main.title}</span>
          </div>
          <p className="mt-1.5 text-[15px] text-rhythm-text-secondary">
            {rest.length > 0 ? `然后 ${rest.join('，')} · ` : ''}{clockOf(main.created_at)} 定的
          </p>
        </>
      ) : practice ? (
        <>
          <p className="mt-2 text-[22px] font-bold leading-snug">{practice.title}</p>
          {round?.assumption && <p className="mt-1 text-[15px] text-rhythm-text-secondary">{round.assumption}</p>}
          <button type="button" onClick={() => setAddingPlan(true)} className="mt-1 min-h-[36px] text-sm font-semibold text-rhythm-practice">加一个今晚安排</button>
        </>
      ) : null}

      {recordable ? (
        <>
          <p className="mt-4 border-t border-rhythm-border pt-3.5 text-[15px] text-rhythm-text-secondary">{editing ? '改成' : '今晚做到了吗？'}</p>
          <ThreeChoices disabled={saving || !!logsErrorsByRound[round!.id]} current={editing ? todayLog?.status : undefined} onPick={(s) => void record(s)} />
          {editing && <button type="button" onClick={() => setEditing(false)} className="mx-auto mt-2 block min-h-[36px] text-sm text-rhythm-text-secondary">取消</button>}
        </>
      ) : main ? (
        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-rhythm-border pt-3.5">
          <button type="button" disabled={saving} onClick={() => void arrangementAction(complete)} className="h-11 rounded-full bg-rhythm-practice text-[15px] font-semibold text-[var(--r-on-practice)] disabled:opacity-50">做到了</button>
          <button type="button" disabled={saving} onClick={() => void arrangementAction(cancel)} className="h-11 rounded-full bg-rhythm-fill text-[15px] font-semibold disabled:opacity-50">没做</button>
        </div>
      ) : null}
    </div>,
  )
}
