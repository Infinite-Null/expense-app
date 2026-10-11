import {
  format,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subMonths,
  subYears,
  startOfWeek,
  endOfWeek,
  isThisMonth,
  isThisYear,
  parseISO,
  differenceInDays,
  eachDayOfInterval,
  eachMonthOfInterval,
} from 'date-fns'

export type DateRange = {
  from: Date
  to: Date
  label: string
}

export function getDateRangePresets(): Record<string, DateRange> {
  const now = new Date()
  return {
    this_month: {
      from: startOfMonth(now),
      to: endOfMonth(now),
      label: 'This Month',
    },
    last_month: {
      from: startOfMonth(subMonths(now, 1)),
      to: endOfMonth(subMonths(now, 1)),
      label: 'Last Month',
    },
    this_year: {
      from: startOfYear(now),
      to: endOfYear(now),
      label: 'This Year',
    },
    last_year: {
      from: startOfYear(subYears(now, 1)),
      to: endOfYear(subYears(now, 1)),
      label: 'Last Year',
    },
    last_3_months: {
      from: startOfMonth(subMonths(now, 2)),
      to: endOfMonth(now),
      label: 'Last 3 Months',
    },
    last_6_months: {
      from: startOfMonth(subMonths(now, 5)),
      to: endOfMonth(now),
      label: 'Last 6 Months',
    },
  }
}

export function formatDate(date: string | Date, fmt = 'dd MMM yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, fmt)
}

export function formatShortDate(date: string | Date): string {
  return formatDate(date, 'dd MMM')
}

export function formatMonthYear(date: string | Date): string {
  return formatDate(date, 'MMM yyyy')
}

export function formatDateForInput(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function getCurrentMonthRange(): { from: string; to: string } {
  const now = new Date()
  return {
    from: formatDateForInput(startOfMonth(now)),
    to: formatDateForInput(endOfMonth(now)),
  }
}

export function getPreviousMonthRange(): { from: string; to: string } {
  const prev = subMonths(new Date(), 1)
  return {
    from: formatDateForInput(startOfMonth(prev)),
    to: formatDateForInput(endOfMonth(prev)),
  }
}

/**
 * Get previous period of the same duration for comparison
 */
export function getPreviousPeriod(from: Date, to: Date): { from: Date; to: Date } {
  const days = differenceInDays(to, from) + 1
  const prevTo = new Date(from)
  prevTo.setDate(prevTo.getDate() - 1)
  const prevFrom = new Date(prevTo)
  prevFrom.setDate(prevFrom.getDate() - days + 1)
  return { from: prevFrom, to: prevTo }
}

/**
 * Generate daily labels for a date range
 */
export function getDailyLabels(from: Date, to: Date): string[] {
  return eachDayOfInterval({ start: from, end: to }).map((d) =>
    format(d, 'dd MMM')
  )
}

/**
 * Generate monthly labels for a date range
 */
export function getMonthlyLabels(from: Date, to: Date): string[] {
  return eachMonthOfInterval({ start: from, end: to }).map((d) =>
    format(d, 'MMM yyyy')
  )
}

export { startOfMonth, endOfMonth, subMonths, parseISO, isThisMonth, isThisYear }
