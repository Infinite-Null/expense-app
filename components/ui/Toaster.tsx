'use client'

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'
import type { ToastElement } from './SakugaControls'

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

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast
  onDismiss: (id: string) => void
}) {
  const Icon = ICONS[toast.type]
  const ref = useRef<ToastElement>(null)

  useEffect(() => {
    const element = ref.current
    let mounted = true
    let fallbackTimer: ReturnType<typeof setTimeout> | undefined
    if (!element?.show) fallbackTimer = setTimeout(() => onDismiss(toast.id), toast.duration ?? 4000)
    void customElements.whenDefined('sakuga-toast').then(() => {
      if (!mounted) return
      clearTimeout(fallbackTimer)
      element?.show()
    })
    return () => {
      mounted = false
      clearTimeout(fallbackTimer)
    }
  }, [onDismiss, toast.duration, toast.id])

  return (
    <sakuga-toast
      ref={ref}
      duration={(toast.duration ?? 4000) / 1000}
      onclose={() => onDismiss(toast.id)}
      className="sakuga-toast"
      data-variant={toast.type}
    >
      <div
        role={toast.type === 'error' ? 'alert' : 'status'}
        className="flex items-start gap-3 p-3.5"
      >
        <Icon aria-hidden="true" className="w-5 h-5 mt-0.5 flex-shrink-0" strokeWidth={2} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-snug">{toast.title}</p>
          {toast.description && (
            <p className="text-sm opacity-80 mt-0.5 leading-snug">{toast.description}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            if (ref.current?.hide) ref.current.hide()
            else onDismiss(toast.id)
          }}
          className="btn-ghost size-7 shrink-0 rounded-md p-0"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </sakuga-toast>
  )
}

export function Toaster({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    ({ type, title, description, duration = 4000 }: Omit<Toast, 'id'>) => {
      const id = Math.random().toString(36).slice(2)
      setToasts((prev) => [...prev.slice(-4), { id, type, title, description, duration }])
    },
    []
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
      {children}
      <div
        aria-label="Notifications"
        className="fixed inset-x-4 bottom-5 z-[110] flex flex-col gap-3 pointer-events-none sm:left-auto sm:bottom-6 sm:right-6 sm:w-96"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}
