const securityHeaders = [
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self' https://www.google-analytics.com https://api.revolut.com https://sandbox-merchant.revolut.com",
      "media-src 'self' blob: https://*.cloudfront.net",
      "worker-src 'self' blob:",
      "frame-src 'self' blob: https://merchant.revolut.com https://sandbox-merchant.revolut.com https://iframe.mediadelivery.net",
    ].join('; '),
  },
]

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  eslint: { ignoreDuringBuilds: true },
  experimental: { serverComponentsExternalPackages: ['pg', 'pg-native', '@prisma/adapter-pg'] },
  headers: async () => [
    {
      source: '/(.*)',
      headers: securityHeaders,
    },
  ],
}

module.exports = nextConfig
