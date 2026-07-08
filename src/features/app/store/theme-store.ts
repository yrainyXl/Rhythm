'use client'

import { create } from 'zustand'

type Theme = 'dark' | 'light'

const STORAGE_KEY = 'rhythm-theme'

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.classList.remove('dark', 'light')
  root.classList.add(theme)
}

function readStored(): Theme {
  if (typeof window === 'undefined') return 'dark'
  return window.localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark'
}

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggle: () => void
  initTheme: () => void
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'dark',

  setTheme: (theme) => {
    applyTheme(theme)
    if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, theme)
    set({ theme })
  },

  toggle: () => {
    get().setTheme(get().theme === 'dark' ? 'light' : 'dark')
  },

  initTheme: () => {
    const theme = readStored()
    applyTheme(theme)
    set({ theme })
  },
}))
