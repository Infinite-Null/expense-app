import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatCurrency, percentageChange, formatPercentage } from '@/lib/utils/currency'
import { getCurrentMonthRange, getPreviousMonthRange, formatDate } from '@/lib/utils/dates'
import { DashboardClient } from './DashboardClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { from: thisMonthFrom, to: thisMonthTo } = getCurrentMonthRange()
  const { from: prevMonthFrom, to: prevMonthTo } = getPreviousMonthRange()

  // Load profile for currency
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, preferred_currency')
    .eq('id', user.id)
    .single()

  const currency = profile?.preferred_currency ?? 'INR'

  // Current month expenses
  const { data: thisMonthExpenses } = await supabase
    .from('expenses')
    .select('amount, transaction_date, category_id')
    .eq('user_id', user.id)
    .gte('transaction_date', thisMonthFrom)
    .lte('transaction_date', thisMonthTo)
    .order('transaction_date', { ascending: false })

  // Previous month expenses
  const { data: prevMonthExpenses } = await supabase
    .from('expenses')
    .select('amount')
    .eq('user_id', user.id)
    .gte('transaction_date', prevMonthFrom)
    .lte('transaction_date', prevMonthTo)

  // Recent expenses (last 10)
  const { data: recentExpenses } = await supabase
    .from('expenses')
    .select(`
      id, title, amount, currency, transaction_date, merchant,
      categories:category_id ( id, name, icon, color )
    `)
    .eq('user_id', user.id)
    .order('transaction_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(10)

  // All-time largest expense
  const { data: largestExpense } = await supabase
    .from('expenses')
    .select('title, amount')
    .eq('user_id', user.id)
    .order('amount', { ascending: false })
    .limit(1)
    .single()

  // Category breakdown for this month
  const { data: categoryData } = await supabase
    .from('expenses')
    .select(`
      amount,
      categories:category_id ( id, name, color )
    `)
    .eq('user_id', user.id)
    .gte('transaction_date', thisMonthFrom)
    .lte('transaction_date', thisMonthTo)

  // Compute aggregates
  const thisMonthTotal = (thisMonthExpenses ?? []).reduce((s, e) => s + Number(e.amount), 0)
  const prevMonthTotal = (prevMonthExpenses ?? []).reduce((s, e) => s + Number(e.amount), 0)
  const monthChange = percentageChange(thisMonthTotal, prevMonthTotal)

  const daysInMonth = new Date().getDate()
  const avgDaily = daysInMonth > 0 ? Math.round((thisMonthTotal / daysInMonth) * 100) / 100 : 0

  // Category breakdown
  const categoryMap: Record<string, { name: string; color: string | null; total: number }> = {}
  for (const expense of categoryData ?? []) {
    const cat = expense.categories as { id: string; name: string; color: string | null } | null
    const key = cat?.name ?? 'Uncategorized'
    const color = cat?.color ?? '#B0BEC5'
    if (!categoryMap[key]) categoryMap[key] = { name: key, color, total: 0 }
    categoryMap[key].total += Number(expense.amount)
  }

  const categoryBreakdown = Object.values(categoryMap)
    .sort((a, b) => b.total - a.total)
    .slice(0, 6)

  const mostUsedCategory = categoryBreakdown[0]?.name ?? null

  return (
    <DashboardClient
      displayName={profile?.display_name}
      currency={currency}
      thisMonthTotal={thisMonthTotal}
      prevMonthTotal={prevMonthTotal}
      monthChange={monthChange}
      avgDaily={avgDaily}
      transactionCount={thisMonthExpenses?.length ?? 0}
      largestExpense={largestExpense ? { title: largestExpense.title, amount: Number(largestExpense.amount) } : null}
      mostUsedCategory={mostUsedCategory}
      recentExpenses={(recentExpenses ?? []).map((e) => ({
        id: e.id,
        title: e.title,
        amount: Number(e.amount),
        currency: e.currency,
        transaction_date: e.transaction_date,
        merchant: e.merchant,
        category: e.categories as { name: string; color: string | null } | null,
      }))}
      categoryBreakdown={categoryBreakdown}
    />
  )
}
