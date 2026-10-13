'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { spaceSchema, type SpaceFormValues } from '@/lib/validations/schemas'
import { useApp } from '@/components/providers/AppProvider'
import { useToast } from '@/components/ui/Toaster'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/FormFields'
import { Button } from '@/components/ui/Button'
import {
  Layers,
  Home,
  Briefcase,
  Car,
  ShoppingBag,
  Sparkles,
  Folder,
  Building,
  Heart,
  Plane,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface CreateSpaceModalProps {
  open: boolean
  onClose: () => void
}

const SPACE_ICONS = [
  { id: 'layers', icon: Layers, label: 'Default' },
  { id: 'home', icon: Home, label: 'House' },
  { id: 'car', icon: Car, label: 'Garage' },
  { id: 'briefcase', icon: Briefcase, label: 'Work' },
  { id: 'building', icon: Building, label: 'Property' },
  { id: 'shopping-bag', icon: ShoppingBag, label: 'Personal' },
  { id: 'plane', icon: Plane, label: 'Travel' },
  { id: 'heart', icon: Heart, label: 'Family' },
]

const SPACE_COLORS = [
  '#4F46E5', // Indigo
  '#2563EB', // Blue
  '#059669', // Emerald
  '#D97706', // Amber
  '#DC2626', // Red
  '#7C3AED', // Violet
  '#DB2777', // Pink
  '#475569', // Slate
]

export function CreateSpaceModal({ open, onClose }: CreateSpaceModalProps) {
  const { createSpace } = useApp()
  const { success, error: toastError } = useToast()
  const [selectedIcon, setSelectedIcon] = useState('layers')
  const [selectedColor, setSelectedColor] = useState(SPACE_COLORS[0])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SpaceFormValues>({
    resolver: zodResolver(spaceSchema),
    defaultValues: {
      name: '',
      icon: 'layers',
      color: SPACE_COLORS[0],
    },
  })

  async function onSubmit(values: SpaceFormValues) {
    try {
      const space = await createSpace(values.name, selectedIcon, selectedColor)
      if (space) {
        success(`Space "${space.name}" created`)
        reset()
        onClose()
      } else {
        toastError('Failed to create space. Please try again.')
      }
    } catch (err: any) {
      toastError(err?.message || 'Failed to create space.')
    }
  }

  function handleClose() {
    reset()
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} title="Create New Space" className="max-w-md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-1">
        <p className="text-xs text-[var(--color-text-secondary)] -mt-2">
          Spaces let you separate different contexts like House, Garage, or Business under the same account.
        </p>

        {/* Space Name */}
        <Input
          label="Space Name"
          placeholder="e.g. House, Garage, Side Business"
          autoFocus
          error={errors.name?.message}
          {...register('name')}
        />

        {/* Icon Selection */}
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-2">
            Icon
          </label>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {SPACE_ICONS.map(({ id, icon: Icon, label }) => {
              const isSelected = selectedIcon === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelectedIcon(id)}
                  title={label}
                  className={cn(
                    'h-10 rounded-xl flex items-center justify-center transition-all duration-200 border text-sm',
                    isSelected
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-subtle)] text-[var(--color-accent)] shadow-xs scale-105'
                      : 'border-[var(--color-border-primary)] bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-hover)]'
                  )}
                >
                  <Icon className="w-4 h-4" />
                </button>
              )
            })}
          </div>
        </div>

        {/* Color Palette */}
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-2">
            Color Accent
          </label>
          <div className="flex items-center gap-2.5 flex-wrap">
            {SPACE_COLORS.map((color) => {
              const isSelected = selectedColor === color
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={cn(
                    'w-7 h-7 rounded-full transition-all duration-200 flex items-center justify-center',
                    isSelected ? 'ring-2 ring-offset-2 ring-[var(--color-accent)] scale-110' : 'hover:scale-105'
                  )}
                  style={{
                    backgroundColor: color,
                    borderColor: 'var(--color-border-primary)',
                  }}
                  aria-label={`Color ${color}`}
                >
                  {isSelected && <div className="w-2 h-2 rounded-full bg-white shadow-xs" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--color-border-primary)]">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Create Space
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
