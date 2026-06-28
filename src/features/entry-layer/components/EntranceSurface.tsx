'use client'

import { useRef, useCallback, useEffect } from 'react'
import { BreathingWave } from './BreathingWave'
import { EntranceContent } from './EntranceContent'
import { useEntryStore } from '@/features/entry-layer/store/entry-store'

const PRESS_DURATION = 3000 // 3 seconds to complete

export function EntranceSurface() {
  const { isPressing, isCompleted, pressProgress, moment, visible, setPressing, setPressProgress, complete, reset } =
    useEntryStore()

  const pressTimerRef = useRef<number | null>(null)
  const pressStartRef = useRef<number>(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // ── Long press handling ──
  const updatePressProgress = useCallback(() => {
    const elapsed = performance.now() - pressStartRef.current
    const progress = Math.min(elapsed / PRESS_DURATION, 1)
    setPressProgress(progress)

    if (progress >= 1) {
      complete()
      pressTimerRef.current = null
    } else {
      pressTimerRef.current = requestAnimationFrame(updatePressProgress)
    }
  }, [setPressProgress, complete])

  const startPress = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (isCompleted) return
      e.preventDefault()

      pressStartRef.current = performance.now()
      setPressing(true)
      setPressProgress(0)
      pressTimerRef.current = requestAnimationFrame(updatePressProgress)
    },
    [isCompleted, setPressing, setPressProgress, updatePressProgress]
  )

  const endPress = useCallback(() => {
    if (!isPressing) return
    setPressing(false)

    if (pressTimerRef.current !== null) {
      cancelAnimationFrame(pressTimerRef.current)
      pressTimerRef.current = null
    }

    // If didn't reach full progress, reset
    if (pressProgress < 1) {
      setPressProgress(0)
    }
  }, [isPressing, pressProgress, setPressing, setPressProgress])

  const cancelPress = useCallback(() => {
    setPressing(false)
    if (pressTimerRef.current !== null) {
      cancelAnimationFrame(pressTimerRef.current)
      pressTimerRef.current = null
    }
    setPressProgress(0)
  }, [setPressing, setPressProgress])

  // Reset completion after a delay (for demo / re-triggerability)
  useEffect(() => {
    if (isCompleted) {
      const timer = setTimeout(() => {
        reset()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [isCompleted, reset])

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (pressTimerRef.current !== null) {
        cancelAnimationFrame(pressTimerRef.current)
      }
    }
  }, [])

  if (!visible) return null

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex flex-col items-center justify-center select-none overflow-hidden"
      style={{
        padding: '0 1.5rem',
        background: 'linear-gradient(180deg, #0B1019 0%, #111823 38%, #090D14 100%)',
        cursor: isPressing ? 'pointer' : 'default',
      }}
    >
      {/* Invisible touch/mouse target overlay for long-press detection */}
      {/* Only covers the wave area, not the entire screen */}
      <div
        className="absolute z-10 flex items-center justify-center"
        style={{
          left: '10%',
          right: '10%',
          top: '32%',
          height: '24%',
          cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
        }}
        onMouseDown={startPress}
        onMouseUp={endPress}
        onMouseLeave={cancelPress}
        onTouchStart={startPress}
        onTouchEnd={endPress}
        onTouchCancel={cancelPress}
      />

      {/* Wave area — positioned at ~38–45% of screen height */}
      <div
        className="absolute left-0 right-0 flex items-center justify-center"
        style={{
          top: '38%',
          transform: 'translateY(-50%)',
        }}
      >
        <BreathingWave />
      </div>

      {/* Text area — below the wave, centered */}
      <div
        className="absolute left-0 right-0 flex flex-col items-center"
        style={{
          top: '52%',
          paddingInline: '1.5rem',
        }}
      >
        <EntranceContent />
      </div>

      {/* Completion subtle indication — appears in the gap between wave and text */}
      {isCompleted && (
        <div
          className="absolute left-0 right-0 flex items-center justify-center z-10"
          style={{
            top: '48%',
            opacity: 1,
            animation: 'fadeInUp 0.6s ease-out',
          }}
        >
          <span
            className="text-[0.82rem] font-normal tracking-[0.06em]"
            style={{
              color: 'rgba(160, 195, 220, 0.4)',
              fontFamily: '"Noto Serif SC", "STSong", "PingFang SC", "Microsoft YaHei", serif',
            }}
          >
            {moment.completionMessage ?? '这 3 分钟，已经留在今天里。'}
          </span>
        </div>
      )}

      {/* CSS keyframes for fade-in */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Bottom hint — extremely faint, only visible when idle */}
      {!isCompleted && !isPressing && (
        <p
          className="absolute text-center text-[0.72rem] tracking-[0.05em] select-none"
          style={{
            bottom: '14%',
            left: '0',
            right: '0',
            color: 'rgba(210, 215, 222, 0.12)',
            fontFamily: '"Noto Serif SC", "STSong", "PingFang SC", "Microsoft YaHei", serif',
          }}
        >
          按住，留下这一刻
        </p>
      )}

      {/* Pressing state hint */}
      {isPressing && (
        <p
          className="absolute text-center text-[0.72rem] tracking-[0.05em] select-none z-10"
          style={{
            bottom: '14%',
            left: '0',
            right: '0',
            color: `rgba(170, 200, 225, ${0.3 + pressProgress * 0.4})`,
            fontFamily: '"Noto Serif SC", "STSong", "PingFang SC", "Microsoft YaHei", serif',
            transition: 'color 0.3s ease',
          }}
        >
          {pressProgress < 0.33
            ? '在听了……'
            : pressProgress < 0.66
              ? '正在留下……'
              : '快好了'}
        </p>
      )}
    </div>
  )
}
