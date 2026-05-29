'use client'
// Route-segment error boundary. Logs the error (so 500s leave a trail)
// and shows the digest the server emits, which you can grep in logs.
import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[app error]', error)
  }, [error])

  return (
    <main style={{ padding: '2rem', maxWidth: 480 }}>
      <h1>Something went wrong</h1>
      <p>An unexpected error occurred. Please try again.</p>
      {error.digest && (
        <p style={{ color: '#666', fontSize: '0.875rem' }}>
          Reference: {error.digest}
        </p>
      )}
      <button onClick={reset}>Try again</button>
    </main>
  )
}
