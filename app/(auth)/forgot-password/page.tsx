'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail } from 'lucide-react'
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '@/lib/validations/schemas'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/FormFields'
import { Button } from '@/components/ui/Button'

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  async function onSubmit(values: ForgotPasswordFormValues) {
    setServerError(null)
    const supabase = createClient()

    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      setServerError(error.message)
      return
    }

    setSent(true)
  }

  if (sent) {
    return (
      <div className="space-y-4 text-center page-enter">
        <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center" style={{ background: 'var(--color-info-bg)' }}>
          <Mail className="w-8 h-8" style={{ color: 'var(--color-accent)' }} />
        </div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Email sent</h1>
        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
          We&apos;ve sent you a password reset link. Check your inbox and follow the instructions.
        </p>
        <Link href="/login" className="btn-secondary inline-flex mt-2">
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">
          Reset your password
        </h1>
        <p className="text-[var(--color-text-secondary)] mt-1 text-sm">
          Enter your email and we&apos;ll send you a reset link
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
          id="forgot-email"
          autoComplete="email"
          placeholder="you@example.com"
          leftIcon={<Mail className="w-4 h-4" />}
          error={errors.email?.message}
          {...register('email')}
        />

        <Button
          type="submit"
          loading={isSubmitting}
          className="w-full"
          id="forgot-submit"
        >
          Send reset link
        </Button>
      </form>

      <p className="text-center text-sm text-[var(--color-text-secondary)]">
        Remembered your password?{' '}
        <Link href="/login" className="font-medium text-[var(--color-text-link)] hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
