// (marketing) layout — shared public header + footer for all marketing
// pages. Server component.
import Link from 'next/link'
import { Footer } from '@/components/layout/Footer'
import { buttonClasses } from '@/components/ui/Button'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-eu-blue-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-eu-blue-900">
            <span className="text-eu-gold-400" aria-hidden>★</span>
            OurElected<span className="text-eu-gold-500">Europe</span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-medium text-eu-blue-800 md:flex">
            <Link href="/#bills" className="hover:text-eu-blue-600">Bills</Link>
            <Link href="/about" className="hover:text-eu-blue-600">How it works</Link>
            <Link href="/blog" className="hover:text-eu-blue-600">Blog</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login" className={buttonClasses('ghost', 'sm')}>
              Log in
            </Link>
            <Link href="/register" className={buttonClasses('primary', 'sm')}>
              Sign up
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <Footer />
    </div>
  )
}
