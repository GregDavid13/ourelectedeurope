// Dashboard — landing screen after login. Server Component. Reads the
// authed user via the RLS-scoped server client. Placeholder content for
// now (the real bills/representatives feed comes with that data model).
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase-server'

export const metadata: Metadata = { title: 'Dashboard · OurElected Europe' }

const PLACEHOLDERS = [
  { title: 'Bills you follow', body: 'Track legislation and get notified when it comes to a vote.' },
  { title: 'Your representatives', body: "Pick your MEPs and see how they vote — coming soon." },
  { title: 'Recent votes', body: 'The latest roll-call results from the European Parliament.' },
]

export default async function Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const greeting = user?.email ?? 'there'

  return (
    <div>
      <h1 className="text-2xl font-bold text-eu-blue-900">
        Welcome, <span className="text-eu-blue-700">{greeting}</span>
      </h1>
      <p className="mt-2 text-eu-blue-700/70">
        Your dashboard is just getting started. Here&apos;s what&apos;s coming.
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {PLACEHOLDERS.map((card) => (
          <div
            key={card.title}
            className="rounded-2xl border border-eu-blue-100 bg-white p-6 shadow-sm"
          >
            <div className="mb-3 h-1 w-10 rounded-full bg-eu-gold-400" />
            <h2 className="text-lg font-semibold text-eu-blue-900">{card.title}</h2>
            <p className="mt-2 text-sm text-eu-blue-700/70">{card.body}</p>
            <span className="mt-4 inline-block rounded-full bg-eu-blue-50 px-2.5 py-0.5 text-xs font-medium text-eu-blue-600">
              Coming soon
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
