import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Spendly — Personal Finance Tracker',
    short_name: 'Spendly',
    description: 'Track, analyze, and understand your personal spending with a beautiful, Apple-inspired interface.',
    start_url: '/dashboard',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#000000',
    theme_color: '#0066cc',
    categories: ['finance', 'productivity'],
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Add Expense',
        url: '/expenses/new',
        description: 'Quickly add a new expense',
      },
      {
        name: 'View Dashboard',
        url: '/dashboard',
        description: 'View your financial overview',
      },
    ],
  }
}
