/**
 * Apple HIG-inspired vibrant color palettes for Categories and Tags.
 * Provides consistent, colorful categorization across Charts, Badges, and Lists.
 */

export const CATEGORY_COLOR_PALETTE = [
  '#FF3B30', // Red (Food & Dining)
  '#FF9500', // Orange (Subscriptions)
  '#FFCC00', // Yellow (Utilities / Bills)
  '#34C759', // Green (Groceries / Income)
  '#00C7BE', // Teal (Gifts / Donations)
  '#007AFF', // Blue (Transportation)
  '#5856D6', // Indigo (Travel)
  '#AF52DE', // Purple (Education / Rent)
  '#FF2D55', // Pink (Personal Care)
  '#10B981', // Emerald (Investments)
  '#06B6D4', // Cyan (Entertainment)
  '#F59E0B', // Amber (Shopping)
  '#EC4899', // Hot Pink
  '#8B5CF6', // Violet
  '#14B8A6', // Mint
  '#6366F1', // Indigo Blue
]

export const TAG_COLOR_PALETTE = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#EF4444', // Red
  '#14B8A6', // Teal
  '#6366F1', // Indigo
  '#84CC16', // Lime
  '#F97316', // Orange
  '#A855F7', // Violet
]

export const DEFAULT_CATEGORY_COLOR_MAP: Record<string, string> = {
  'food & dining': '#FF6B6B',
  food: '#FF6B6B',
  dining: '#FF6B6B',
  groceries: '#10B981',
  grocery: '#10B981',
  transportation: '#007AFF',
  transport: '#007AFF',
  shopping: '#EC4899',
  'housing & rent': '#8B5CF6',
  housing: '#8B5CF6',
  rent: '#8B5CF6',
  utilities: '#F59E0B',
  'health & medical': '#EF4444',
  health: '#EF4444',
  medical: '#EF4444',
  entertainment: '#06B6D4',
  travel: '#3B82F6',
  education: '#A855F7',
  subscriptions: '#F97316',
  subscription: '#F97316',
  'personal care': '#F43F5E',
  'gifts & donations': '#14B8A6',
  gifts: '#14B8A6',
  investments: '#10B981',
  bills: '#EAB308',
  other: '#8E8E93',
}

function isMonochromatic(color?: string | null): boolean {
  if (!color) return true
  const c = color.trim().toLowerCase()
  return (
    c === '#000' ||
    c === '#000000' ||
    c === '#fff' ||
    c === '#ffffff' ||
    c === '#1c1c1e' ||
    c === '#18181a' ||
    c === '#121214' ||
    c === '#2c2c2e' ||
    c === '#3a3a3c' ||
    c === '#48484a' ||
    c === '#636366' ||
    c === '#8e8e93' ||
    c === '#aeaeb2' ||
    c === '#c7c7cc' ||
    c === '#d1d1d6' ||
    c === '#e5e5ea' ||
    c === '#f2f2f7' ||
    c === '#f5f5f7' ||
    c === 'black' ||
    c === 'white'
  )
}

function hashStringToIndex(str: string, max: number): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash) % max
}

/**
 * Returns a vibrant color for a category.
 * If custom color is provided and is not monochromatic grayscale, uses it.
 * Otherwise uses standard mapping or consistent string hashing.
 */
export function getCategoryColor(
  name?: string | null,
  customColor?: string | null
): string {
  if (customColor && !isMonochromatic(customColor)) {
    return customColor
  }
  if (!name) return '#007AFF'
  const normalized = name.toLowerCase().trim()
  if (DEFAULT_CATEGORY_COLOR_MAP[normalized]) {
    return DEFAULT_CATEGORY_COLOR_MAP[normalized]
  }
  const index = hashStringToIndex(normalized, CATEGORY_COLOR_PALETTE.length)
  return CATEGORY_COLOR_PALETTE[index]
}

/**
 * Returns a vibrant color for a tag.
 */
export function getTagColor(
  name?: string | null,
  customColor?: string | null
): string {
  if (customColor && !isMonochromatic(customColor)) {
    return customColor
  }
  if (!name) return '#3B82F6'
  const normalized = name.toLowerCase().trim()
  const index = hashStringToIndex(normalized, TAG_COLOR_PALETTE.length)
  return TAG_COLOR_PALETTE[index]
}

/**
 * Helper to produce Apple-style badge background and border styles
 */
export function getBadgeStyles(color: string) {
  return {
    backgroundColor: `${color}18`,
    color: color,
    borderColor: `${color}35`,
  }
}
