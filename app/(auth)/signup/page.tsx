'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react'
import { signupSchema, type SignupFormValues } from '@/lib/validations/schemas'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/FormFields'
import { Button } from '@/components/ui/Button'

export default function SignupPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  })

  async function onSubmit(values: SignupFormValues) {
    setServerError(null)
    const supabase = createClient()

    const redirectOrigin = process.env.NEXT_PUBLIC_APP_URL || window.location.origin

    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: { display_name: values.displayName },
        emailRedirectTo: `${redirectOrigin}/login`,
      },
    })

    if (error) {
      setServerError(error.message)
      return
    }

    // If email confirmation is disabled, sign in immediately
    if (data.session) {
      router.push('/dashboard')
      router.refresh()
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <div className="space-y-4 text-center page-enter">
        <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center" style={{ background: 'var(--color-success-bg)' }}>
          <svg className="w-8 h-8" style={{ color: 'var(--color-success-text)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Check your email</h1>
        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
          We&apos;ve sent a confirmation link to your email address.
          Please click it to activate your account, then sign in.
        </p>
        <Link href="/login" className="btn-primary inline-flex mt-2">
          Go to sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">
          Create your account
        </h1>
        <p className="text-[var(--color-text-secondary)] mt-1 text-sm">
          Start tracking your expenses today
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
          label="Full name"
          type="text"
          id="signup-name"
          autoComplete="name"
          placeholder="Jane Doe"
          leftIcon={<User className="w-4 h-4" />}
          error={errors.displayName?.message}
          {...register('displayName')}
        />

        <Input
          label="Email address"
          type="email"
          id="signup-email"
          autoComplete="email"
          placeholder="you@example.com"
          leftIcon={<Mail className="w-4 h-4" />}
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          id="signup-password"
          autoComplete="new-password"
          placeholder="Minimum 8 characters"
          leftIcon={<Lock className="w-4 h-4" />}
          error={errors.password?.message}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
          {...register('password')}
        />

        <Input
          label="Confirm password"
          type={showConfirm ? 'text' : 'password'}
          id="signup-confirm-password"
          autoComplete="new-password"
          placeholder="Repeat your password"
          leftIcon={<Lock className="w-4 h-4" />}
          error={errors.confirmPassword?.message}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowConfirm((p) => !p)}
              className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
          {...register('confirmPassword')}
        />

        <Button
          type="submit"
          loading={isSubmitting}
          className="w-full"
          id="signup-submit"
        >
          Create account
        </Button>

        <p className="text-center text-xs text-[var(--color-text-tertiary)]">
          By creating an account you agree to our terms of service and privacy policy.
        </p>
      </form>

      <p className="text-center text-sm text-[var(--color-text-secondary)]">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-medium text-[var(--color-text-link)] hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
