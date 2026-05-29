// Stripe SDK — SERVER ONLY. Never import from client/RN code.
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20', // pin; must match @stripe/stripe-react-native
  typescript: true,
})
