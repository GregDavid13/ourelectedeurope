// Account — authed screen. Shows the signed-in user's account details
// read via the RLS-scoped server client (a user can only see their own
// profile row). Server Component.
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase-server'
import { SignOutButton } from '@/components/layout/SignOutButton'

export const metadata: Metadata = { title: 'Account · OurElected Europe' }

export default async function Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Own profile row (RLS: users_own_profile). May be null if the row
  // hasn't been created yet.
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('tier, onboarding_complete, created_at')
    .eq('id', user?.id ?? '')
    .maybeSingle()

  const rows: { label: string; value: string }[] = [
    { label: 'Email', value: user?.email ?? '—' },
    { label: 'Plan', value: profile?.tier ?? 'free' },
    {
      label: 'Member since',
      value: profile?.created_at
        ? new Date(profile.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
        : '—',
    },
    { label: 'User ID', value: user?.id ?? '—' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-eu-blue-900">Account</h1>
      <p className="mt-2 text-eu-blue-700/70">Your profile and sign-in details.</p>

      <div className="mt-8 overflow-hidden rounded-2xl border border-eu-blue-100 bg-white shadow-sm">
        <dl className="divide-y divide-eu-blue-50">
          {rows.map((row) => (
            <div key={row.label} className="flex flex-col gap-1 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <dt className="text-sm font-medium text-eu-blue-700/70">{row.label}</dt>
              <dd className="break-all text-sm font-medium text-eu-blue-900 sm:text-right">{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-8 rounded-2xl border border-eu-blue-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-eu-blue-900">Session</h2>
        <p className="mt-1 text-sm text-eu-blue-700/70">Sign out of OurElected Europe on this device.</p>
        <div className="mt-4">
          <SignOutButton />
        </div>
      </div>
    </div>
  )
}
