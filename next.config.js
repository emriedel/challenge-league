/** @type {import('next').NextConfig} */
const nextConfig = {
  // Temporary fix for hot-reload API route issues
  reactStrictMode: false,
  swcMinify: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
    ],
    // Aggressive caching for optimized images (challenge photos are immutable)
    minimumCacheTTL: 31536000, // 1 year cache for optimized images
    // Reduce number of image variants to save bandwidth
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Experimental: Skip build-time optimizations for API routes that cause issues
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
  },
  // Ensure all API routes are treated as dynamic
  async headers() {
    return [
      // Root page - no caching due to dynamic auth check
      {
        source: '/',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      // Security headers for all pages
      {
        source: '/(.*)',
        headers: [
          // Content Security Policy - Allow necessary sources while preventing XSS
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' va.vercel-scripts.com", // Allow Vercel Analytics and inline scripts for PWA
              "style-src 'self' 'unsafe-inline'", // Allow inline styles for Tailwind
              "img-src 'self' data: blob: https://blob.vercel-storage.com https://*.public.blob.vercel-storage.com https://images.unsplash.com https://picsum.photos",
              "font-src 'self' data:",
              "connect-src 'self' https://vitals.vercel-insights.com wss:", // Allow Vercel Analytics and WebSocket connections
              "worker-src 'self'", // Allow service workers
              "manifest-src 'self'", // Allow PWA manifest
              "form-action 'self'", // Only allow forms to submit to same origin
              "base-uri 'self'", // Prevent base tag injection
              "object-src 'none'", // Disable plugins
              "frame-ancestors 'none'", // Prevent framing (clickjacking protection)
            ].join('; '),
          },
          // Additional security headers
          {
            key: 'X-Frame-Options',
            value: 'DENY', // Prevent framing
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff', // Prevent MIME sniffing
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin', // Control referrer information
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()', // Disable unnecessary permissions
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload', // Enforce HTTPS (production only)
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block', // Enable XSS filtering
          },
        ],
      },
      // API-specific headers
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
      // Service Worker headers
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript',
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      // Static asset caching
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Next.js optimized images - aggressive caching (challenge photos are immutable)
      {
        source: '/_next/image',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig