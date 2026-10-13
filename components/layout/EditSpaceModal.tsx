'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { spaceSchema, type SpaceFormValues } from '@/lib/validations/schemas'
import { useApp } from '@/components/providers/AppProvider'
import { useToast } from '@/components/ui/Toaster'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/FormFields'
import { Button } from '@/components/ui/Button'
import { SPACE_ICONS, SPACE_COLORS } from './CreateSpaceModal'
import type { Space } from '@/lib/types/database'
import { cn } from '@/lib/utils/cn'

interface EditSpaceModalProps {
  space: Space | null
  open: boolean
  onClose: () => void
}

export function EditSpaceModal({ space, open, onClose }: EditSpaceModalProps) {
  const { updateSpace } = useApp()
  const { success, error: toastError } = useToast()
  const [selectedIcon, setSelectedIcon] = useState('layers')
  const [selectedColor, setSelectedColor] = useState(SPACE_COLORS[0])

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SpaceFormValues>({
    resolver: zodResolver(spaceSchema),
    defaultValues: {
      name: '',
      icon: 'layers',
      color: SPACE_COLORS[0],
    },
  })

  useEffect(() => {
    if (space && open) {
      setValue('name', space.name)
      setSelectedIcon(space.icon || 'layers')
      setSelectedColor(space.color || SPACE_COLORS[0])
    }
  }, [space, open, setValue])

  if (!space) return null

  async function onSubmit(values: SpaceFormValues) {
    if (!space) return
    try {
      const updated = await updateSpace(space.id, {
        name: values.name,
        icon: selectedIcon,
        color: selectedColor,
      })
      if (updated) {
        success(`Space "${updated.name}" updated`)
        onClose()
      } else {
        toastError('Failed to update space. Please try again.')
      }
    } catch (err: any) {
      toastError(err?.message || 'Failed to update space.')
    }
  }

  function handleClose() {
    reset()
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} title="Edit Space" className="max-w-md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-1">
        {space.is_default && (
          <div className="p-2.5 rounded-lg bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)] flex items-center justify-between text-xs">
            <span className="text-[var(--color-text-secondary)]">This is your primary space</span>
            <span className="font-semibold px-2 py-0.5 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/20">
              Default Space
            </span>
          </div>
        )}

        {/* Space Name */}
        <Input
          label="Space Name"
          placeholder="e.g. Garage, Beach House, Business"
          error={errors.name?.message}
          {...register('name')}
          autoFocus
        />

        {/* Icon Picker */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-[var(--color-text-secondary)]">
            Icon
          </label>
          <div className="grid grid-cols-4 gap-2">
            {SPACE_ICONS.map((item) => {
              const IconComp = item.icon
              const isSelected = selectedIcon === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedIcon(item.id)}
                  className={cn(
                    'flex flex-col items-center justify-center p-2 rounded-xl border text-xs gap-1.5 transition-all duration-150',
                    'hover:bg-[var(--color-surface-hover)] active:scale-95',
                    isSelected
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-semibold shadow-xs'
                      : 'border-[var(--color-border-primary)] text-[var(--color-text-secondary)]'
                  )}
                >
                  <IconComp className="w-5 h-5" />
                  <span className="text-[0.6875rem]">{item.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Color Palette */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-[var(--color-text-secondary)]">
            Color Accent
          </label>
          <div className="flex items-center gap-2.5 flex-wrap pt-0.5">
            {SPACE_COLORS.map((hex) => {
              const isSelected = selectedColor === hex
              return (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setSelectedColor(hex)}
                  className={cn(
                    'w-7 h-7 rounded-full transition-all duration-150 relative active:scale-90',
                    isSelected
                      ? 'ring-2 ring-offset-2 ring-[var(--color-accent)] scale-110'
                      : 'hover:scale-105 opacity-80 hover:opacity-100'
                  )}
                  style={{ backgroundColor: hex }}
                  aria-label={`Select color ${hex}`}
                />
              )
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--color-border-primary)]">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Save Changes
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
