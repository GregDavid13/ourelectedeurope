// (app) layout — authed shell with a left sidebar. Access is gated by
// middleware (PROTECTED_ROUTES → redirect to /login when no session).
import { Sidebar } from '@/components/layout/Sidebar'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-eu-blue-50/40">
      <Sidebar />
      <main className="min-w-0 flex-1 px-8 py-10">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  )
}
