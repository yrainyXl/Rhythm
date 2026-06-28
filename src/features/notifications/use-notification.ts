'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

export function useNotification() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return 'denied'

    const result = await Notification.requestPermission()
    setPermission(result)
    setShowPrompt(false)
    return result
  }, [])

  const sendNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (!('Notification' in window) || Notification.permission !== 'granted') return

      return new Notification(title, {
        icon: '/favicon.ico',
        ...options,
      })
    },
    []
  )

  return {
    permission,
    showPrompt,
    setShowPrompt,
    requestPermission,
    sendNotification,
  }
}

interface ReminderTimer {
  habitId: string
  timerId: NodeJS.Timeout
  time: string
}

export function useReminders(habitReminders: { habitId: string; habitName: string; reminderTime: string }[]) {
  const { permission, requestPermission, sendNotification } = useNotification()
  const timersRef = useRef<ReminderTimer[]>([])
  const [completedHabitIds, setCompletedHabitIds] = useState<Set<string>>(new Set())

  // Check reminders every 60 seconds
  useEffect(() => {
    if (permission !== 'granted') return

    const checkInterval = setInterval(() => {
      const now = new Date()
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

      habitReminders.forEach(({ habitId, habitName, reminderTime }) => {
        if (!reminderTime || completedHabitIds.has(habitId)) return

        if (currentTime === reminderTime) {
          sendNotification(`该${habitName}了`, {
            body: `你设定的习惯「${habitName}」时间到了`,
            tag: `habit-${habitId}-${currentTime}`,
          })
        }
      })
    }, 60000) // Check every minute

    return () => clearInterval(checkInterval)
  }, [habitReminders, permission, completedHabitIds, sendNotification])

  const markCompleted = useCallback((habitId: string) => {
    setCompletedHabitIds((prev) => new Set([...prev, habitId]))
  }, [])

  const resetReminder = useCallback((habitId: string) => {
    setCompletedHabitIds((prev) => {
      const next = new Set(prev)
      next.delete(habitId)
      return next
    })
  }, [])

  return {
    permission,
    requestPermission,
    markCompleted,
    resetReminder,
  }
}
