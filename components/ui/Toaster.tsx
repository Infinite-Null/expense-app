'use client'

import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  title: string
  description?: string
  duration?: number
}

interface ToastContextValue {
  toast: (opts: Omit<Toast, 'id'>) => void
  success: (title: string, description?: string) => void
  error: (title: string, description?: string) => void
  warning: (title: string, description?: string) => void
  info: (title: string, description?: string) => void
}

const ToastContext = createContext<ToastContextValue>({
  toast: () => {},
  success: () => {},
  error: () => {},
  warning: () => {},
  info: () => {},
})

export function useToast() {
  return useContext(ToastContext)
}

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
}

const STYLES = {
  success: 'border-[var(--color-success)] bg-[var(--color-success-bg)] text-[var(--color-success-text)]',
  error: 'border-[var(--color-error)] bg-[var(--color-error-bg)] text-[var(--color-error-text)]',
  warning: 'border-[var(--color-warning)] bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]',
  info: 'border-[var(--color-info)] bg-[var(--color-info-bg)] text-[var(--color-accent-text)]',
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast
  onDismiss: (id: string) => void
}) {
  const Icon = ICONS[toast.type]

  return (
    <div
      role="alert"
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
      className={cn(
        'toast-in flex items-start gap-3 w-full max-w-sm p-4 rounded-[var(--radius-lg)] border shadow-[var(--shadow-lg)] backdrop-blur-sm',
        STYLES[toast.type]
      )}
    >
      <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" strokeWidth={2} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-snug">{toast.title}</p>
        {toast.description && (
          <p className="text-sm opacity-80 mt-0.5 leading-snug">{toast.description}</p>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity p-0.5 rounded"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timerRefs = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const dismiss = useCallback((id: string) => {
    clearTimeout(timerRefs.current[id])
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    ({ type, title, description, duration = 4000 }: Omit<Toast, 'id'>) => {
      const id = Math.random().toString(36).slice(2)
      setToasts((prev) => [...prev.slice(-4), { id, type, title, description }])
      timerRefs.current[id] = setTimeout(() => dismiss(id), duration)
    },
    [dismiss]
  )

  const success = useCallback(
    (title: string, description?: string) => toast({ type: 'success', title, description }),
    [toast]
  )
  const error = useCallback(
    (title: string, description?: string) => toast({ type: 'error', title, description }),
    [toast]
  )
  const warning = useCallback(
    (title: string, description?: string) => toast({ type: 'warning', title, description }),
    [toast]
  )
  const info = useCallback(
    (title: string, description?: string) => toast({ type: 'info', title, description }),
    [toast]
  )

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info }}>
      <div
        aria-label="Notifications"
        className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none"
      >
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
