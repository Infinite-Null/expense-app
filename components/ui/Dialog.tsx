'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_CLASS = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  className,
  size = 'md',
}: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    // Focus trap
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    focusable?.[0]?.focus()

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open || !mounted) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal
      aria-labelledby="dialog-title"
      aria-describedby={description ? 'dialog-description' : undefined}
    >
      {/* Full-screen Backdrop covering entire viewport */}
      <div
        className="fixed inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-md transition-opacity"
        onClick={onClose}
        aria-hidden
      />

      {/* Dialog Panel */}
      <div
        ref={dialogRef}
        className={cn(
          'relative w-full rounded-[var(--radius-xl)] shadow-2xl',
          'bg-white dark:bg-[#1c1c1e] text-zinc-900 dark:text-zinc-100',
          'border border-zinc-200/90 dark:border-white/10',
          'backdrop-blur-2xl fade-in z-10',
          SIZE_CLASS[size],
          className
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4">
          <div>
            <h2
              id="dialog-title"
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 leading-tight tracking-tight"
            >
              {title}
            </h2>
            {description && (
              <p
                id="dialog-description"
                className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed"
              >
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 ml-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">{children}</div>
      </div>
    </div>,
    document.body
  )
}

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'destructive'
  loading?: boolean
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title={title} description={description} size="sm">
      <div className="flex gap-3 mt-6 pt-1">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 h-10 px-4 rounded-xl text-sm font-medium transition-all bg-zinc-100 hover:bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700/60 active:scale-95 cursor-pointer"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={cn(
            'flex-1 h-10 px-4 rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-50 cursor-pointer',
            variant === 'destructive'
              ? 'bg-red-600 hover:bg-red-700 text-white shadow-sm'
              : 'bg-black hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black shadow-sm'
          )}
        >
          {loading ? 'Loading...' : confirmLabel}
        </button>
      </div>
    </Dialog>
  )
}
