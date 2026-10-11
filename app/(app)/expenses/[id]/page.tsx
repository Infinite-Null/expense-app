import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ExpenseForm } from '@/components/expenses/ExpenseForm'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/dates'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Expense Details' }

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ExpenseDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: expense }, { data: categories }, { data: tags }, { data: profile }] =
    await Promise.all([
      supabase
        .from('expenses')
        .select(`
          *,
          categories:category_id ( id, name, icon, color ),
          expense_tags ( tags ( id, name, color ) )
        `)
        .eq('id', id)
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('categories')
        .select('*')
        .or(`user_id.eq.${user.id},user_id.is.null`)
        .order('name'),
      supabase.from('tags').select('*').eq('user_id', user.id).order('name'),
      supabase.from('profiles').select('preferred_currency').eq('id', user.id).single(),
    ])

  if (!expense) notFound()

  const expenseTags = (expense.expense_tags ?? [])
    .map((et: any) => et.tags)
    .filter(Boolean)

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
          categories={categories ?? []}
          tags={tags ?? []}
          expense={{ ...expense, tags: expenseTags }}
          defaultCurrency={profile?.preferred_currency ?? 'INR'}
        />
      </div>
    </div>
  )
}
