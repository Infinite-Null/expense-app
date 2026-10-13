'use client'

import Link from 'next/link'
import {
  TrendingDown,
  TrendingUp,
  Plus,
  ArrowRight,
  Calendar,
  ChevronRight,
  ArrowUpRight,
  CreditCard,
} from 'lucide-react'
import { formatCurrency, formatCurrencyCompact, formatPercentage } from '@/lib/utils/currency'
import { formatShortDate } from '@/lib/utils/dates'
import { cn } from '@/lib/utils/cn'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { useTheme } from '@/components/providers/ThemeProvider'
import { getCategoryColor } from '@/lib/utils/colors'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useApp } from '@/components/providers/AppProvider'
import { getCurrentMonthRange, getPreviousMonthRange } from '@/lib/utils/dates'
import { percentageChange } from '@/lib/utils/currency'

interface DashboardData {
  thisMonthTotal: number
  prevMonthTotal: number
  monthChange: number | null
  avgDaily: number
  transactionCount: number
  largestExpense: { title: string; amount: number } | null
  mostUsedCategory: string | null
  recentExpenses: {
    id: string
    title: string
    amount: number
    currency: string
    transaction_date: string
    merchant: string | null
    category: { name: string; color: string | null } | null
  }[]
  categoryBreakdown: { name: string; color: string | null; total: number }[]
}

let cachedDashboardData: DashboardData | null = null

async function loadDashboardMetrics(
  userId: string,
  supabase: ReturnType<typeof createClient>,
  spaceId?: string | null,
  isDefaultSpace?: boolean
): Promise<DashboardData> {
  const { from: thisMonthFrom, to: thisMonthTo } = getCurrentMonthRange()
  const { from: prevMonthFrom, to: prevMonthTo } = getPreviousMonthRange()

  let qThisMonth = supabase
    .from('expenses')
    .select('amount, transaction_date, category_id')
    .eq('user_id', userId)
    .gte('transaction_date', thisMonthFrom)
    .lte('transaction_date', thisMonthTo)
    .order('transaction_date', { ascending: false })

  let qPrevMonth = supabase
    .from('expenses')
    .select('amount')
    .eq('user_id', userId)
    .gte('transaction_date', prevMonthFrom)
    .lte('transaction_date', prevMonthTo)

  let qRecent = supabase
    .from('expenses')
    .select(`
      id, title, amount, currency, transaction_date, merchant,
      categories:category_id ( id, name, icon, color )
    `)
    .eq('user_id', userId)
    .order('transaction_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(10)

  let qLargest = supabase
    .from('expenses')
    .select('title, amount')
    .eq('user_id', userId)
    .order('amount', { ascending: false })
    .limit(1)

  let qCategory = supabase
    .from('expenses')
    .select(`
      amount,
      categories:category_id ( id, name, color )
    `)
    .eq('user_id', userId)
    .gte('transaction_date', thisMonthFrom)
    .lte('transaction_date', thisMonthTo)

  if (spaceId && spaceId !== 'default-space') {
    if (isDefaultSpace) {
      qThisMonth = qThisMonth.or(`space_id.eq.${spaceId},space_id.is.null`)
      qPrevMonth = qPrevMonth.or(`space_id.eq.${spaceId},space_id.is.null`)
      qRecent = qRecent.or(`space_id.eq.${spaceId},space_id.is.null`)
      qLargest = qLargest.or(`space_id.eq.${spaceId},space_id.is.null`)
      qCategory = qCategory.or(`space_id.eq.${spaceId},space_id.is.null`)
    } else {
      qThisMonth = qThisMonth.eq('space_id', spaceId)
      qPrevMonth = qPrevMonth.eq('space_id', spaceId)
      qRecent = qRecent.eq('space_id', spaceId)
      qLargest = qLargest.eq('space_id', spaceId)
      qCategory = qCategory.eq('space_id', spaceId)
    }
  }

  const [
    { data: thisMonthExpenses },
    { data: prevMonthExpenses },
    { data: recentExpenses },
    { data: largestExpense },
    { data: categoryData },
  ] = await Promise.all([
    qThisMonth,
    qPrevMonth,
    qRecent,
    qLargest.maybeSingle(),
    qCategory,
  ])

  const thisMonthTotal = (thisMonthExpenses ?? []).reduce((s, e) => s + Number(e.amount), 0)
  const prevMonthTotal = (prevMonthExpenses ?? []).reduce((s, e) => s + Number(e.amount), 0)
  const monthChange = percentageChange(thisMonthTotal, prevMonthTotal)

  const daysInMonth = new Date().getDate()
  const avgDaily = daysInMonth > 0 ? Math.round((thisMonthTotal / daysInMonth) * 100) / 100 : 0

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

  return {
    thisMonthTotal,
    prevMonthTotal,
    monthChange,
    avgDaily,
    transactionCount: thisMonthExpenses?.length ?? 0,
    largestExpense: largestExpense ? { title: largestExpense.title, amount: Number(largestExpense.amount) } : null,
    mostUsedCategory,
    recentExpenses: (recentExpenses ?? []).map((e: any) => ({
      id: e.id,
      title: e.title,
      amount: Number(e.amount),
      currency: e.currency,
      transaction_date: e.transaction_date,
      merchant: e.merchant,
      category: e.categories as { name: string; color: string | null } | null,
    })),
    categoryBreakdown,
  }
}

interface DashboardClientProps {
  displayName?: string | null | undefined
  currency?: string
  thisMonthTotal?: number
  prevMonthTotal?: number
  monthChange?: number | null
  avgDaily?: number
  transactionCount?: number
  largestExpense?: { title: string; amount: number } | null
  mostUsedCategory?: string | null
  recentExpenses?: {
    id: string
    title: string
    amount: number
    currency: string
    transaction_date: string
    merchant: string | null
    category: { name: string; color: string | null } | null
  }[]
  categoryBreakdown?: { name: string; color: string | null; total: number }[]
}

function MetricTile({
  label,
  value,
  sub,
}: {
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="apple-card p-4 sm:p-5 flex flex-col justify-between">
      <p className="text-xs font-medium text-[var(--color-text-secondary)] tracking-tight">
        {label}
      </p>
      <div className="mt-3">
        <p className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)] tracking-tight tabular-nums">
          {value}
        </p>
        {sub && (
          <p className="text-[0.6875rem] text-[var(--color-text-tertiary)] mt-1 truncate">
            {sub}
          </p>
        )}
      </div>
    </div>
  )
}

