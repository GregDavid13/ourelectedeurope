// Marketing hero — deep EU-blue gradient with gold accents. Server
// component. The CTAs route into the (auth) flow and the explore path.
import Link from 'next/link'
import { buttonClasses } from '../ui/Button'

// EU's 12 stars, as a decorative ring behind the hero.
const STARS = Array.from({ length: 12 })

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-eu-blue-900 text-white">
      {/* decorative star ring */}
      <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.07]">
        <div className="relative h-[34rem] w-[34rem]">
          {STARS.map((_, i) => {
            const angle = (i / STARS.length) * 2 * Math.PI
            const r = 15.5
            const x = 50 + r * Math.cos(angle)
            const y = 50 + r * Math.sin(angle)
            return (
              <span
                key={i}
                className="absolute -translate-x-1/2 -translate-y-1/2 text-6xl text-eu-gold-400"
                style={{ left: `${x}%`, top: `${y}%` }}
              >
                ★
              </span>
            )
          })}
        </div>
      </div>

      <div className="relative mx-auto max-w-5xl px-6 py-24 text-center sm:py-32">
        <span className="inline-flex items-center gap-2 rounded-full border border-eu-gold-400/40 bg-eu-blue-800/50 px-4 py-1.5 text-sm font-medium text-eu-gold-300">
          <span aria-hidden>★</span> Independent · Transparent · Free
        </span>

        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
          See how your representatives
          <span className="text-eu-gold-400"> actually vote.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-eu-blue-100 sm:text-xl">
          Follow European bills from proposal to final vote — and find out
          exactly where the politicians who represent you stood on every one
          of them.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/register" className={buttonClasses('gold', 'lg')}>
            Create free account
          </Link>
          <Link href="#bills" className={buttonClasses('outline', 'lg', 'border-white text-white hover:bg-white/10')}>
            Explore bills
          </Link>
        </div>
      </div>
    </section>
  )
}
