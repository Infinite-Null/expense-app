'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatCurrencyCompact, percentageChange, formatPercentage } from '@/lib/utils/currency'
import { formatShortDate, formatMonthYear, getPreviousPeriod, getDateRangePresets } from '@/lib/utils/dates'
import { format, parseISO, eachDayOfInterval, eachMonthOfInterval } from 'date-fns'
import { TrendingDown, TrendingUp, Lightbulb, BarChart3, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useTheme } from '@/components/providers/ThemeProvider'
import type { Category, Tag } from '@/lib/types/database'
import { getCategoryColor, getTagColor, getBadgeStyles } from '@/lib/utils/colors'

import { useApp } from '@/components/providers/AppProvider'
import { getCurrentMonthRange } from '@/lib/utils/dates'

interface AnalyticsClientProps {
  categories?: Pick<Category, 'id' | 'name' | 'color'>[]
  tags?: Pick<Tag, 'id' | 'name' | 'color'>[]
  currency?: string
  defaultFrom?: string
  defaultTo?: string
}

const DATE_PRESETS = [
  { key: 'this_month', label: 'This Month' },
  { key: 'last_month', label: 'Last Month' },
  { key: 'last_3_months', label: '3 Months' },
  { key: 'last_6_months', label: '6 Months' },
  { key: 'this_year', label: 'This Year' },
]

