'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, FolderOpen, Lock } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { categorySchema, type CategoryFormValues } from '@/lib/validations/schemas'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toaster'
import { ConfirmDialog, Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/FormFields'
import { Button } from '@/components/ui/Button'
import type { Category } from '@/lib/types/database'
import { cn } from '@/lib/utils/cn'

import { CATEGORY_COLOR_PALETTE, getCategoryColor } from '@/lib/utils/colors'

import { useApp } from '@/components/providers/AppProvider'

const CATEGORY_COLORS = CATEGORY_COLOR_PALETTE

export function CategoriesClient({ categories: initial }: { categories?: Category[] } = {}) {
  const app = useApp()
  const [categories, setCategories] = useState<Category[]>(initial ?? app.categories)

  useEffect(() => {
    if (!initial && app.categories.length > 0) {
      setCategories(app.categories)
    }
  }, [initial, app.categories])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const { success, error: toastError, warning } = useToast()

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', color: CATEGORY_COLOR_PALETTE[0], icon: '' },
  })

  const selectedColor = watch('color')

  function openEdit(cat: Category) {
    setEditing(cat)
    reset({ name: cat.name, color: getCategoryColor(cat.name, cat.color), icon: cat.icon ?? '' })
    setShowForm(true)
  }

  function openNew() {
    setEditing(null)
    reset({ name: '', color: CATEGORY_COLOR_PALETTE[0], icon: '' })
    setShowForm(true)
  }

  async function onSubmit(values: CategoryFormValues) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (editing) {
      if (editing.is_default) {
        toastError('System categories cannot be modified')
        return
      }
      const { data, error } = await supabase
        .from('categories')
        .update({ name: values.name, color: values.color, icon: values.icon || null })
        .eq('id', editing.id)
        .select()
        .single()

      if (error) { toastError(error.message); return }
      setCategories((prev) => prev.map((c) => c.id === editing.id ? data : c))
      success('Category updated')
    } else {
      const { data, error } = await supabase
        .from('categories')
        .insert({ user_id: user.id, name: values.name, color: values.color, icon: values.icon || null })
        .select()
        .single()

      if (error) {
        toastError(error.message.includes('unique') ? 'A category with this name already exists' : error.message)
        return
      }
      setCategories((prev) => [...prev, data])
      success('Category created')
    }

    app.refreshCategories()
    setShowForm(false)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    const supabase = createClient()

    // Check if in use
    const { count } = await supabase
      .from('expenses')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', deleteTarget)

    if ((count ?? 0) > 0) {
      warning(`This category is used by ${count} expense(s). Expenses will become uncategorized.`)
    }

    const { error } = await supabase.from('categories').delete().eq('id', deleteTarget)
    setDeleting(false)
    setDeleteTarget(null)

    if (error) { toastError('Failed to delete category'); return }
    setCategories((prev) => prev.filter((c) => c.id !== deleteTarget))
    app.refreshCategories()
    success('Category deleted')
  }

  const userCategories = categories.filter((c) => !c.is_default)
  const systemCategories = categories.filter((c) => c.is_default)

  return (
    <div className="max-w-4xl mx-auto space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">Categories</h1>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">{categories.length} total categories available</p>
        </div>
        <Button onClick={openNew} leftIcon={<Plus className="w-4 h-4" />} id="categories-add">
          Add Category
        </Button>
      </div>

      {/* User categories */}
      {userCategories.length > 0 && (
        <div className="apple-card overflow-hidden">
          <div className="px-5 py-3 border-b border-[var(--color-border-secondary)]">
            <p className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">Custom Categories</p>
          </div>
          <ul className="divide-y divide-[var(--color-border-secondary)]" role="list">
            {userCategories.map((cat) => {
              const color = getCategoryColor(cat.name, cat.color)
              return (
                <li key={cat.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-[var(--color-surface-hover)] transition-colors">
                  <div
                    className="w-8 h-8 rounded-full border flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: `${color}15`,
                      borderColor: `${color}35`,
                    }}
                  >
                    <FolderOpen className="w-4 h-4" style={{ color }} />
                  </div>
                  <span className="flex-1 text-sm font-semibold text-[var(--color-text-primary)]">{cat.name}</span>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(cat)} className="btn-ghost p-2" aria-label={`Edit ${cat.name}`}>
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteTarget(cat.id)} className="btn-ghost p-2 text-red-500" aria-label={`Delete ${cat.name}`}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* System categories */}
      <div className="apple-card overflow-hidden">
        <div className="px-5 py-3 border-b border-[var(--color-border-secondary)] flex items-center justify-between">
          <p className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">System Defaults</p>
          <Lock className="w-3.5 h-3.5 text-[var(--color-text-tertiary)]" />
        </div>
        <ul className="divide-y divide-[var(--color-border-secondary)]" role="list">
          {systemCategories.map((cat) => {
            const color = getCategoryColor(cat.name, cat.color)
            return (
              <li key={cat.id} className="flex items-center gap-4 px-5 py-3 hover:bg-[var(--color-surface-hover)] transition-colors">
                <div
                  className="w-8 h-8 rounded-full border flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: `${color}15`,
                    borderColor: `${color}35`,
                  }}
                >
                  <FolderOpen className="w-4 h-4" style={{ color }} />
                </div>
                <span className="flex-1 text-sm font-medium text-[var(--color-text-primary)]">{cat.name}</span>
                <Lock className="w-3.5 h-3.5 text-[var(--color-text-tertiary)]" />
              </li>
            )
          })}
        </ul>
      </div>

      {/* Add/Edit dialog */}
      <Dialog
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editing ? 'Edit Category' : 'New Category'}
        size="sm"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <Input label="Name *" id="cat-name" placeholder="Category name" error={errors.name?.message} {...register('name')} />

          <div>
            <label className="form-label">Color</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {CATEGORY_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setValue('color', color)}
                  className={cn('w-7 h-7 rounded-full transition-transform hover:scale-110',
                    selectedColor === color && 'ring-2 ring-offset-2 ring-[var(--color-border-focus)] scale-110')}
                  style={{ background: color }}
                  aria-label={`Select color ${color}`}
                  aria-pressed={selectedColor === color}
                />
              ))}
              <input type="color" value={selectedColor || '#0066cc'} onChange={(e) => setValue('color', e.target.value)}
                className="w-7 h-7 rounded-full border-0 cursor-pointer" aria-label="Custom color" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
            <Button type="submit" loading={isSubmitting} className="flex-1">{editing ? 'Save' : 'Create'}</Button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete category?"
        description="Expenses with this category will become uncategorized. This cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        loading={deleting}
      />
    </div>
  )
}
