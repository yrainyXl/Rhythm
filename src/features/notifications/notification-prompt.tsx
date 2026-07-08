'use client'

import { useEffect, useState } from 'react'
import { useNotification } from '@/features/notifications/use-notification'

export function NotificationPrompt() {
  const { permission, requestPermission, setShowPrompt } = useNotification()
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (permission === 'default' && !dismissed) {
      const timer = setTimeout(() => setShowPrompt(true), 5000)
      return () => clearTimeout(timer)
    }
  }, [permission, dismissed, setShowPrompt])

  if (permission === 'granted' || permission === 'denied' || dismissed) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 max-w-sm mx-auto z-50">
      <div className="r-card p-4 shadow-lg">
        <p className="text-sm text-rhythm-text-primary font-medium mb-1">开启通知提醒</p>
        <p className="text-xs text-rhythm-text-muted mb-3">开启后可以在习惯时间收到浏览器通知</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={requestPermission}
            className="r-btn-primary flex-1 py-2 text-xs"
          >
            开启通知
          </button>
          <button
            type="button"
            onClick={() => { setDismissed(true); setShowPrompt(false) }}
            className="r-btn-ghost px-4 py-2 text-xs"
          >
            暂不
          </button>
        </div>
      </div>
    </div>
  )
}
