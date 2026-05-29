// Runs once on server startup (Next.js 15, stable). Importing env
// here makes the Zod validation in lib/env.ts actually fire —
// fail-fast on missing/invalid config instead of crashing later at
// the first request that happens to read process.env.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('@/lib/env')
  }
}
