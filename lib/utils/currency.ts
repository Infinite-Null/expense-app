/**
 * Format a number as currency using locale-aware formatting.
 * Uses NUMERIC precision — amounts are stored as numbers from the DB.
 */
export function formatCurrency(
  amount: number,
  currency = 'INR',
  locale = 'en-IN'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format a compact currency value (e.g. ₹1.2K, ₹4.5L)
 */
export function formatCurrencyCompact(
  amount: number,
  currency = 'INR',
  locale = 'en-IN'
): string {
  if (amount >= 10000000) {
    return `${formatCurrencySymbol(currency)}${(amount / 10000000).toFixed(1)}Cr`
  }
  if (amount >= 100000) {
    return `${formatCurrencySymbol(currency)}${(amount / 100000).toFixed(1)}L`
  }
  if (amount >= 1000) {
    return `${formatCurrencySymbol(currency)}${(amount / 1000).toFixed(1)}K`
  }
  return formatCurrency(amount, currency, locale)
}

export function formatCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
  }
  return symbols[currency] ?? currency
}

/**
 * Calculate percentage change between two values.
 * Returns null when previous is 0 to avoid divide-by-zero misleading results.
 */
export function percentageChange(
  current: number,
  previous: number
): number | null {
  if (previous === 0) return null
  return ((current - previous) / previous) * 100
}

/**
 * Format a percentage with sign (e.g. +12.3%, -5.1%)
 */
export function formatPercentage(value: number | null): string {
  if (value === null) return 'No previous data'
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}

/**
 * Sum an array of amounts safely as numbers.
 * For financial accuracy, amounts are stored as NUMERIC in the DB
 * and parsed as JavaScript numbers. Avoid accumulating floating-point
 * errors by rounding to 2 decimal places after operations.
 */
export function sumAmounts(amounts: number[]): number {
  const sum = amounts.reduce((acc, val) => acc + val, 0)
  return Math.round(sum * 100) / 100
}

/**
 * Calculate average of amounts
 */
export function averageAmount(amounts: number[]): number {
  if (amounts.length === 0) return 0
  return Math.round((sumAmounts(amounts) / amounts.length) * 100) / 100
}

/**
 * Group amounts by a key and return a record of totals
 */
export function groupAndSum<T>(
  items: T[],
  getKey: (item: T) => string,
  getValue: (item: T) => number
): Record<string, number> {
  return items.reduce(
    (acc, item) => {
      const key = getKey(item)
      acc[key] = Math.round(((acc[key] ?? 0) + getValue(item)) * 100) / 100
      return acc
    },
    {} as Record<string, number>
  )
}
