'use client'
import React, { createContext, useContext, useState, useCallback } from 'react'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastItem {
  id: string
  type: ToastType
  message: string
}

interface ToastContextValue {
  addToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue>({ addToast: () => {} })

export function useToast() { return useContext(ToastContext) }

const typeClasses: Record<ToastType, string> = {
  success: 'bg-green-600',
  error: 'bg-red-600',
  info: 'bg-[#2D1B69]',
  warning: 'bg-yellow-500',
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, type, message }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(t => (
          <div key={t.id} className={`${typeClasses[t.type]} text-white px-4 py-3 rounded-lg shadow-lg text-sm font-medium max-w-xs`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
