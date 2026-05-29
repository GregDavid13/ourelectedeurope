// Forgot-password page. Server Component — renders the client
// ForgotPasswordForm inside the (auth) card layout.
import type { Metadata } from 'next'
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'

export const metadata: Metadata = { title: 'Reset password · OurElected Europe' }

export default function Page() {
  return <ForgotPasswordForm />
}
