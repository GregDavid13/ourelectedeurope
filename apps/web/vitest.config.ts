import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

// App-layer unit tests. The DB has its own gate (supabase test db);
// this is the equivalent posture for app code so it doesn't trend
// untested. Aliases mirror tsconfig paths + workspace packages so
// tests resolve without a build step.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.test.ts', '**/*.test.tsx'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
      '@gregdavid13/permissions': resolve(__dirname, '../../packages/permissions/src'),
      '@gregdavid13/validators': resolve(__dirname, '../../packages/validators/src'),
      '@gregdavid13/stripe': resolve(__dirname, '../../packages/stripe/src'),
      '@gregdavid13/crypto': resolve(__dirname, '../../packages/crypto/src'),
    },
  },
})
