// ForgotPasswordForm — triggers a Supabase password-reset email. The
// link returns the user to /reset-password (still a scaffold stub —
// implement it to complete the flow). We always show the same success
// state regardless of whether the email exists, to avoid leaking which
// addresses are registered.
'use client'
import { useState } from 'react'
import Link from 'next/link'
import { z } from 'zod'
import { createClient } from '@/lib/supabase-browser'
import { Button } from '@/components/ui/Button'

const emailSchema = z.string().email()

const field =
  'mt-1 block w-full rounded-lg border border-eu-blue-200 px-3 py-2 text-eu-blue-950 ' +
  'placeholder:text-eu-blue-300 focus:border-eu-blue-600 focus:outline-none focus:ring-2 focus:ring-eu-blue-200'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!emailSchema.safeParse(email).success) {
      setError('Please enter a valid email address.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    // We intentionally ignore the result's error detail for the UI: same
    // confirmation either way (no account enumeration).
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)
    setDone(true)
  }

  if (done) {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-eu-gold-100 text-2xl">
          ✉️
        </div>
        <h1 className="mt-4 text-2xl font-bold text-eu-blue-900">Check your inbox</h1>
        <p className="mt-2 text-sm text-eu-blue-700/70">
          If an account exists for <span className="font-medium">{email}</span>,
          we&apos;ve sent a link to reset your password.
        </p>
        <Link href="/login" className="mt-6 inline-block text-sm font-semibold text-eu-blue-700 hover:underline">
          Back to log in
        </Link>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-center text-2xl font-bold text-eu-blue-900">Reset your password</h1>
      <p className="mt-2 text-center text-sm text-eu-blue-700/70">
        Enter your email and we&apos;ll send you a reset link.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        <label className="block text-sm font-medium text-eu-blue-900">
          Email
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={field}
            placeholder="you@example.com"
          />
        </label>

        <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
          {loading ? 'Sending…' : 'Send reset link'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-eu-blue-700/70">
        Remembered it?{' '}
        <Link href="/login" className="font-semibold text-eu-blue-700 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  )
}
