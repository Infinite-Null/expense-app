'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, Tag as TagIcon, Search } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { tagSchema, type TagFormValues } from '@/lib/validations/schemas'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toaster'
import { ConfirmDialog, Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/FormFields'
import { Button } from '@/components/ui/Button'
import type { Tag } from '@/lib/types/database'
import { cn } from '@/lib/utils/cn'

import { TAG_COLOR_PALETTE, getTagColor, getBadgeStyles } from '@/lib/utils/colors'

import { useEffect } from 'react'
import { useApp } from '@/components/providers/AppProvider'

const TAG_COLORS = TAG_COLOR_PALETTE

interface TagsClientProps {
  tags?: Tag[]
}

export function TagsClient({ tags: initial }: TagsClientProps = {}) {
  const app = useApp()
  const [tags, setTags] = useState<Tag[]>(initial ?? app.tags)

  useEffect(() => {
    if (!initial && app.tags.length > 0) {
      setTags(app.tags)
    }
  }, [initial, app.tags])
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Tag | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Tag | null>(null)
  const [deleting, setDeleting] = useState(false)
  const { success, error: toastError } = useToast()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TagFormValues>({
    resolver: zodResolver(tagSchema),
    defaultValues: { name: '', color: TAG_COLOR_PALETTE[0] },
  })

  const selectedColor = watch('color')

  const filteredTags = tags.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  )

  function openCreate() {
    setEditing(null)
    reset({ name: '', color: TAG_COLOR_PALETTE[Math.floor(Math.random() * TAG_COLOR_PALETTE.length)] })
    setShowModal(true)
  }

  function openEdit(tag: Tag) {
    setEditing(tag)
    reset({ name: tag.name, color: getTagColor(tag.name, tag.color) })
    setShowModal(true)
  }

  async function onSubmit(values: TagFormValues) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const normalizedName = values.name.toLowerCase().trim()

    if (editing) {
      const { data, error } = await supabase
        .from('tags')
        .update({ name: normalizedName, color: values.color })
        .eq('id', editing.id)
        .select()
        .single()

      if (error) {
        toastError(error.message.includes('unique') ? 'A tag with this name already exists' : error.message)
        return
      }
      setTags((prev) => prev.map((t) => (t.id === editing.id ? data : t)))
      success('Tag updated successfully')
    } else {
      const { data, error } = await supabase
        .from('tags')
        .insert({ user_id: user.id, name: normalizedName, color: values.color })
        .select()
        .single()

      if (error) {
        toastError(error.message.includes('unique') ? 'A tag with this name already exists' : error.message)
        return
      }
      setTags((prev) => [...prev, data])
      success('Tag created successfully')
    }

    app.refreshTags()
    setShowModal(false)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    const supabase = createClient()

    // Note: expense_tags has ON DELETE CASCADE in PostgreSQL schema
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', deleteTarget.id)

    setDeleting(false)

    if (error) {
      toastError(error.message)
      return
    }

    setTags((prev) => prev.filter((t) => t.id !== deleteTarget.id))
    setDeleteTarget(null)
    app.refreshTags()
    success('Tag deleted')
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Tags
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
            Organize and cross-reference your expenses across categories
          </p>
        </div>
        <Button onClick={openCreate} id="btn-create-tag">
          <Plus className="w-4 h-4" />
          New Tag
        </Button>
      </div>

      {/* Filter / Search Bar */}
      <div className="apple-card p-4 flex items-center gap-3">
        <Search className="w-4 h-4 text-[var(--color-text-tertiary)] shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tags..."
          className="bg-transparent border-none outline-none text-sm w-full text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)]"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors px-2 py-0.5"
          >
            Clear
          </button>
        )}
      </div>

      {/* Tags Grid */}
      {filteredTags.length === 0 ? (
        <div className="apple-card p-12 text-center">
          <div
            className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'var(--color-fill-secondary)' }}
          >
            <TagIcon className="w-6 h-6 text-[var(--color-text-tertiary)]" />
          </div>
          <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-1">
            {search ? 'No matching tags found' : 'No tags yet'}
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)] max-w-sm mx-auto mb-6">
            {search
              ? `No tags matched "${search}". Try a different keyword.`
              : 'Tags allow you to organize expenses by project, trip, or label (e.g. vacation, reimbursable, tax-deductible).'}
          </p>
          {!search && (
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4" />
              Create your first tag
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {filteredTags.map((tag) => {
            const color = getTagColor(tag.name, tag.color)
            return (
              <div
                key={tag.id}
                className="apple-card p-4 flex items-center justify-between group hover:border-[var(--color-border-hover)] transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="text-xs px-2.5 py-1 rounded-full border shrink-0 font-medium"
                    style={getBadgeStyles(color)}
                  >
                    #{tag.name}
                  </span>
                </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                <button
                  onClick={() => openEdit(tag)}
                  className="p-1.5 rounded-md hover:bg-[var(--color-fill-secondary)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                  aria-label={`Edit ${tag.name}`}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeleteTarget(tag)}
                  className="p-1.5 rounded-md hover:bg-red-500/10 text-[var(--color-text-tertiary)] hover:text-red-500 transition-colors"
                  aria-label={`Delete ${tag.name}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )
        })}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Edit Tag' : 'New Tag'}
        description={
          editing
            ? 'Update the tag label or its display badge color.'
            : 'Add a new tag to organize transactions across categories.'
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Tag Name"
            placeholder="e.g. vacation, reimbursable"
            prefix="#"
            error={errors.name?.message}
            {...register('name')}
          />

          {/* Color Picker */}
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-2 uppercase tracking-wider">
              Badge Color
            </label>
            <div className="flex flex-wrap gap-2.5 items-center">
              {TAG_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setValue('color', c, { shouldValidate: true })}
                  className={cn(
                    'w-7 h-7 rounded-full transition-transform focus:outline-none flex items-center justify-center',
                    selectedColor === c && 'ring-2 ring-offset-2 ring-[var(--color-accent)] scale-110'
                  )}
                  style={{ backgroundColor: c }}
                  aria-label={`Select color ${c}`}
                />
              ))}
              <input
                type="color"
                value={selectedColor || '#0066cc'}
                onChange={(e) => setValue('color', e.target.value, { shouldValidate: true })}
                className="w-7 h-7 rounded-full border-0 p-0 cursor-pointer overflow-hidden"
                title="Custom color"
              />
            </div>
            {errors.color?.message && (
              <p className="mt-1 text-xs text-[var(--color-error)]">{errors.color.message}</p>
            )}
          </div>

          {/* Live Preview */}
          <div className="p-3 rounded-lg bg-[var(--color-fill-secondary)] flex items-center justify-between">
            <span className="text-xs text-[var(--color-text-tertiary)] font-medium">Badge Preview:</span>
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white shadow-sm"
              style={{ backgroundColor: selectedColor || '#0066cc' }}
            >
              #{watch('name') || 'preview'}
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {editing ? 'Save Changes' : 'Create Tag'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Delete tag "${deleteTarget?.name}"?`}
        description="Deleting this tag will remove it from all associated expenses. The expenses themselves will NOT be deleted."
        confirmLabel="Delete Tag"
        variant="destructive"
        loading={deleting}
      />
    </div>
  )
}
