/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel deployment optimizations  
  trailingSlash: false,
  
  // Image optimization for Vercel
  images: {
    unoptimized: true,
    domains: ['portal.aurafarming.co'],
  },
  
  // React optimizations
  reactStrictMode: true,
  swcMinify: true,
  
  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://portal.aurafarming.co/api',
  },
  
  // API rewrites to DigitalOcean backend
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'https://portal.aurafarming.co/api'}/:path*`
      }
    ]
  },
  
  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          }
        ],
      },
    ]
  },
}

module.exports = nextConfig 