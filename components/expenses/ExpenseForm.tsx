'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Plus, Tag as TagIcon } from 'lucide-react'
import { expenseSchema, type ExpenseFormValues } from '@/lib/validations/schemas'
import { createClient } from '@/lib/supabase/client'
import { Input, Textarea, Select } from '@/components/ui/FormFields'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toaster'
import { formatDateForInput } from '@/lib/utils/dates'
import type { Category, Tag, Expense } from '@/lib/types/database'
import { cn } from '@/lib/utils/cn'

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'AED', 'SGD', 'CAD', 'AUD']
const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'debit_card', label: 'Debit Card' },
  { value: 'upi', label: 'UPI' },
  { value: 'net_banking', label: 'Net Banking' },
  { value: 'wallet', label: 'Wallet' },
  { value: 'other', label: 'Other' },
]

interface ExpenseFormProps {
  categories: Category[]
  tags: Tag[]
  expense?: Expense & { tags?: Tag[] }
  defaultCurrency?: string
}

export function ExpenseForm({
  categories,
  tags: allTags,
  expense,
  defaultCurrency = 'INR',
}: ExpenseFormProps) {
  const router = useRouter()
  const { success, error: toastError } = useToast()

  const [selectedTags, setSelectedTags] = useState<Tag[]>(expense?.tags ?? [])
  const [newTagName, setNewTagName] = useState('')
  const [creatingTag, setCreatingTag] = useState(false)

  const isEditing = !!expense

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema) as any,
    defaultValues: {
      title: expense?.title ?? '',
      amount: expense?.amount ? String(expense.amount) : '',
      currency: expense?.currency ?? defaultCurrency,
      category_id: expense?.category_id ?? null,
      merchant: expense?.merchant ?? '',
      payment_method: expense?.payment_method ?? null,
      transaction_date: expense?.transaction_date ?? formatDateForInput(new Date()),
      description: expense?.description ?? '',
      notes: expense?.notes ?? '',
      is_recurring: expense?.is_recurring ?? false,
      tag_ids: expense?.tags?.map((t) => t.id) ?? [],
    },
  })

  function toggleTag(tag: Tag) {
    setSelectedTags((prev) => {
      const exists = prev.find((t) => t.id === tag.id)
      return exists ? prev.filter((t) => t.id !== tag.id) : [...prev, tag]
    })
  }

  async function handleCreateTag() {
    if (!newTagName.trim()) return
    setCreatingTag(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const normalizedName = newTagName.trim().toLowerCase()
    const { data, error } = await supabase
      .from('tags')
      .insert({ user_id: user.id, name: normalizedName, color: '#6B7280' })
      .select()
      .single()

    setCreatingTag(false)
    if (error) {
      toastError(error.message.includes('unique') ? 'Tag already exists' : 'Failed to create tag')
      return
    }
    if (data) {
      allTags.push(data)
      setSelectedTags((prev) => [...prev, data])
      setNewTagName('')
    }
  }

  async function onSubmit(values: ExpenseFormValues) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const payload = {
      user_id: user.id,
      title: values.title,
      description: values.description || null,
      amount: parseFloat(values.amount),
      currency: values.currency,
      category_id: values.category_id || null,
      merchant: values.merchant || null,
      payment_method: values.payment_method || null,
      transaction_date: values.transaction_date,
      is_recurring: values.is_recurring,
      notes: values.notes || null,
    }

    let expenseId = expense?.id

    if (isEditing) {
      const { error } = await supabase
        .from('expenses')
        .update(payload)
        .eq('id', expense!.id)

      if (error) {
        toastError('Failed to update expense')
        return
      }
    } else {
      const { data, error } = await supabase
        .from('expenses')
        .insert(payload)
        .select('id')
        .single()

      if (error || !data) {
        toastError('Failed to create expense')
        return
      }
      expenseId = data.id
    }

    // Sync tags
    if (expenseId) {
      // Delete existing tags
      await supabase.from('expense_tags').delete().eq('expense_id', expenseId)

      // Insert new tags
      if (selectedTags.length > 0) {
        await supabase.from('expense_tags').insert(
          selectedTags.map((t) => ({ expense_id: expenseId!, tag_id: t.id }))
        )
      }
    }

    success(isEditing ? 'Expense updated' : 'Expense added')
    router.push('/expenses')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {/* Amount + Currency */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <Input
            label="Amount *"
            type="number"
            id="expense-amount"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            error={errors.amount?.message}
            {...register('amount')}
          />
        </div>
        <div>
          <label htmlFor="expense-currency" className="form-label">Currency</label>
          <select id="expense-currency" className="input-base" {...register('currency')}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Title */}
      <Input
        label="Title *"
        id="expense-title"
        placeholder="What did you spend on?"
        error={errors.title?.message}
        {...register('title')}
      />

      {/* Category + Date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
        <div>
          <label htmlFor="expense-category" className="form-label">Category</label>
          <select id="expense-category" className="input-base" {...register('category_id')}>
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <Input
          label="Date *"
          type="date"
          id="expense-date"
          error={errors.transaction_date?.message}
          {...register('transaction_date')}
        />
      </div>

      {/* Merchant + Payment method */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
        <Input
          label="Merchant / Payee"
          id="expense-merchant"
          placeholder="Where did you pay?"
          {...register('merchant')}
        />
        <div>
          <label htmlFor="expense-payment" className="form-label">Payment Method</label>
          <select id="expense-payment" className="input-base" {...register('payment_method')}>
            <option value="">Select method</option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Description */}
      <Textarea
        label="Description"
        id="expense-description"
        placeholder="Brief description (optional)"
        rows={2}
        {...register('description')}
      />

      {/* Notes */}
      <Textarea
        label="Notes"
        id="expense-notes"
        placeholder="Additional notes (optional)"
        rows={2}
        {...register('notes')}
      />

      {/* Tags */}
      <div>
        <label className="form-label flex items-center gap-1.5">
          <TagIcon className="w-3.5 h-3.5" />
          Tags
        </label>

        <div className="flex flex-wrap gap-2 mb-3">
          {allTags.map((tag) => {
            const selected = selectedTags.some((t) => t.id === tag.id)
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag)}
                className={cn(
                  'badge text-xs px-2.5 py-1 transition-all cursor-pointer select-none rounded-full border',
                  selected
                    ? 'bg-black text-white dark:bg-white dark:text-black border-transparent font-semibold shadow-xs'
                    : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] border-[var(--color-border-primary)] hover:border-[var(--color-border-hover)]'
                )}
                aria-pressed={selected}
              >
                #{tag.name}
              </button>
            )
          })}
        </div>

        {/* Create tag inline */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="New tag…"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleCreateTag())}
            className="input-base flex-1 text-sm py-2"
            maxLength={30}
            id="new-tag-input"
            aria-label="New tag name"
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            loading={creatingTag}
            onClick={handleCreateTag}
            disabled={!newTagName.trim()}
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </Button>
        </div>
      </div>

      {/* Recurring toggle */}
      <div className="flex items-center gap-3">
        <Controller
          name="is_recurring"
          control={control}
          render={({ field }) => (
            <button
              type="button"
              role="switch"
              aria-checked={field.value}
              onClick={() => field.onChange(!field.value)}
              className={cn(
                'relative w-11 h-6 rounded-full transition-colors duration-200',
                field.value ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-surface-tertiary)]'
              )}
              id="expense-recurring"
            >
              <span
                className={cn(
                  'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200',
                  field.value && 'translate-x-5'
                )}
              />
            </button>
          )}
        />
        <label
          htmlFor="expense-recurring"
          className="text-sm text-[var(--color-text-primary)] cursor-pointer select-none"
        >
          Recurring expense
        </label>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 sm:pt-6">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
          className="flex-1 h-11 text-sm font-medium"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          loading={isSubmitting}
          className="flex-1 h-11 text-sm font-semibold"
          id="expense-submit"
        >
          {isEditing ? 'Update Expense' : 'Add Expense'}
        </Button>
      </div>
    </form>
  )
}
