'use client'

import { useEntryStore } from '@/features/entry-layer/store/entry-store'

export function EntranceContent() {
  const { moment, isCompleted } = useEntryStore()

  const { practiceName, dayCount, actionDescription, greeting, subGreeting } = moment

  return (
    <div
      className="flex flex-col items-center text-center select-none"
      style={{
        opacity: isCompleted ? 0.4 : 1,
        transition: 'opacity 1.2s ease',
      }}
    >
      {/* Main practice title */}
      <h1
        className="text-[1.15rem] font-medium leading-relaxed tracking-[0.06em]"
        style={{
          color: 'rgba(210, 215, 222, 0.82)',
          fontFamily: '"Noto Serif SC", "STSong", "PingFang SC", "Microsoft YaHei", serif',
        }}
      >
        {practiceName ?? greeting ?? '此刻，没有什么需要完成。'}
      </h1>

      {/* Day count / sub-greeting */}
      {dayCount !== undefined && dayCount > 0 && (
        <p
          className="text-[0.88rem] mt-1.5 font-normal tracking-[0.05em]"
          style={{
            color: 'rgba(210, 215, 222, 0.38)',
            fontFamily: '"Noto Serif SC", "STSong", "PingFang SC", "Microsoft YaHei", serif',
          }}
        >
          第 {dayCount} 天
        </p>
      )}

      {subGreeting && (
        <p
          className="text-[0.88rem] mt-1.5 font-normal tracking-[0.05em]"
          style={{
            color: 'rgba(210, 215, 222, 0.38)',
            fontFamily: '"Noto Serif SC", "STSong", "PingFang SC", "Microsoft YaHei", serif',
          }}
        >
          {subGreeting}
        </p>
      )}

      {/* Action description — the minimum action hint */}
      {actionDescription && (
        <p
          className="text-[0.82rem] mt-2 font-normal tracking-[0.04em]"
          style={{
            color: 'rgba(210, 215, 222, 0.22)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif',
          }}
        >
          {actionDescription}
        </p>
      )}
    </div>
  )
}
