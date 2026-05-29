// Site footer — used by the marketing layout. Server component.
import Link from 'next/link'

const cols = [
  {
    title: 'Explore',
    links: [
      { label: 'Bills', href: '/' },
      { label: 'Representatives', href: '/' },
      { label: 'How it works', href: '/about' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Blog', href: '/blog' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy', href: '/legal/privacy' },
      { label: 'Terms', href: '/legal/terms' },
      { label: 'Security', href: '/legal/security-policy' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="border-t border-eu-blue-100 bg-eu-blue-950 text-eu-blue-100">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 text-white">
            <span className="text-eu-gold-400" aria-hidden>★</span>
            <span className="font-bold">OurElected<span className="text-eu-gold-400">Europe</span></span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-eu-blue-200">
            Transparent tracking of European legislation and the voting
            records of your elected representatives.
          </p>
        </div>
        {cols.map((col) => (
          <div key={col.title}>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-eu-gold-400">
              {col.title}
            </h3>
            <ul className="mt-4 space-y-2 text-sm">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-eu-blue-800 px-6 py-6 text-center text-xs text-eu-blue-300">
        © {new Date().getFullYear()} OurElected Europe. Not affiliated with
        the European Union or any of its institutions.
      </div>
    </footer>
  )
}
