// Root layout. The CSP nonce is set by middleware on the request;
// Next.js automatically applies it to its own injected <script> tags
// when a nonce-based CSP is present — the layout does not need to
// thread it manually. Pass `headers().get('x-nonce')` to a
// `next/script` only if you add custom inline scripts.
import './globals.css'

export const metadata = {
  title: 'ourelectedeurope',
  description: 'Scaffold from the SaaS Master Framework',
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
