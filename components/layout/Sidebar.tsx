'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Receipt,
  BarChart3,
  FolderOpen,
  Tags,
  ArrowLeftRight,
  Settings,
  Plus,
  LogOut,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { SpaceSwitcher } from '@/components/layout/SpaceSwitcher'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/expenses', label: 'Expenses', icon: Receipt },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/categories', label: 'Categories', icon: FolderOpen },
  { href: '/tags', label: 'Tags', icon: Tags },
  { href: '/import-export', label: 'Data & Sync', icon: ArrowLeftRight },
  { href: '/settings', label: 'Settings', icon: Settings },
]

import { useApp } from '@/components/providers/AppProvider'

interface SidebarProps {
  userEmail?: string | null
  displayName?: string | null
}

export function Sidebar({ userEmail, displayName }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, profile } = useApp()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const effectiveEmail = userEmail ?? user?.email
  const effectiveDisplayName = displayName ?? profile?.display_name

  const initials = effectiveDisplayName
    ? effectiveDisplayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : effectiveEmail?.[0]?.toUpperCase() ?? '?'

  return (
    <aside
      className="hidden md:flex flex-col w-64 shrink-0 h-screen sticky top-0 overflow-y-auto glass-chrome"
      style={{
        borderRight: '0.5px solid var(--color-border-primary)',
      }}
    >
      {/* Organization / Space Switcher */}
      <div className="px-3 pt-5 pb-3">
        <SpaceSwitcher />
      </div>

      {/* Quick Add Button */}
      <div className="px-4 mb-6">
        <Link
          href="/expenses/new"
          className="btn-primary w-full justify-center text-xs py-2.5 h-10 rounded-[var(--radius-md)] shadow-xs"
          id="nav-quick-add"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
          <span>New Expense</span>
        </Link>
      </div>

      {/* Navigation List */}
      <nav aria-label="Main navigation" className="flex-1 px-3 space-y-0.5">
        <p className="px-2.5 py-1 text-[0.6875rem] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">
          Menu
        </p>
        <ul className="space-y-0.5" role="list">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === '/expenses'
                ? pathname.startsWith('/expenses')
                : pathname === href

            return (
              <li key={href}>
                <Link
                  href={href}
                  id={`nav-${href.replace('/', '').replace('-', '_')}`}
                  className={cn(
                    'flex items-center gap-2.5 px-2.5 py-2 rounded-[var(--radius-md)] text-[0.8125rem] font-medium transition-all duration-150',
                    isActive
                      ? 'bg-black text-white dark:bg-white dark:text-black font-semibold shadow-xs'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon
                    className="w-4 h-4 flex-shrink-0"
                    strokeWidth={isActive ? 2.4 : 1.8}
                  />
                  <span>{label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User & Session Footer */}
      <div className="p-3 border-t border-[var(--color-border-secondary)]">
        <div className="flex items-center gap-2.5 p-2 rounded-[var(--radius-md)] bg-[var(--color-surface-hover)]">
          <div className="w-7 h-7 rounded-full bg-black text-white dark:bg-white dark:text-black flex items-center justify-center text-xs font-semibold shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[var(--color-text-primary)] truncate">
              {effectiveDisplayName ?? 'Account'}
            </p>
            <p className="text-[0.6875rem] text-[var(--color-text-tertiary)] truncate">
              {effectiveEmail ?? ''}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="btn-ghost w-full mt-2 text-xs py-1.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] justify-start"
          id="nav-logout"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}

// Native Apple iOS Floating / Docked Bottom Tab Bar
export function MobileNav() {
  const pathname = usePathname()

  const MOBILE_ITEMS = [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/expenses', label: 'Expenses', icon: Receipt },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/categories', label: 'Categories', icon: FolderOpen },
    { href: '/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <>
      {/* Mobile Top Header with iOS Safe Area */}
      <header
        className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 glass-chrome border-b border-[var(--color-border-primary)]"
        style={{
          paddingTop: 'max(env(safe-area-inset-top, 0px), 10px)',
          paddingBottom: '10px',
          WebkitBackdropFilter: 'blur(2px) saturate(190%)',
          backdropFilter: 'blur(2px) saturate(190%)',
        }}
      >
        <div className="flex-1 max-w-[210px]">
          <SpaceSwitcher isMobile />
        </div>
        <Link
          href="/expenses/new"
          className="btn-primary text-xs px-3 py-1.5 h-8 rounded-[var(--radius-md)] shadow-xs"
          id="mobile-quick-add"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
          <span>Add</span>
        </Link>
      </header>

      {/* Mobile Bottom Tab Bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around glass-chrome border-t border-[var(--color-border-primary)] shadow-lg"
        style={{
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)',
          paddingTop: '8px',
          WebkitBackdropFilter: 'blur(2px) saturate(190%)',
          backdropFilter: 'blur(2px) saturate(190%)',
        }}
        aria-label="Mobile Tab Navigation"
      >
        {MOBILE_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === '/expenses'
              ? pathname.startsWith('/expenses')
              : href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(href) && href !== '/'

          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-1 transition-all active:scale-95 select-none"
              style={{
                color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
              }}
              aria-current={isActive ? 'page' : undefined}
            >
              <div
                className={cn(
                  'p-1.5 rounded-full transition-all duration-200 flex items-center justify-center',
                  isActive ? 'scale-110 bg-[var(--color-surface-hover)]' : ''
                )}
                style={{
                  color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
                }}
              >
                <Icon
                  className="w-5 h-5"
                  strokeWidth={isActive ? 2.5 : 1.7}
                  style={{
                    color: isActive ? 'var(--color-text-primary)' : 'currentColor',
                  }}
                />
              </div>
              <span
                className="text-[0.625rem] tracking-tight leading-none transition-colors"
                style={{
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
                }}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
