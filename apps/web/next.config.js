/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@gregdavid13/db', '@gregdavid13/stripe', '@gregdavid13/crypto',
    '@gregdavid13/permissions', '@gregdavid13/validators', '@ourelectedeurope/ui',
  ],
  compiler: {
    // Strip console.* in production (keep error/warn).
    removeConsole: process.env.NODE_ENV === 'production'
      ? { exclude: ['error', 'warn'] }
      : false,
  },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**.supabase.co' }],
  },
}
module.exports = nextConfig
