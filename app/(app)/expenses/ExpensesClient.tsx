'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Search,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Edit2,
  Trash2,
  Copy,
  MoreHorizontal,
  Receipt,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/dates'
import { cn } from '@/lib/utils/cn'
import { ConfirmDialog } from '@/components/ui/Dialog'
import { useToast } from '@/components/ui/Toaster'
import type { ExpenseWithRelations, Category, Tag } from '@/lib/types/database'

const PAGE_SIZE = 20

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  credit_card: 'Credit Card',
  debit_card: 'Debit Card',
  upi: 'UPI',
  net_banking: 'Net Banking',
  wallet: 'Wallet',
  other: 'Other',
}

type SortField = 'transaction_date' | 'amount' | 'title'
type SortDir = 'asc' | 'desc'

interface Filters {
  search: string
  categoryId: string
  tagId: string
  paymentMethod: string
  dateFrom: string
  dateTo: string
}

interface ExpensesClientProps {
  categories: Pick<Category, 'id' | 'name' | 'color'>[]
  tags: Pick<Tag, 'id' | 'name' | 'color'>[]
  currency: string
}

export function ExpensesClient({ categories, tags, currency }: ExpensesClientProps) {
  const router = useRouter()
  const { success, error: toastError } = useToast()

  const [expenses, setExpenses] = useState<ExpenseWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)

  const [filters, setFilters] = useState<Filters>({
    search: '',
    categoryId: '',
    tagId: '',
    paymentMethod: '',
    dateFrom: '',
    dateTo: '',
  })
  const [showFilters, setShowFilters] = useState(false)
  const [sortField, setSortField] = useState<SortField>('transaction_date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const hasActiveFilters =
    !!filters.search ||
    !!filters.categoryId ||
    !!filters.tagId ||
    !!filters.paymentMethod ||
    !!filters.dateFrom ||
    !!filters.dateTo

  const fetchExpenses = useCallback(
    async (reset = false) => {
      setLoading(true)
      const currentPage = reset ? 0 : page

      try {
        const supabase = createClient()
        const from = currentPage * PAGE_SIZE
        const to = from + PAGE_SIZE - 1

        let query = supabase
          .from('expenses')
          .select(
            `
            id, title, description, amount, currency, merchant, payment_method,
            transaction_date, is_recurring, notes, created_at,
            categories:category_id ( id, name, icon, color ),
            expense_tags ( tags ( id, name, color ) )
          `,
            { count: 'exact' }
          )
          .order(sortField, { ascending: sortDir === 'asc' })
          .range(from, to)

        if (filters.search) {
          query = query.or(
            `title.ilike.%${filters.search}%,merchant.ilike.%${filters.search}%,description.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`
          )
        }
        if (filters.categoryId) {
          query = query.eq('category_id', filters.categoryId)
        }
        if (filters.paymentMethod) {
          query = query.eq('payment_method', filters.paymentMethod as any)
        }
        if (filters.dateFrom) {
          query = query.gte('transaction_date', filters.dateFrom)
        }
        if (filters.dateTo) {
          query = query.lte('transaction_date', filters.dateTo)
        }

        const { data, count, error } = await query

        if (error) throw error

        // Flatten tags
        const mapped = (data ?? []).map((e: any) => ({
          ...e,
          category: e.categories,
          tags: (e.expense_tags ?? []).map((et: any) => et.tags).filter(Boolean),
        }))

        // Client-side tag filter (since join filter is complex)
        const filtered = filters.tagId
          ? mapped.filter((e) => e.tags.some((t: Tag) => t.id === filters.tagId))
          : mapped

        if (reset) {
          setExpenses(filtered)
        } else {
          setExpenses((prev) => [...prev, ...filtered])
        }

        setTotal(count ?? 0)
        setHasMore(from + PAGE_SIZE < (count ?? 0))
        if (reset) setPage(0)
      } catch (err) {
        toastError('Failed to load expenses')
      } finally {
        setLoading(false)
      }
    },
    [page, filters, sortField, sortDir, toastError]
  )

  // Refetch when filters/sort change
  useEffect(() => {
    setPage(0)
    fetchExpenses(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, sortField, sortDir])

  function handleSearchChange(val: string) {
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setFilters((f) => ({ ...f, search: val }))
    }, 300)
  }

  function clearFilters() {
    setFilters({
      search: '',
      categoryId: '',
      tagId: '',
      paymentMethod: '',
      dateFrom: '',
      dateTo: '',
    })
  }

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    const supabase = createClient()

    const { error } = await supabase.from('expenses').delete().eq('id', deleteTarget)
    setDeleting(false)
    setDeleteTarget(null)

    if (error) {
      toastError('Failed to delete expense')
    } else {
      success('Expense deleted')
      fetchExpenses(true)
    }
  }

  async function handleDuplicate(expense: ExpenseWithRelations) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: newExpense, error } = await supabase
      .from('expenses')
      .insert({
        user_id: user.id,
        title: `${expense.title} (copy)`,
        description: expense.description,
        amount: expense.amount,
        currency: expense.currency,
        category_id: expense.category_id,
        merchant: expense.merchant,
        payment_method: expense.payment_method,
        transaction_date: expense.transaction_date,
        is_recurring: expense.is_recurring,
        notes: expense.notes,
      })
      .select('id')
      .single()

    if (error || !newExpense) {
      toastError('Failed to duplicate expense')
      return
    }

    // Duplicate tags
    if (expense.tags.length > 0) {
      await supabase.from('expense_tags').insert(
        expense.tags.map((t) => ({ expense_id: newExpense.id, tag_id: t.id }))
      )
    }

    success('Expense duplicated')
    fetchExpenses(true)
  }

  function SortButton({ field, label }: { field: SortField; label: string }) {
    const isActive = sortField === field
    return (
      <button
        onClick={() => toggleSort(field)}
        className={cn(
          'flex items-center gap-1 text-xs font-medium transition-colors',
          isActive
            ? 'text-[var(--color-accent-text)]'
            : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'
        )}
      >
        {label}
        {isActive ? (
          sortDir === 'desc' ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5" />
          )
        ) : (
          <ArrowUpDown className="w-3.5 h-3.5" />
        )}
      </button>
    )
  }

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">
            Expenses
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
            {loading ? '…' : `${total.toLocaleString()} transaction${total !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Link href="/expenses/new" className="btn-primary" id="expenses-add-new">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Expense</span>
        </Link>
      </div>

      {/* Search & filter bar */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-tertiary)]" />
            <input
              type="search"
              placeholder="Search by name, merchant, or notes…"
              className="input-base pl-10 pr-4"
              onChange={(e) => handleSearchChange(e.target.value)}
              id="expenses-search"
              aria-label="Search expenses"
            />
          </div>
          <button
            onClick={() => setShowFilters((s) => !s)}
            className={cn(
              'btn-secondary flex items-center gap-2',
              hasActiveFilters && 'border-[var(--color-accent)] text-[var(--color-accent-text)]'
            )}
            id="expenses-filter-toggle"
            aria-expanded={showFilters}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-[var(--color-accent)]" />
            )}
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="card p-4 grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="form-label">Category</label>
              <select
                className="input-base"
                value={filters.categoryId}
                onChange={(e) => setFilters((f) => ({ ...f, categoryId: e.target.value }))}
                id="filter-category"
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Tag</label>
              <select
                className="input-base"
                value={filters.tagId}
                onChange={(e) => setFilters((f) => ({ ...f, tagId: e.target.value }))}
                id="filter-tag"
              >
                <option value="">All tags</option>
                {tags.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Payment Method</label>
              <select
                className="input-base"
                value={filters.paymentMethod}
                onChange={(e) => setFilters((f) => ({ ...f, paymentMethod: e.target.value }))}
                id="filter-payment-method"
              >
                <option value="">All methods</option>
                {Object.entries(PAYMENT_METHOD_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">From date</label>
              <input
                type="date"
                className="input-base"
                value={filters.dateFrom}
                onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
                id="filter-date-from"
              />
            </div>

            <div>
              <label className="form-label">To date</label>
              <input
                type="date"
                className="input-base"
                value={filters.dateTo}
                onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
                id="filter-date-to"
              />
            </div>

            {hasActiveFilters && (
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="btn-ghost text-sm text-[var(--color-text-secondary)] gap-1.5"
                  id="filter-clear"
                >
                  <X className="w-4 h-4" />
                  Clear filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Expenses list */}
      <div className="card overflow-hidden">
        {/* Table header (desktop) */}
        <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-3 border-b border-[var(--color-border-secondary)]">
          <SortButton field="title" label="Expense" />
          <SortButton field="transaction_date" label="Date" />
          <span className="text-xs text-[var(--color-text-tertiary)] font-medium">Category</span>
          <span className="text-xs text-[var(--color-text-tertiary)] font-medium">Method</span>
          <SortButton field="amount" label="Amount" />
        </div>

        {loading && expenses.length === 0 ? (
          <div className="divide-y divide-[var(--color-border-secondary)]">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="px-5 py-4 flex items-center gap-4">
                <div className="skeleton w-9 h-9 rounded-[var(--radius-md)]" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-40 rounded" />
                  <div className="skeleton h-3 w-24 rounded" />
                </div>
                <div className="skeleton h-4 w-20 rounded" />
              </div>
            ))}
          </div>
        ) : expenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ background: 'var(--color-surface-tertiary)' }}
            >
              <Receipt className="w-8 h-8 text-[var(--color-text-tertiary)]" />
            </div>
            <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
              {hasActiveFilters ? 'No matching expenses' : 'No expenses yet'}
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1 max-w-xs">
              {hasActiveFilters
                ? 'Try adjusting your filters or search query.'
                : 'Start tracking your spending by adding your first expense.'}
            </p>
            {hasActiveFilters ? (
              <button onClick={clearFilters} className="mt-4 btn-secondary text-sm">
                Clear filters
              </button>
            ) : (
              <Link href="/expenses/new" className="mt-4 btn-primary text-sm">
                <Plus className="w-4 h-4" />
                Add expense
              </Link>
            )}
          </div>
        ) : (
          <ul role="list" className="divide-y divide-[var(--color-border-secondary)]">
            {expenses.map((expense) => (
              <li key={expense.id} className="group relative">
                {/* Mobile layout */}
                <div className="md:hidden px-5 py-4">
                  <Link href={`/expenses/${expense.id}`} className="block">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)] flex items-center justify-center flex-shrink-0">
                          <Receipt className="w-4 h-4 text-[var(--color-text-secondary)]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                            {expense.title}
                          </p>
                          <p className="text-xs text-[var(--color-text-tertiary)]">
                            {formatDate(expense.transaction_date, 'dd MMM')} ·{' '}
                            {expense.category?.name ?? 'Uncategorized'}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-[var(--color-text-primary)] flex-shrink-0 tabular-nums">
                        {formatCurrency(expense.amount, expense.currency)}
                      </p>
                    </div>
                  </Link>
                </div>

                {/* Desktop layout */}
                <Link
                  href={`/expenses/${expense.id}`}
                  className="hidden md:grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center px-5 py-4 hover:bg-[var(--color-surface-hover)] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)] flex items-center justify-center flex-shrink-0">
                      <Receipt className="w-4 h-4 text-[var(--color-text-secondary)]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                        {expense.title}
                      </p>
                      {expense.merchant && (
                        <p className="text-xs text-[var(--color-text-tertiary)] truncate">
                          {expense.merchant}
                        </p>
                      )}
                      {expense.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {expense.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag.id}
                              className="badge text-[0.625rem] px-1.5 py-0 bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] border border-[var(--color-border-primary)]"
                            >
                              #{tag.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <span className="text-sm text-[var(--color-text-secondary)] text-right whitespace-nowrap">
                    {formatDate(expense.transaction_date, 'dd MMM yyyy')}
                  </span>

                  <span className="text-sm text-[var(--color-text-secondary)]">
                    {expense.category?.name ?? '—'}
                  </span>

                  <span className="text-sm text-[var(--color-text-tertiary)]">
                    {expense.payment_method
                      ? PAYMENT_METHOD_LABELS[expense.payment_method]
                      : '—'}
                  </span>

                  <span className="text-sm font-bold text-[var(--color-text-primary)] text-right tabular-nums">
                    {formatCurrency(expense.amount, expense.currency)}
                  </span>
                </Link>

                {/* Action menu */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        setOpenMenu(openMenu === expense.id ? null : expense.id)
                      }}
                      className="btn-ghost p-2 rounded-[var(--radius-md)]"
                      aria-label="More actions"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {openMenu === expense.id && (
                      <div
                        className="absolute right-0 top-full mt-1 w-44 card py-1 z-20"
                        style={{ boxShadow: 'var(--shadow-lg)' }}
                      >
                        <Link
                          href={`/expenses/${expense.id}`}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors"
                          onClick={() => setOpenMenu(null)}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Edit
                        </Link>
                        <button
                          onClick={() => {
                            handleDuplicate(expense)
                            setOpenMenu(null)
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          Duplicate
                        </button>
                        <div className="divider my-1" />
                        <button
                          onClick={() => {
                            setDeleteTarget(expense.id)
                            setOpenMenu(null)
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--color-error-text)] hover:bg-[var(--color-error-bg)] transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Load more */}
        {hasMore && (
          <div className="px-5 py-4 border-t border-[var(--color-border-secondary)]">
            <button
              onClick={() => {
                setPage((p) => p + 1)
                fetchExpenses(false)
              }}
              disabled={loading}
              className="btn-secondary w-full text-sm"
              id="expenses-load-more"
            >
              {loading ? 'Loading…' : 'Load more'}
            </button>
          </div>
        )}
      </div>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete expense?"
        description="This action cannot be undone. The expense will be permanently deleted."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        loading={deleting}
      />

      {/* Close menus on outside click */}
      {openMenu && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setOpenMenu(null)}
          aria-hidden
        />
      )}
    </div>
  )
}
