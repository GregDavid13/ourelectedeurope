// LoginForm — email/password sign-in via the browser Supabase client.
// Session is persisted in cookies (createBrowserClient), so a
// router.refresh() lets the middleware + server components pick up the
// authed state before navigating to the app.
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { loginSchema } from '@gregdavid13/validators'
import { createClient } from '@/lib/supabase-browser'
import { Button } from '@/components/ui/Button'

const field =
  'mt-1 block w-full rounded-lg border border-eu-blue-200 px-3 py-2 text-eu-blue-950 ' +
  'placeholder:text-eu-blue-300 focus:border-eu-blue-600 focus:outline-none focus:ring-2 focus:ring-eu-blue-200'

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const parsed = loginSchema.safeParse({ email, password })
    if (!parsed.success) {
      setError('Please enter a valid email and password.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword(parsed.data)
    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }
    router.refresh()
    router.push('/dashboard')
  }

  return (
    <div>
      <h1 className="text-center text-2xl font-bold text-eu-blue-900">Welcome back</h1>
      <p className="mt-2 text-center text-sm text-eu-blue-700/70">
        Log in to follow your representatives.
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

        <label className="block text-sm font-medium text-eu-blue-900">
          <span className="flex items-center justify-between">
            Password
            <Link href="/forgot-password" className="text-xs font-normal text-eu-blue-600 hover:underline">
              Forgot password?
            </Link>
          </span>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={field}
            placeholder="••••••••••••"
          />
        </label>

        <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
          {loading ? 'Logging in…' : 'Log in'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-eu-blue-700/70">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-semibold text-eu-blue-700 hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  )
}
