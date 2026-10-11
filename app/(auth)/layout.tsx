import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6"
      style={{ background: 'var(--color-bg-primary)' }}
    >
      <div className="w-full max-w-sm space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <Link href="/login" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-bold text-base shadow-sm transition-transform group-hover:scale-105">
              S
            </div>
          </Link>
          <span className="text-xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Spendly
          </span>
          <p className="text-xs text-[var(--color-text-tertiary)] max-w-xs">
            Simple, private personal finance tracking built for clarity
          </p>
        </div>

        {/* Form Container Card */}
        <div className="apple-card p-6 sm:p-8">
          {children}
        </div>

        {/* Minimal Footer */}
        <p className="text-center text-[0.6875rem] text-[var(--color-text-tertiary)]">
          Protected by Row Level Security &middot; Encrypted Session
        </p>
      </div>
    </div>
  )
}
