// Register page. Server Component — renders the client RegisterForm
// inside the (auth) card layout.
import type { Metadata } from 'next'
import { RegisterForm } from '@/components/auth/RegisterForm'

export const metadata: Metadata = { title: 'Sign up · OurElected Europe' }

export default function Page() {
  return <RegisterForm />
}
