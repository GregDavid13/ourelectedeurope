// Resend client + helpers. STUB — wire React Email templates per
// Master Framework Part 5.
import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail(_args: { to: string; subject: string; html: string }) {
  throw new Error('TODO: implement Resend send + React Email templates')
}
