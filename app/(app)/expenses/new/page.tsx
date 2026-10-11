'use client'

import { ExpenseForm } from '@/components/expenses/ExpenseForm'
import { useApp } from '@/components/providers/AppProvider'

export default function NewExpensePage() {
  const { categories, tags, currency, loading } = useApp()

  return (
    <div className="max-w-2xl mx-auto space-y-6 page-enter">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">
          Add Expense
        </h1>
        <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
          Record a new transaction to your account
        </p>
      </div>

      <div className="apple-card p-6 sm:p-8">
        {loading && categories.length === 0 ? (
          <div className="space-y-4 py-6">
            <div className="h-10 skeleton rounded-xl" />
            <div className="h-10 skeleton rounded-xl" />
            <div className="h-24 skeleton rounded-xl" />
          </div>
        ) : (
          <ExpenseForm
            categories={categories}
            tags={tags}
            defaultCurrency={currency}
          />
        )}
      </div>
    </div>
  )
}
