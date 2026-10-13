'use client'

import { useState } from 'react'
import { useApp } from '@/components/providers/AppProvider'
import { useToast } from '@/components/ui/Toaster'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { AlertTriangle, Trash2 } from 'lucide-react'
import type { Space } from '@/lib/types/database'

interface DeleteSpaceModalProps {
  space: Space | null
  open: boolean
  onClose: () => void
}

export function DeleteSpaceModal({ space, open, onClose }: DeleteSpaceModalProps) {
  const { spaces, deleteSpace } = useApp()
  const { success, error: toastError } = useToast()
  const [loading, setLoading] = useState(false)

  if (!space) return null

  const isDefault = space.is_default
  const isOnlySpace = spaces.length <= 1

  async function handleDelete() {
    if (!space) return
    setLoading(true)
    try {
      const res = await deleteSpace(space.id)
      if (res.success) {
        success(`Space "${space.name}" and its expenses have been deleted.`)
        onClose()
      } else {
        toastError(res.error || 'Failed to delete space.')
      }
    } catch (err: any) {
      toastError(err?.message || 'Failed to delete space.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Delete Space: ${space.name}`}
      className="max-w-md"
    >
      <div className="space-y-4 pt-1">
        {isDefault ? (
          <div className="p-3.5 rounded-xl bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)] space-y-2 text-xs">
            <div className="flex items-center gap-2 font-semibold text-[var(--color-text-primary)]">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Default Space Protected</span>
            </div>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              <strong>{space.name}</strong> is your primary default space and cannot be deleted. If you want to rename or change its icon, you can edit it instead.
            </p>
            <div className="flex justify-end pt-2">
              <Button type="button" variant="secondary" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        ) : isOnlySpace ? (
          <div className="p-3.5 rounded-xl bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)] space-y-2 text-xs">
            <div className="flex items-center gap-2 font-semibold text-[var(--color-text-primary)]">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>At least one space required</span>
            </div>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              You must have at least one space active in your account.
            </p>
            <div className="flex justify-end pt-2">
              <Button type="button" variant="secondary" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Warning Banner: Space & all its expenses will be deleted */}
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 text-xs">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div className="text-[var(--color-text-primary)] space-y-1">
                <span className="font-semibold block text-red-600 dark:text-red-400">
                  Data in this space will be deleted
                </span>
                <p className="text-[var(--color-text-secondary)] leading-relaxed">
                  All expenses and transactions logged under <strong>{space.name}</strong> will be permanently deleted along with this space. This action cannot be undone.
                </p>
              </div>
            </div>

            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              Are you sure you want to permanently delete <strong>&ldquo;{space.name}&rdquo;</strong> and all of its expense records?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--color-border-primary)]">
              <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                loading={loading}
                onClick={handleDelete}
                className="gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </Button>
            </div>
          </>
        )}
      </div>
    </Dialog>
  )
}
