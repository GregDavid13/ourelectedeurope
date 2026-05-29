// Left sidebar for the authed (app) area. Client component so it can
// highlight the active route. Primary nav (Overview, Legislation) sits
// at the top; Account + Sign out are pinned to the bottom.
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SignOutButton } from '@/components/layout/SignOutButton'

const PRIMARY = [
  { label: 'Overview', href: '/dashboard', icon: '🏛️' },
  { label: 'Legislation', href: '/legislation', icon: '📜' },
]

const BOTTOM = [{ label: 'Account', href: '/account', icon: '⚙️' }]

function NavItem({ label, href, icon, active }: { label: string; href: string; icon: string; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={[
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        active
          ? 'bg-eu-blue-700 text-white'
          : 'text-eu-blue-100 hover:bg-eu-blue-800 hover:text-white',
      ].join(' ')}
    >
      <span aria-hidden className="text-base">{icon}</span>
      {label}
    </Link>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <aside className="flex w-60 shrink-0 flex-col bg-eu-blue-900">
      {/* brand */}
      <Link href="/dashboard" className="flex h-16 items-center gap-2 px-5 font-bold text-white">
        <span className="text-eu-gold-400" aria-hidden>★</span>
        OurElected<span className="text-eu-gold-400">Europe</span>
      </Link>

      {/* primary nav */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {PRIMARY.map((item) => (
          <NavItem key={item.href} {...item} active={isActive(item.href)} />
        ))}
      </nav>

      {/* bottom: account + sign out */}
      <div className="space-y-1 border-t border-eu-blue-800 px-3 py-4">
        {BOTTOM.map((item) => (
          <NavItem key={item.href} {...item} active={isActive(item.href)} />
        ))}
        <div className="px-1 pt-1">
          <SignOutButton />
        </div>
      </div>
    </aside>
  )
}
