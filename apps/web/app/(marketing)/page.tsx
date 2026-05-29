// Landing page. Server Component — composes the marketing sections.
// Header/footer come from the (marketing) layout.
import Link from 'next/link'
import { Hero } from '@/components/marketing/Hero'
import { FeatureGrid } from '@/components/marketing/FeatureGrid'
import { BillsPreview } from '@/components/marketing/BillsPreview'
import { buttonClasses } from '@/components/ui/Button'

const STATS = [
  { value: '705', label: 'Members of the European Parliament' },
  { value: '27', label: 'Member states represented' },
  { value: 'Every', label: 'Roll-call vote, on the record' },
]

export default function Page() {
  return (
    <>
      <Hero />

      {/* stat strip */}
      <section className="border-y border-eu-blue-100 bg-white">
        <div className="mx-auto grid max-w-5xl gap-8 px-6 py-12 text-center sm:grid-cols-3">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-extrabold text-eu-blue-700 sm:text-4xl">{s.value}</div>
              <div className="mt-1 text-sm text-eu-blue-700/70">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <FeatureGrid />

      <BillsPreview />

      {/* closing CTA */}
      <section className="bg-eu-blue-900 text-white">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Know where they stand <span className="text-eu-gold-400">before</span> the next vote.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-eu-blue-100">
            Create a free account to follow your representatives and get the
            voting record that matters to you.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/register" className={buttonClasses('gold', 'lg')}>
              Get started — it&apos;s free
            </Link>
            <Link href="/login" className={buttonClasses('outline', 'lg', 'border-white text-white hover:bg-white/10')}>
              Log in
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
