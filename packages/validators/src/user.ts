import { z } from 'zod'

export const updateProfileSchema = z.object({
  full_name:           z.string().min(1).max(120).optional(),
  avatar_url:          z.string().url().optional(),
  onboarding_complete: z.boolean().optional(),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
