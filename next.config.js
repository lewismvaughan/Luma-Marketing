/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  trailingSlash: true,
  experimental: {
    inlineCss: true,
    optimizePackageImports: [
      'lucide-react',
      '@stripe/react-stripe-js',
      '@stripe/stripe-js',
      'framer-motion',
      'socket.io-client',
    ],
  },
  images: {
    domains: [],
    // Restrict the Next image optimizer to our own hosts (was '**', which let
    // any HTTPS host be proxied through /_next/image). Covers images.lumapos.co,
    // dev.images.lumapos.co, api.*.lumapos.co, etc.
    remotePatterns: [
      { protocol: 'https', hostname: 'lumapos.co' },
      { protocol: 'https', hostname: '**.lumapos.co' },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
}

module.exports = nextConfig