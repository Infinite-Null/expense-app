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

interface DashboardClientProps {
  displayName: string | null | undefined
  currency: string
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

const MONO_COLORS_LIGHT = [
  '#000000',
  '#333336',
  '#5c5c60',
  '#8e8e93',
  '#aeaeb2',
  '#c7c7cc',
  '#d1d1d6',
]

const MONO_COLORS_DARK = [
  '#ffffff',
  '#d1d1d6',
  '#aeaeb2',
  '#8e8e93',
  '#636366',
  '#48484a',
  '#2c2c2e',
]

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
  displayName,
  currency,
  thisMonthTotal,
  prevMonthTotal,
  monthChange,
  avgDaily,
  transactionCount,
  largestExpense,
  mostUsedCategory,
  recentExpenses,
  categoryBreakdown,
}: DashboardClientProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const monoPalette = isDark ? MONO_COLORS_DARK : MONO_COLORS_LIGHT

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

  const pieData = categoryBreakdown.map((c, i) => ({
    name: c.name,
    value: c.total,
    color: monoPalette[i % monoPalette.length],
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
                      <p className="text-[0.6875rem] text-[var(--color-text-tertiary)] truncate">
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
