'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  User,
  Sun,
  Moon,
  Laptop,
  Globe,
  Coins,
  ShieldAlert,
  ArrowRight,
  Check,
  AlertTriangle,
  Layers,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { profileSchema, type ProfileFormValues } from '@/lib/validations/schemas'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toaster'
import { useTheme } from '@/components/providers/ThemeProvider'
import { Input, Select } from '@/components/ui/FormFields'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { CreateSpaceModal } from '@/components/layout/CreateSpaceModal'
import { EditSpaceModal } from '@/components/layout/EditSpaceModal'
import { DeleteSpaceModal } from '@/components/layout/DeleteSpaceModal'
import type { Profile, Space } from '@/lib/types/database'
import { cn } from '@/lib/utils/cn'
import Link from 'next/link'

import { useEffect } from 'react'
import { useApp } from '@/components/providers/AppProvider'

interface SettingsClientProps {
  user?: { id: string; email: string }
  profile?: Profile
}

const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: '$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: '$', name: 'Australian Dollar' },
  { code: 'SGD', symbol: '$', name: 'Singapore Dollar' },
]

const LOCALES = [
  { code: 'en-IN', name: 'English (India)' },
  { code: 'en-US', name: 'English (United States)' },
  { code: 'en-GB', name: 'English (United Kingdom)' },
  { code: 'de-DE', name: 'German (Germany)' },
  { code: 'fr-FR', name: 'French (France)' },
  { code: 'ja-JP', name: 'Japanese (Japan)' },
]