export function DashboardClient({
  displayName: propDisplayName,
  currency: propCurrency,
  thisMonthTotal: propThisMonthTotal,
  prevMonthTotal: propPrevMonthTotal,
  monthChange: propMonthChange,
  avgDaily: propAvgDaily,
  transactionCount: propTransactionCount,
  largestExpense: propLargestExpense,
  mostUsedCategory: propMostUsedCategory,
  recentExpenses: propRecentExpenses,
  categoryBreakdown: propCategoryBreakdown,
}: Partial<DashboardClientProps> = {}) {
  const { resolvedTheme } = useTheme()
  const { user, profile, currentSpace, isAllSpaces, isSwitchingSpace } = useApp()

  const displayName = propDisplayName ?? profile?.display_name
  const currency = propCurrency ?? profile?.preferred_currency ?? 'INR'

  const [data, setData] = useState<DashboardData | null>(() => {
    if (propThisMonthTotal !== undefined) {
      return {
        thisMonthTotal: propThisMonthTotal,
        prevMonthTotal: propPrevMonthTotal ?? 0,
        monthChange: propMonthChange ?? null,
        avgDaily: propAvgDaily ?? 0,
        transactionCount: propTransactionCount ?? 0,
        largestExpense: propLargestExpense ?? null,
        mostUsedCategory: propMostUsedCategory ?? null,
        recentExpenses: propRecentExpenses ?? [],
        categoryBreakdown: propCategoryBreakdown ?? [],
      }
    }
    return cachedDashboardData
  })

  const [loading, setLoading] = useState(
    propThisMonthTotal === undefined && !cachedDashboardData
  )

  const loadData = useCallback(async () => {
    if (propThisMonthTotal !== undefined) return
    setLoading(true)
    const startTime = Date.now()
    const supabase = createClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) return

    const spaceId = isAllSpaces ? null : currentSpace?.id
    const isDefault = currentSpace?.is_default ?? false

    const res = await loadDashboardMetrics(currentUser.id, supabase, spaceId, isDefault)
    const elapsed = Date.now() - startTime
    if (elapsed < 350) {
      await new Promise((resolve) => setTimeout(resolve, 350 - elapsed))
    }
    setData(res)
    setLoading(false)
  }, [propThisMonthTotal, currentSpace?.id, currentSpace?.is_default, isAllSpaces])

  useEffect(() => {
    setLoading(true)
    loadData()
  }, [loadData])

  const isPageLoading = loading || isSwitchingSpace

  if (isPageLoading) {
    return (
      <div className="flex flex-col gap-6 sm:gap-8 page-enter animate-in fade-in duration-200">
        <div className="flex flex-col gap-2">
          <div className="h-4 w-40 skeleton rounded-md" />
          <div className="h-8 w-56 skeleton rounded-md mt-1" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="apple-card p-4 sm:p-5 h-28 flex flex-col justify-between">
              <div className="h-3 w-20 skeleton rounded" />
              <div>
                <div className="h-7 w-28 skeleton rounded-md" />
                <div className="h-2.5 w-16 skeleton rounded mt-2" />
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="lg:col-span-2 apple-card p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div className="h-5 w-36 skeleton rounded" />
              <div className="h-4 w-20 skeleton rounded" />
            </div>
            <div className="divide-y divide-[var(--color-border-secondary)]">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full skeleton" />
                    <div className="space-y-1.5">
                      <div className="h-3.5 w-32 skeleton rounded" />
                      <div className="h-2.5 w-20 skeleton rounded" />
                    </div>
                  </div>
                  <div className="h-4 w-16 skeleton rounded" />
                </div>
              ))}
            </div>
          </div>
          <div className="apple-card p-6 flex flex-col justify-between">
            <div className="h-5 w-32 skeleton rounded mb-4" />
            <div className="w-44 h-44 rounded-full skeleton mx-auto my-auto" />
            <div className="space-y-2 mt-4">
              <div className="h-3 w-full skeleton rounded" />
              <div className="h-3 w-3/4 skeleton rounded" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  const thisMonthTotal = data?.thisMonthTotal ?? 0
  const prevMonthTotal = data?.prevMonthTotal ?? 0
  const monthChange = data?.monthChange ?? null
  const avgDaily = data?.avgDaily ?? 0
  const transactionCount = data?.transactionCount ?? 0
  const largestExpense = data?.largestExpense ?? null
  const mostUsedCategory = data?.mostUsedCategory ?? null
  const recentExpenses = data?.recentExpenses ?? []
  const categoryBreakdown = data?.categoryBreakdown ?? []

  const now = new Date()
  const greeting =
    now.getHours() < 12
      ? 'Good morning'
      : now.getHours() < 17
      ? 'Good afternoon'
      : 'Good evening'

  const firstName = displayName?.split(' ')[0] ?? 'there'
  const monthName = now.toLocaleString('default', { month: 'long' })
  const isSpendingDown = monthChange !== null && monthChange < 0

  const pieData = categoryBreakdown.map((c) => ({
    name: c.name,
    value: c.total,
    color: getCategoryColor(c.name, c.color),
  }))

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          className="px-3 py-2 rounded-[var(--radius-md)] text-xs shadow-md border"
          style={{
            background: 'var(--color-surface-primary)',
            borderColor: 'var(--color-border-primary)',
            color: 'var(--color-text-primary)',
          }}
        >
          <p className="font-semibold">{payload[0].name}</p>
          <p className="tabular-nums mt-0.5 text-[var(--color-text-secondary)]">
            {formatCurrency(payload[0].value, currency)}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="flex flex-col gap-6 sm:gap-8 page-enter">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2 text-xs text-[var(--color-text-tertiary)] font-medium">
            <span>{greeting}, {firstName}</span>
            <span>·</span>
            <span>{monthName} {now.getFullYear()}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-primary)] mt-1.5">
            Overview
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/expenses/new"
            className="btn-primary text-xs px-4 py-2.5 h-10 shadow-xs"
            id="dashboard-add-expense"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            <span>Add Expense</span>
          </Link>
          <Link
            href="/expenses"
            className="btn-secondary text-xs px-4 py-2.5 h-10 hidden sm:inline-flex"
          >
            <span>All Expenses</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Main Spend Hero Card */}
      <div className="apple-card p-6 sm:p-8 relative overflow-hidden">
        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] sm:text-xs font-semibold tracking-wider uppercase text-[var(--color-text-tertiary)] truncate min-w-0">
              Total Spending ({monthName})
            </span>
            <div
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium border border-[var(--color-border-primary)] bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] shrink-0"
              style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              <Calendar className="w-3 h-3 shrink-0" />
              <span style={{ whiteSpace: 'nowrap' }}>Current Cycle</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4 pt-1">
            <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[var(--color-text-primary)] tabular-nums">
              {formatCurrency(thisMonthTotal, currency)}
            </span>

            {monthChange !== null && (
              <div className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border border-[var(--color-border-primary)] self-start sm:self-auto text-[var(--color-text-secondary)]">
                {isSpendingDown ? (
                  <TrendingDown className="w-3.5 h-3.5" />
                ) : (
                  <TrendingUp className="w-3.5 h-3.5" />
                )}
                <span>{formatPercentage(monthChange)} vs prev month ({formatCurrencyCompact(prevMonthTotal, currency)})</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Secondary Metrics 4-Col Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
        <MetricTile
          label="Daily Average"
          value={formatCurrencyCompact(avgDaily, currency)}
          sub={`Based on this month`}
        />
        <MetricTile
          label="Transactions"
          value={String(transactionCount)}
          sub={`Recorded items`}
        />
        <MetricTile
          label="Largest Item"
          value={largestExpense ? formatCurrencyCompact(largestExpense.amount, currency) : '—'}
          sub={largestExpense?.title || 'None yet'}
        />
        <MetricTile
          label="Primary Category"
          value={mostUsedCategory ?? '—'}
          sub="Highest volume"
        />
      </div>

      {/* Breakdown and Transactions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 sm:gap-8">
        {/* Monochromatic Category Share */}
        <div className="lg:col-span-2 apple-card p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight text-[var(--color-text-primary)]">
              Category Share
            </h2>
            <Link
              href="/analytics"
              className="text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] flex items-center gap-0.5 transition-colors"
            >
              Analytics <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          {pieData.length > 0 ? (
            <div className="space-y-4">
              <div className="h-44 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2 border-t border-[var(--color-border-secondary)] pt-3">
                {pieData.slice(0, 5).map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-[var(--color-text-secondary)] truncate">
                        {item.name}
                      </span>
                    </div>
                    <span className="font-semibold text-[var(--color-text-primary)] tabular-nums">
                      {formatCurrencyCompact(item.value, currency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-center p-4">
              <p className="text-xs text-[var(--color-text-tertiary)]">
                No categorical expenses recorded this month
              </p>
              <Link href="/expenses/new" className="btn-secondary text-xs mt-3">
                Record an expense
              </Link>
            </div>
          )}
        </div>

        {/* Recent Transactions List */}
        <div className="lg:col-span-3 apple-card p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight text-[var(--color-text-primary)]">
              Recent Transactions
            </h2>
            <Link
              href="/expenses"
              className="text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] flex items-center gap-0.5 transition-colors"
            >
              See all ({transactionCount}) <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentExpenses.length > 0 ? (
            <div className="divide-y divide-[var(--color-border-secondary)]">
              {recentExpenses.map((expense) => (
                <Link
                  key={expense.id}
                  href={`/expenses/${expense.id}`}
                  className="flex items-center justify-between py-3 group hover:bg-[var(--color-surface-hover)] -mx-2 px-2 rounded-[var(--radius-sm)] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)] flex items-center justify-center shrink-0">
                      <CreditCard className="w-4 h-4 text-[var(--color-text-secondary)]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[var(--color-text-primary)] truncate">
                        {expense.title}
                      </p>
                      <p className="text-[0.6875rem] text-[var(--color-text-tertiary)] truncate mt-0.5">
                        {expense.merchant ?? expense.category?.name ?? 'Uncategorized'} · {formatShortDate(expense.transaction_date)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold text-[var(--color-text-primary)] tabular-nums">
                      {formatCurrency(expense.amount, expense.currency)}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-[var(--color-text-tertiary)] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-center p-4">
              <p className="text-xs text-[var(--color-text-tertiary)]">
                No recent activity recorded
              </p>
              <Link href="/expenses/new" className="btn-primary text-xs mt-3">
                Add an expense
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
