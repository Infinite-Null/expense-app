'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useApp } from '@/components/providers/AppProvider'
import { ExpenseForm } from '@/components/expenses/ExpenseForm'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/dates'
import type { Expense, Tag } from '@/lib/types/database'

export function ExpenseDetailClient({ id }: { id: string }) {
  const router = useRouter()
  const { categories, tags, currency } = useApp()
  const [expense, setExpense] = useState<(Expense & { tags?: Tag[] }) | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          categories:category_id ( id, name, icon, color ),
          expense_tags ( tags ( id, name, color ) )
        `)
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (!mounted) return
      if (error || !data) {
        router.push('/expenses')
        return
      }

      const expenseTags = (data.expense_tags ?? [])
        .map((et: any) => et.tags)
        .filter(Boolean)

      setExpense({ ...data, tags: expenseTags })
      setLoading(false)
    }

    load()
    return () => {
      mounted = false
    }
  }, [id, router])

  if (loading || !expense) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 page-enter">
        <div className="space-y-2">
          <div className="h-7 w-48 skeleton rounded-lg" />
          <div className="h-4 w-32 skeleton rounded-md" />
        </div>
        <div className="apple-card p-6 sm:p-8 space-y-4">
          <div className="h-10 skeleton rounded-xl" />
          <div className="h-10 skeleton rounded-xl" />
          <div className="h-24 skeleton rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 page-enter">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight overflow-clip">
          {expense.title}
        </h1>
        <p className="text-xs text-[var(--color-text-tertiary)] mt-1 tabular-nums">
          {formatCurrency(expense.amount, expense.currency)} &middot; {formatDate(expense.transaction_date)}
        </p>
      </div>

      <div className="apple-card p-6 sm:p-8">
        <ExpenseForm
          categories={categories}
          tags={tags}
          expense={expense}
          defaultCurrency={currency}
        />
      </div>
    </div>
  )
}