export function SettingsClient({ user: propUser, profile: initialProfile }: SettingsClientProps = {}) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { success, error: toastError } = useToast()
  const app = useApp()

  const user = propUser ?? (app.user ? { id: app.user.id, email: app.user.email ?? '' } : { id: '', email: '' })
  const [profile, setProfile] = useState<Profile>(
    initialProfile ??
      app.profile ?? {
        id: user.id,
        display_name: 'User',
        preferred_currency: 'INR',
        preferred_locale: 'en-IN',
        theme_preference: 'system',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
  )
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  // Spaces modal states
  const [createSpaceModalOpen, setCreateSpaceModalOpen] = useState(false)
  const [editingSpace, setEditingSpace] = useState<Space | null>(null)
  const [editSpaceModalOpen, setEditSpaceModalOpen] = useState(false)
  const [deletingSpace, setDeletingSpace] = useState<Space | null>(null)
  const [deleteSpaceModalOpen, setDeleteSpaceModalOpen] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      display_name: profile.display_name ?? '',
      preferred_currency: profile.preferred_currency ?? 'INR',
      preferred_locale: profile.preferred_locale ?? 'en-IN',
      theme_preference: (profile.theme_preference as 'light' | 'dark' | 'system') ?? 'system',
    },
  })

  useEffect(() => {
    if (!initialProfile && app.profile) {
      setProfile(app.profile)
      reset({
        display_name: app.profile.display_name ?? '',
        preferred_currency: app.profile.preferred_currency ?? 'INR',
        preferred_locale: app.profile.preferred_locale ?? 'en-IN',
        theme_preference: (app.profile.theme_preference as 'light' | 'dark' | 'system') ?? 'system',
      })
    }
  }, [initialProfile, app.profile, reset])

  const currentThemePref = watch('theme_preference')

  async function handleProfileSave(values: ProfileFormValues) {
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: values.display_name,
        preferred_currency: values.preferred_currency,
        preferred_locale: values.preferred_locale,
        theme_preference: values.theme_preference,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (error) {
      toastError(error.message)
      return
    }

    setProfile((prev) => ({
      ...prev,
      ...values,
      updated_at: new Date().toISOString(),
    }))

    app.refreshProfile()
    success('Preferences saved successfully')
  }

  function handleThemeChange(newTheme: 'light' | 'dark' | 'system') {
    setValue('theme_preference', newTheme, { shouldDirty: true })
    setTheme(newTheme)
  }

  async function handleDeleteAccount() {
    if (deleteConfirmationText !== 'DELETE') return
    setIsDeleting(true)
    const supabase = createClient()

    // Delete user expenses, categories, tags, profile
    await supabase.from('expenses').delete().eq('user_id', user.id)
    await supabase.from('categories').delete().eq('user_id', user.id)
    await supabase.from('tags').delete().eq('user_id', user.id)
    await supabase.from('profiles').delete().eq('id', user.id)

    // Sign out
    await supabase.auth.signOut()
    setIsDeleting(false)
    router.push('/signup')
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          Settings
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
          Manage your account preferences, appearance, and regional settings
        </p>
      </div>

      <form onSubmit={handleSubmit(handleProfileSave)} className="space-y-8">
        {/* Profile Card */}
        <div className="apple-card p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-[var(--color-border)]">
            <div
              className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center"
              style={{ background: 'var(--color-fill-secondary)' }}
            >
              <User className="w-5 h-5 text-[var(--color-accent)]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                Personal Profile
              </h2>
              <p className="text-xs text-[var(--color-text-tertiary)]">
                Your identity and display credentials
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input
              label="Display Name"
              placeholder="e.g. John Doe"
              error={errors.display_name?.message}
              {...register('display_name')}
            />
            <div>
              <label className="form-label">Email Address</label>
              <input
                type="email"
                value={user.email}
                disabled
                className="input-base bg-[var(--color-fill-secondary)] opacity-80 cursor-not-allowed"
              />
              <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                Linked to your authentication credentials
              </p>
            </div>
          </div>
        </div>

        {/* Appearance / Theme */}
        <div className="apple-card p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-[var(--color-border)]">
            <div
              className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center"
              style={{ background: 'var(--color-fill-secondary)' }}
            >
              <Sun className="w-5 h-5 text-[var(--color-accent)]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                Appearance
              </h2>
              <p className="text-xs text-[var(--color-text-tertiary)]">
                Customize the visual theme of the application
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
            {/* System */}
            <button
              type="button"
              onClick={() => handleThemeChange('system')}
              className={cn(
                'p-3 sm:p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between min-h-[5.5rem] sm:min-h-[6.5rem]',
                currentThemePref === 'system'
                  ? 'border-black dark:border-white ring-2 ring-black/10 dark:ring-white/20 bg-[var(--color-surface-secondary)]'
                  : 'border-[var(--color-border-primary)] hover:border-[var(--color-border-hover)] bg-[var(--color-surface-primary)]'
              )}
            >
              <div className="flex items-center justify-between w-full">
                <Laptop className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--color-text-primary)]" />
                {currentThemePref === 'system' && (
                  <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--color-text-primary)]" strokeWidth={2.5} />
                )}
              </div>
              <div>
                <span className="text-xs sm:text-sm font-semibold text-[var(--color-text-primary)] block">
                  System
                </span>
                <span className="text-[10px] sm:text-xs text-[var(--color-text-tertiary)] hidden sm:block">
                  Match device OS
                </span>
              </div>
            </button>

            {/* Light */}
            <button
              type="button"
              onClick={() => handleThemeChange('light')}
              className={cn(
                'p-3 sm:p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between min-h-[5.5rem] sm:min-h-[6.5rem]',
                currentThemePref === 'light'
                  ? 'border-black dark:border-white ring-2 ring-black/10 dark:ring-white/20 bg-[var(--color-surface-secondary)]'
                  : 'border-[var(--color-border-primary)] hover:border-[var(--color-border-hover)] bg-[var(--color-surface-primary)]'
              )}
            >
              <div className="flex items-center justify-between w-full">
                <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--color-text-primary)]" />
                {currentThemePref === 'light' && (
                  <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--color-text-primary)]" strokeWidth={2.5} />
                )}
              </div>
              <div>
                <span className="text-xs sm:text-sm font-semibold text-[var(--color-text-primary)] block">
                  Light
                </span>
                <span className="text-[10px] sm:text-xs text-[var(--color-text-tertiary)] hidden sm:block">
                  Clean crisp theme
                </span>
              </div>
            </button>

            {/* Dark */}
            <button
              type="button"
              onClick={() => handleThemeChange('dark')}
              className={cn(
                'p-3 sm:p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between min-h-[5.5rem] sm:min-h-[6.5rem]',
                currentThemePref === 'dark'
                  ? 'border-black dark:border-white ring-2 ring-black/10 dark:ring-white/20 bg-[var(--color-surface-secondary)]'
                  : 'border-[var(--color-border-primary)] hover:border-[var(--color-border-hover)] bg-[var(--color-surface-primary)]'
              )}
            >
              <div className="flex items-center justify-between w-full">
                <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--color-text-primary)]" />
                {currentThemePref === 'dark' && (
                  <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--color-text-primary)]" strokeWidth={2.5} />
                )}
              </div>
              <div>
                <span className="text-xs sm:text-sm font-semibold text-[var(--color-text-primary)] block">
                  Dark
                </span>
                <span className="text-[10px] sm:text-xs text-[var(--color-text-tertiary)] hidden sm:block">
                  Refined dark theme
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Currency & Localization */}
        <div className="apple-card p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-[var(--color-border)]">
            <div
              className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center"
              style={{ background: 'var(--color-fill-secondary)' }}
            >
              <Coins className="w-5 h-5 text-[var(--color-accent)]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                Currency & Region
              </h2>
              <p className="text-xs text-[var(--color-text-tertiary)]">
                Configure default transaction units and date/number formatting
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Select
              label="Default Currency"
              error={errors.preferred_currency?.message}
              {...register('preferred_currency')}
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} ({c.symbol}) — {c.name}
                </option>
              ))}
            </Select>

            <Select
              label="Date & Number Format Locale"
              error={errors.preferred_locale?.message}
              {...register('preferred_locale')}
            >
              {LOCALES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            loading={isSubmitting}
            disabled={!isDirty}
            className="w-full sm:w-auto h-11 px-6 text-sm font-semibold"
          >
            Save Preferences
          </Button>
        </div>
      </form>

      {/* Spaces & Organizations Management */}
      <div className="apple-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-accent)]/10 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5 text-[var(--color-accent)]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                Spaces & Organizations
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Organize expenses into separate spaces (e.g. Personal, House, Garage) under one account
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setCreateSpaceModalOpen(true)}
            className="self-start sm:self-auto inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>New Space</span>
          </Button>
        </div>

        {/* Space list items */}
        <div className="divide-y divide-[var(--color-border-primary)] rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-surface-secondary)]/30 overflow-hidden">
          {app.spaces.length === 0 ? (
            <div className="p-4 text-center text-xs text-[var(--color-text-tertiary)]">
              No spaces configured yet.
            </div>
          ) : (
            app.spaces.map((space) => {
              const initial = (space.name[0] || 'S').toUpperCase()
              return (
                <div
                  key={space.id}
                  className="p-3.5 flex items-center justify-between gap-3 hover:bg-[var(--color-surface-hover)]/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center font-bold text-xs border"
                      style={{
                        backgroundColor: space.color ? `${space.color}15` : 'var(--color-surface-primary)',
                        borderColor: space.color ? `${space.color}40` : 'var(--color-border-primary)',
                        color: space.color || 'var(--color-text-primary)',
                      }}
                    >
                      {initial}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                          {space.name}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingSpace(space)
                        setEditSpaceModalOpen(true)
                      }}
                      className="h-8 px-2.5 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                    >
                      <Pencil className="w-3.5 h-3.5 mr-1" />
                    </Button>

                    {!space.is_default && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDeletingSpace(space)
                          setDeleteSpaceModalOpen(true)
                        }}
                        className="h-8 px-2.5 text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                      </Button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Data Management Link */}
      <div className="apple-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
            Data Portability & Backups
          </h2>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
            Export your entire spending records or import expenses from a CSV file
          </p>
        </div>
        <Link
          href="/import-export"
          className="btn-secondary inline-flex items-center gap-2 self-start sm:self-auto"
        >
          <span>Open Import / Export</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Danger Zone */}
      <div className="apple-card p-6 border-[var(--color-error)]/30 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-error)]/10 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5 text-[var(--color-error)]" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[var(--color-error)]">
              Danger Zone
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Irreversible account actions
            </p>
          </div>
        </div>

        <p className="text-sm text-[var(--color-text-secondary)]">
          Deleting your account will permanently remove all your transactions, custom categories,
          tags, and preference settings from the database. This action cannot be undone.
        </p>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => {
              setDeleteConfirmationText('')
              setDeleteModalOpen(true)
            }}
            className="px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium bg-[var(--color-error)] text-white dark:text-black hover:opacity-90 transition-opacity"
            id="btn-delete-account"
          >
            Delete Account
          </button>
        </div>
      </div>

      {/* Strict Delete Account Modal */}
      <Dialog
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Account Permanently"
        description="All your expense records and financial data will be permanently wiped."
      >
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-[var(--color-error)]/10 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[var(--color-error)] shrink-0 mt-0.5" />
            <p className="text-xs text-[var(--color-error)] leading-relaxed">
              Warning: This operation is permanent and cannot be undone. If you need a copy of
              your financial transactions, export your data before proceeding.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
              Type <strong className="text-[var(--color-text-primary)]">DELETE</strong> to confirm:
            </label>
            <input
              type="text"
              value={deleteConfirmationText}
              onChange={(e) => setDeleteConfirmationText(e.target.value)}
              placeholder="DELETE"
              className="input-base"
              id="confirm-delete-input"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteConfirmationText !== 'DELETE'}
              loading={isDeleting}
              onClick={handleDeleteAccount}
              id="confirm-delete-submit"
            >
              Delete
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Spaces Modals */}
      <CreateSpaceModal
        open={createSpaceModalOpen}
        onClose={() => setCreateSpaceModalOpen(false)}
      />

      <EditSpaceModal
        space={editingSpace}
        open={editSpaceModalOpen}
        onClose={() => {
          setEditSpaceModalOpen(false)
          setEditingSpace(null)
        }}
      />

      <DeleteSpaceModal
        space={deletingSpace}
        open={deleteSpaceModalOpen}
        onClose={() => {
          setDeleteSpaceModalOpen(false)
          setDeletingSpace(null)
        }}
      />
    </div>
  )
}
