import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { PwaProvider } from '@/components/providers/PwaProvider'
import { Toaster } from '@/components/ui/Toaster'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Spendly — Personal Finance Tracker',
    template: '%s | Spendly',
  },
  description:
    'Track, analyze, and understand your personal spending with a beautiful, Apple-inspired interface. Built for simplicity, designed for clarity.',
  keywords: ['expense tracker', 'personal finance', 'budget', 'spending analytics'],
  authors: [{ name: 'Spendly' }],
  creator: 'Spendly',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Spendly',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'Spendly',
    title: 'Spendly — Personal Finance Tracker',
    description: 'Track, analyze, and understand your personal spending.',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f5f7' },
    { media: '(prefers-color-scheme: dark)', color: '#1c1c1e' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        {/* Prevent theme flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var t = localStorage.getItem('theme');
                  var isDark = t === 'dark' || (t !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  if (isDark) document.documentElement.classList.add('dark');
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full antialiased">
        <ThemeProvider>
          <PwaProvider>
            {children}
            <Toaster />
          </PwaProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
