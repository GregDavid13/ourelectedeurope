// SignOutButton — clears the Supabase session (cookies) and returns to
// the login page. Client component.
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { Button } from '@/components/ui/Button'

export function SignOutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function onClick() {
    setLoading(true)
    await createClient().auth.signOut()
    router.refresh()
    router.push('/login')
  }

  return (
    <Button variant="ghost" size="sm" onClick={onClick} disabled={loading}>
      {loading ? 'Signing out…' : 'Sign out'}
    </Button>
  )
}
