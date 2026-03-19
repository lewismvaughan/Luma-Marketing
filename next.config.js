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
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
}

module.exports = nextConfig