// (auth) layout — centered card shell on the EU-blue field. The
// middleware already redirects authed users away from /login and
// /register, so this only renders for logged-out visitors.
import Link from 'next/link'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-eu-blue-900">
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="mb-8 flex items-center justify-center gap-2 text-lg font-bold text-white"
          >
            <span className="text-eu-gold-400" aria-hidden>★</span>
            OurElected<span className="text-eu-gold-400">Europe</span>
          </Link>

          <div className="rounded-2xl bg-white p-8 shadow-xl">
            {/* gold accent bar */}
            <div className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-eu-gold-400" />
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
