'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { loginSchema, type LoginFormValues } from '@/lib/validations/schemas'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/FormFields'
import { Button } from '@/components/ui/Button'
import type { Metadata } from 'next'

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(values: LoginFormValues) {
    setServerError(null)
    const supabase = createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    })

    if (error) {
      setServerError(
        error.message.includes('Invalid')
          ? 'Incorrect email or password. Please try again.'
          : error.message
      )
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">
          Welcome back
        </h1>
        <p className="text-[var(--color-text-secondary)] mt-1 text-sm">
          Sign in to your Spendly account
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {serverError && (
          <div
            className="px-4 py-3 rounded-[var(--radius-md)] text-sm"
            style={{ background: 'var(--color-error-bg)', color: 'var(--color-error-text)' }}
            role="alert"
          >
            {serverError}
          </div>
        )}

        <Input
          label="Email address"
          type="email"
          id="login-email"
          autoComplete="email"
          placeholder="you@example.com"
          leftIcon={<Mail className="w-4 h-4" />}
          error={errors.email?.message}
          {...register('email')}
        />

        <div>
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            id="login-password"
            autoComplete="current-password"
            placeholder="••••••••"
            leftIcon={<Lock className="w-4 h-4" />}
            error={errors.password?.message}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            }
            {...register('password')}
          />
          <div className="flex justify-end mt-1.5">
            <Link
              href="/forgot-password"
              className="text-sm text-[var(--color-text-link)] hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          loading={isSubmitting}
          className="w-full"
          id="login-submit"
        >
          Sign in
        </Button>
      </form>

      <p className="text-center text-sm text-[var(--color-text-secondary)]">
        Don&apos;t have an account?{' '}
        <Link
          href="/signup"
          className="font-medium text-[var(--color-text-link)] hover:underline"
        >
          Create one
        </Link>
      </p>
    </div>
  )
}
