import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ExpenseForm } from '@/components/expenses/ExpenseForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Add Expense' }

export default async function NewExpensePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: categories }, { data: tags }, { data: profile }] = await Promise.all([
    supabase
      .from('categories')
      .select('*')
      .or(`user_id.eq.${user.id},user_id.is.null`)
      .order('name'),
    supabase.from('tags').select('*').eq('user_id', user.id).order('name'),
    supabase.from('profiles').select('preferred_currency').eq('id', user.id).single(),
  ])

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
        <ExpenseForm
          categories={categories ?? []}
          tags={tags ?? []}
          defaultCurrency={profile?.preferred_currency ?? 'INR'}
        />
      </div>
    </div>
  )
}