export function AnalyticsClient({
  categories: propCategories,
  tags: propTags,
  currency: propCurrency,
  defaultFrom: propDefaultFrom,
  defaultTo: propDefaultTo,
}: AnalyticsClientProps = {}) {
  const app = useApp()
  const { from: monthFrom, to: monthTo } = getCurrentMonthRange()

  const categories = propCategories ?? app.categories
  const tags = propTags ?? app.tags
  const currency = propCurrency ?? app.currency
  const defaultFrom = propDefaultFrom ?? monthFrom
  const defaultTo = propDefaultTo ?? monthTo

  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const [dateFrom, setDateFrom] = useState(defaultFrom)
  const [dateTo, setDateTo] = useState(defaultTo)
  const [activePreset, setActivePreset] = useState('this_month')
  const [filterCategory, setFilterCategory] = useState('')

  const [expenses, setExpenses] = useState<any[]>([])
  const [prevExpenses, setPrevExpenses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const presets = getDateRangePresets()

  function applyPreset(key: string) {
    setActivePreset(key)
    const p = presets[key]
    if (p) {
      setDateFrom(format(p.from, 'yyyy-MM-dd'))
      setDateTo(format(p.to, 'yyyy-MM-dd'))
    }
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    const fromDate = parseISO(dateFrom)
    const toDate = parseISO(dateTo)
    const prev = getPreviousPeriod(fromDate, toDate)

    let query = supabase
      .from('expenses')
      .select(`
        id, amount, transaction_date, category_id,
        categories:category_id ( id, name, color ),
        expense_tags ( tag:tags ( id, name, color ) )
      `)
      .gte('transaction_date', dateFrom)
      .lte('transaction_date', dateTo)
      .order('transaction_date')

    if (filterCategory) query = query.eq('category_id', filterCategory)

    let prevQuery = supabase
      .from('expenses')
      .select('amount, transaction_date, category_id')
      .gte('transaction_date', format(prev.from, 'yyyy-MM-dd'))
      .lte('transaction_date', format(prev.to, 'yyyy-MM-dd'))

    if (filterCategory) prevQuery = prevQuery.eq('category_id', filterCategory)

    if (!app.isAllSpaces && app.currentSpace && app.currentSpace.id !== 'default-space') {
      if (app.currentSpace.is_default) {
        query = query.or(`space_id.eq.${app.currentSpace.id},space_id.is.null`)
        prevQuery = prevQuery.or(`space_id.eq.${app.currentSpace.id},space_id.is.null`)
      } else {
        query = query.eq('space_id', app.currentSpace.id)
        prevQuery = prevQuery.eq('space_id', app.currentSpace.id)
      }
    }

    const startTime = Date.now()
    const [{ data: curr }, { data: prevData }] = await Promise.all([
      query,
      prevQuery,
    ])

    setExpenses((curr ?? []).map((e: any) => ({
      ...e,
      category: e.categories,
      tags: (e.expense_tags ?? []).map((et: any) => et.tag ?? et.tags).filter(Boolean),
    })))
    setPrevExpenses(prevData ?? [])
    const elapsed = Date.now() - startTime
    if (elapsed < 350) {
      await new Promise((resolve) => setTimeout(resolve, 350 - elapsed))
    }
    setLoading(false)
  }, [dateFrom, dateTo, filterCategory, app.currentSpace?.id, app.currentSpace?.is_default, app.isAllSpaces])

  useEffect(() => {
    setLoading(true)
    setExpenses([])
    setPrevExpenses([])
    fetchData()
  }, [fetchData])

  const isPageLoading = loading || app.isSwitchingSpace

  // Computed analytics
  const totalSpend = expenses.reduce((s, e) => s + Number(e.amount), 0)
  const prevTotal = prevExpenses.reduce((s, e) => s + Number(e.amount), 0)
  const change = percentageChange(totalSpend, prevTotal)

  const avgTransaction = expenses.length > 0 ? totalSpend / expenses.length : 0
  const maxExpense = expenses.reduce((m, e) => Math.max(m, Number(e.amount)), 0)

  // Spending over time
  const fromDate = parseISO(dateFrom)
  const toDate = parseISO(dateTo)
  const daysDiff = Math.ceil((toDate.getTime() - fromDate.getTime()) / 86400000)
  const useMonthly = daysDiff > 60

  let timeData: { label: string; amount: number }[] = []
  if (useMonthly) {
    const months = eachMonthOfInterval({ start: fromDate, end: toDate })
    timeData = months.map((m) => {
      const monthStr = format(m, 'yyyy-MM')
      const total = expenses
        .filter((e) => e.transaction_date.startsWith(monthStr))
        .reduce((s, e) => s + Number(e.amount), 0)
      return { label: format(m, 'MMM yy'), amount: Math.round(total * 100) / 100 }
    })
  } else {
    const days = eachDayOfInterval({ start: fromDate, end: toDate })
    timeData = days.map((d) => {
      const dayStr = format(d, 'yyyy-MM-dd')
      const total = expenses
        .filter((e) => e.transaction_date === dayStr)
        .reduce((s, e) => s + Number(e.amount), 0)
      return { label: format(d, 'dd MMM'), amount: Math.round(total * 100) / 100 }
    }).filter((d) => d.amount > 0 || daysDiff <= 14)
  }

  // Category breakdown
  const categoryMap: Record<string, { name: string; color: string; total: number }> = {}
  for (const e of expenses) {
    const key = e.category?.id ?? 'uncategorized'
    if (!categoryMap[key]) {
      const name = e.category?.name ?? 'Uncategorized'
      categoryMap[key] = {
        name,
        color: getCategoryColor(name, e.category?.color),
        total: 0,
      }
    }
    categoryMap[key].total += Number(e.amount)
  }
  const categoryData = Object.values(categoryMap).sort((a, b) => b.total - a.total)

  // Tag breakdown
  const tagMap: Record<string, { name: string; color: string; total: number; count: number }> = {}
  for (const e of expenses) {
    for (const tag of e.tags ?? []) {
      if (!tagMap[tag.id]) {
        tagMap[tag.id] = {
          name: tag.name,
          color: getTagColor(tag.name, tag.color),
          total: 0,
          count: 0,
        }
      }
      tagMap[tag.id].total += Number(e.amount)
      tagMap[tag.id].count++
    }
  }
  const tagData = Object.values(tagMap).sort((a, b) => b.total - a.total)

  // Weekday spending
  const weekdayTotals = Array(7).fill(0)
  const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  for (const e of expenses) {
    const day = parseISO(e.transaction_date).getDay()
    weekdayTotals[day] += Number(e.amount)
  }
  const weekdayData = weekdayLabels.map((label, i) => ({
    label,
    amount: Math.round(weekdayTotals[i] * 100) / 100,
  }))
  const peakWeekday = weekdayData.reduce((m, d) => d.amount > m.amount ? d : m, weekdayData[0])

  // Insights
  const insights: string[] = []
  if (change !== null) {
    const dir = change > 0 ? 'increased' : 'decreased'
    insights.push(`Spending ${dir} by ${Math.abs(change).toFixed(1)}% compared to the prior timeframe.`)
  }
  if (categoryData.length > 0) {
    const top = categoryData[0]
    const pct = totalSpend > 0 ? ((top.total / totalSpend) * 100).toFixed(1) : 0
    insights.push(`${top.name} represented the largest share (${pct}% of total spending).`)
  }
  if (peakWeekday && peakWeekday.amount > 0) {
    insights.push(`Historical expenditure peaks on ${peakWeekday.label}days.`)
  }

  const ChartTooltipContent = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    const first = payload[0]
    const headerTitle = label || first?.name || first?.payload?.name
    return (
      <div className="px-3 py-2 rounded-[var(--radius-md)] text-xs shadow-md border"
        style={{ background: 'var(--color-surface-primary)', borderColor: 'var(--color-border-primary)', color: 'var(--color-text-primary)' }}>
        {headerTitle && <p className="font-semibold mb-1">{headerTitle}</p>}
        {payload.map((p: any, i: number) => (
          <p key={i} className="tabular-nums text-[var(--color-text-secondary)]">
            {formatCurrency(p.value, currency)}
          </p>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 sm:gap-8 page-enter min-w-0 max-w-full overflow-hidden">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">
          Analytics
        </h1>
        <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
          Deep financial metrics and patterns
        </p>
      </div>

      {/* Date Range & Filter Bar */}
      <div className="apple-card p-4 sm:p-5 flex flex-col gap-4 overflow-hidden">
        {/* Presets Row: Scrollable pill bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden shrink-0">
          {DATE_PRESETS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => applyPreset(p.key)}
              className={cn(
                'px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all select-none border shrink-0',
                activePreset === p.key
                  ? 'bg-black text-white dark:bg-white dark:text-black border-transparent font-semibold shadow-xs'
                  : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] border-[var(--color-border-primary)] hover:border-[var(--color-border-hover)]'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Custom Range & Category Filter */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pt-3 border-t border-[var(--color-border-secondary)]">
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2.5 w-full sm:w-auto">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 min-w-0">
              <label htmlFor="analytics-date-from" className="text-[10px] sm:text-xs font-medium text-[var(--color-text-tertiary)] shrink-0">
                From
              </label>
              <input
                id="analytics-date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setActivePreset('') }}
                className="input-base text-xs py-2 px-2.5 w-full sm:w-36 min-w-0"
                aria-label="From date"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 min-w-0">
              <label htmlFor="analytics-date-to" className="text-[10px] sm:text-xs font-medium text-[var(--color-text-tertiary)] shrink-0">
                To
              </label>
              <input
                id="analytics-date-to"
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setActivePreset('') }}
                className="input-base text-xs py-2 px-2.5 w-full sm:w-36 min-w-0"
                aria-label="To date"
              />
            </div>
          </div>

          <div className="w-full sm:w-48 shrink-0">
            <select
              id="analytics-category-filter"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="input-base text-xs py-2 px-3 w-full"
              aria-label="Filter by category"
            >
              <option value="">All Categories</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="apple-card p-4 sm:p-5 col-span-2">
          <p className="text-xs font-medium text-[var(--color-text-secondary)]">Total Volume</p>
          <div className="mt-1">
            {isPageLoading ? (
              <span className="inline-block h-8 w-36 skeleton rounded-md" />
            ) : (
              <p className="text-3xl font-extrabold text-[var(--color-text-primary)] tracking-tight tabular-nums">
                {formatCurrency(totalSpend, currency)}
              </p>
            )}
          </div>
          {change !== null && !isPageLoading && (
            <div className="inline-flex items-center gap-1 text-xs font-medium mt-1 text-[var(--color-text-secondary)]">
              {change < 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
              <span>{formatPercentage(change)} vs previous period</span>
            </div>
          )}
          {change === null && !isPageLoading && (
            <p className="text-xs text-[var(--color-text-tertiary)] mt-1">No comparative baseline</p>
          )}
        </div>

        <div className="apple-card p-4 sm:p-5">
          <p className="text-xs font-medium text-[var(--color-text-secondary)]">Avg Ticket</p>
          <div className="mt-1">
            {isPageLoading ? (
              <span className="inline-block h-7 w-24 skeleton rounded-md" />
            ) : (
              <p className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)] tracking-tight tabular-nums">
                {formatCurrencyCompact(avgTransaction, currency)}
              </p>
            )}
          </div>
          <p className="text-[0.6875rem] text-[var(--color-text-tertiary)] mt-1">
            {isPageLoading ? <span className="inline-block h-3 w-16 skeleton rounded" /> : `${expenses.length} records`}
          </p>
        </div>

        <div className="apple-card p-4 sm:p-5">
          <p className="text-xs font-medium text-[var(--color-text-secondary)]">Max Outlay</p>
          <div className="mt-1">
            {isPageLoading ? (
              <span className="inline-block h-7 w-24 skeleton rounded-md" />
            ) : (
              <p className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)] tracking-tight tabular-nums">
                {formatCurrencyCompact(maxExpense, currency)}
              </p>
            )}
          </div>
          <p className="text-[0.6875rem] text-[var(--color-text-tertiary)] mt-1">
            {isPageLoading ? <span className="inline-block h-3 w-24 skeleton rounded" /> : 'Single transaction'}
          </p>
        </div>
      </div>

      {/* Category Spending Analysis — Featured Pie Chart */}
      <div className="apple-card p-5 sm:p-7 space-y-5 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[var(--color-border-secondary)] pb-4">
          <div>
            <h2 className="text-sm sm:text-base font-semibold tracking-tight text-[var(--color-text-primary)]">
              Category Spending Analysis
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
              Proportional distribution of expenses across categories
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] border border-[var(--color-border-primary)] shrink-0">
              {categoryData.length} {categoryData.length === 1 ? 'Category' : 'Categories'}
            </span>
          </div>
        </div>

        {isPageLoading ? (
          <div className="skeleton h-56 rounded-[var(--radius-md)]" />
        ) : categoryData.length === 0 ? (
          <p className="text-xs text-[var(--color-text-tertiary)] text-center py-12">
            No categorical spending records found for this timeframe
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Pie Chart Canvas */}
            <div className="md:col-span-5 flex flex-col items-center justify-center">
              <div className="h-52 sm:h-56 w-full max-w-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="total"
                      nameKey="name"
                      stroke="none"
                    >
                      {categoryData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center mt-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                  Top Category
                </span>
                <p className="text-xs font-bold text-[var(--color-text-primary)] mt-0.5 truncate max-w-[220px]">
                  {categoryData[0]?.name} ({totalSpend > 0 ? ((categoryData[0]?.total / totalSpend) * 100).toFixed(1) : 0}%)
                </p>
              </div>
            </div>

            {/* Category Breakdown List */}
            <div className="md:col-span-7 space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {categoryData.map((cat) => {
                const pct = totalSpend > 0 ? (cat.total / totalSpend) * 100 : 0
                return (
                  <div key={cat.name} className="space-y-1.5 p-2 rounded-[var(--radius-sm)] transition-colors hover:bg-[var(--color-surface-hover)]">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="font-semibold text-[var(--color-text-primary)] truncate">
                          {cat.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 tabular-nums ml-2">
                        <span className="text-[11px] font-medium text-[var(--color-text-tertiary)]">
                          {pct.toFixed(1)}%
                        </span>
                        <span className="font-bold text-[var(--color-text-primary)]">
                          {formatCurrency(cat.total, currency)}
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-[var(--color-surface-secondary)] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: cat.color,
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Spending Over Time — Monochromatic Area Curve */}
      <div className="apple-card p-5 sm:p-6 space-y-4 overflow-hidden">
        <h2 className="text-sm font-semibold tracking-tight text-[var(--color-text-primary)]">
          Expenditure Velocity
        </h2>
        {isPageLoading ? (
          <div className="skeleton h-48 rounded-[var(--radius-md)]" />
        ) : timeData.length === 0 ? (
          <p className="text-xs text-[var(--color-text-tertiary)] text-center py-12">No data recorded for this timeframe</p>
        ) : (
          <div className="h-56 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="monoCurve" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isDark ? '#ffffff' : '#000000'} stopOpacity={isDark ? 0.35 : 0.2} />
                    <stop offset="95%" stopColor={isDark ? '#ffffff' : '#000000'} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-secondary)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--color-text-tertiary)' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-tertiary)' }} tickLine={false} axisLine={false}
                  tickFormatter={(v) => formatCurrencyCompact(v, currency)} width={50} />
                <Tooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="amount" name="Spent"
                  stroke={isDark ? '#ffffff' : '#000000'}
                  strokeWidth={2}
                  fill="url(#monoCurve)"
                  dot={false}
                  activeDot={{ r: 4, fill: isDark ? '#ffffff' : '#000000' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Weekday Distribution & Tag Analytics */}
      <div className={tagData.length > 0 ? "grid md:grid-cols-2 gap-6" : "space-y-6"}>
        {/* Weekday spending — Monochromatic Bar Chart */}
        <div className="apple-card p-5 sm:p-6 space-y-4 overflow-hidden">
          <h2 className="text-sm font-semibold tracking-tight text-[var(--color-text-primary)]">
            Distribution by Weekday
          </h2>
          {loading ? (
            <div className="skeleton h-48 rounded-[var(--radius-md)]" />
          ) : (
            <div className="h-56 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekdayData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-secondary)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--color-text-tertiary)' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-tertiary)' }} tickLine={false} axisLine={false}
                    tickFormatter={(v) => formatCurrencyCompact(v, currency)} width={50} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="amount" name="Spent" fill={isDark ? '#ffffff' : '#000000'} radius={[4, 4, 0, 0]} maxBarSize={32}>
                    {weekdayData.map((entry) => (
                      <Cell
                        key={entry.label}
                        fill={isDark ? '#ffffff' : '#000000'}
                        opacity={entry.label === peakWeekday?.label ? 1 : 0.35}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Tag analytics */}
        {tagData.length > 0 && (
          <div className="apple-card p-5 sm:p-6 space-y-4">
            <h2 className="text-sm font-semibold tracking-tight text-[var(--color-text-primary)]">
              Tag Grouping
            </h2>
            <div className="space-y-3">
              {tagData.map((tag) => (
                <div key={tag.name} className="flex items-center gap-3">
                  <span
                    className="text-[0.6875rem] px-2.5 py-1 rounded-full border shrink-0 font-medium"
                    style={getBadgeStyles(tag.color)}
                  >
                    #{tag.name}
                  </span>
                  <div className="flex-1">
                    <div className="h-1.5 rounded-full bg-[var(--color-surface-secondary)] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: `${totalSpend > 0 ? (tag.total / totalSpend) * 100 : 0}%`,
                          backgroundColor: tag.color,
                        }}
                      />
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-bold text-[var(--color-text-primary)] tabular-nums">
                      {formatCurrency(tag.total, currency)}
                    </p>
                    <p className="text-[0.625rem] text-[var(--color-text-tertiary)]">{tag.count} transactions</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[0.6875rem] text-[var(--color-text-tertiary)] pt-1 italic">
              Multi-tag associations may overlap across shared transactions.
            </p>
          </div>
        )}
      </div>

      {/* Insights */}
      {!isPageLoading && insights.length > 0 && (
        <div className="apple-card p-5 sm:p-6 space-y-3">
          <h2 className="text-sm font-semibold tracking-tight text-[var(--color-text-primary)] flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-[var(--color-text-primary)]" />
            <span>Automated Insights</span>
          </h2>
          <ul className="space-y-2 text-xs text-[var(--color-text-secondary)]">
            {insights.map((ins, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white mt-1.5 shrink-0" />
                <span>{ins}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
