'use client'

import { create } from 'zustand'

export interface EntryMoment {
  type: 'action' | 'rest' | 'thought' | 'closure' | 'silent'
  practiceName?: string
  dayCount?: number
  actionDescription?: string
  greeting?: string
  subGreeting?: string
  completionMessage?: string
  completionHint?: string
}

export interface EntryStore {
  moment: EntryMoment
  isCompleted: boolean
  isPressing: boolean
  pressProgress: number
  visible: boolean

  setMoment: (moment: EntryMoment) => void
  setPressing: (pressing: boolean) => void
  setPressProgress: (progress: number) => void
  complete: () => void
  reset: () => void
  hide: () => void
  show: () => void
}

export const useEntryStore = create<EntryStore>((set) => ({
  moment: {
    type: 'action',
    practiceName: '早起不看手机',
    dayCount: 4,
    actionDescription: '不看手机 3 分钟即可',
  },
  isCompleted: false,
  isPressing: false,
  pressProgress: 0,
  visible: true,

  setMoment: (moment) => set({ moment, isCompleted: false, pressProgress: 0 }),
  setPressing: (pressing) => set({ isPressing: pressing }),
  setPressProgress: (progress) => set({ pressProgress: progress }),
  complete: () => set({ isCompleted: true, isPressing: false, pressProgress: 1 }),
  reset: () => set({ isCompleted: false, isPressing: false, pressProgress: 0 }),
  hide: () => set({ visible: false }),
  show: () => set({ visible: true }),
}))
