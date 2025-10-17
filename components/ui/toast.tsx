"use client"

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

type Toast = { id?: string; title?: string; message: string; variant?: 'success' | 'error' | 'info' | 'warning' }

const ToastContext = createContext<{ push: (t: Partial<Toast>) => void } | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const push = useCallback((t: Partial<Toast>) => {
    setToasts((s) => [{ ...(t as Toast), id: String(Date.now()) }, ...s].slice(0, 5))
  }, [])

  useEffect(() => {
    if (toasts.length === 0) return
    const timers = toasts.map((t) =>
      setTimeout(() => setToasts((s) => s.filter((x) => x.id !== t.id)), 4000)
    )
    return () => timers.forEach(clearTimeout)
  }, [toasts])

  const value = useMemo(() => ({ push }), [push])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 bottom-6 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} className={`max-w-sm w-full rounded-md p-3 shadow-lg text-sm text-white ${
            t.variant === 'success' ? 'bg-green-600' : t.variant === 'error' ? 'bg-red-600' : t.variant === 'warning' ? 'bg-yellow-600 text-black' : 'bg-sky-600'
          }`}>
            {t.title && <div className="font-semibold">{t.title}</div>}
            <div className="whitespace-pre-wrap">{t.message}</div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

// Safe version that returns null when no provider is present
export function useToastSafe() {
  return useContext(ToastContext)
}
