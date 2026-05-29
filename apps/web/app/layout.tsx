// Root layout. CSP is set by middleware.ts (script-src 'self'
// 'unsafe-inline' — static-render-compatible; see the note there on why
// the nonce/strict-dynamic scheme was dropped).
import './globals.css'

export const metadata = {
  title: 'OurElected Europe — See how your representatives vote',
  description:
    'Track European legislation and follow exactly how your elected representatives vote on the bills that matter to you.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
