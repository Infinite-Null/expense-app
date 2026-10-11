import { type ClassValue, clsx } from 'clsx'

/**
 * Merge class names with clsx — lightweight Tailwind-compatible utility
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}
