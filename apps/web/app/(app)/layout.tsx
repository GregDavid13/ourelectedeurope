// (app) layout — authed shell. Access is gated by middleware
// (PROTECTED_ROUTES → redirect to /login when no session). Minimal
// header for now; sidebar/nav comes later as the app grows.
import Link from 'next/link'
import { SignOutButton } from '@/components/layout/SignOutButton'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-eu-blue-50/40">
      <header className="border-b border-eu-blue-100 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-eu-blue-900">
            <span className="text-eu-gold-400" aria-hidden>★</span>
            OurElected<span className="text-eu-gold-500">Europe</span>
          </Link>
          <SignOutButton />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">{children}</main>
    </div>
  )
}
