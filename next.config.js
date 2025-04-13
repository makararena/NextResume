/**
 * Next.js Configuration
 * 
 * Production-ready configuration for the Next.js application with
 * performance optimizations and security enhancements.
 */

/** @type {import('next').NextConfig} */

const nextConfig = {
  experimental: {
    serverActions: {
      // Increase body size limit for uploading resumes and profiles
      bodySizeLimit: "4mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: '**.public.blob.vercel-storage.com'
      }
    ]
  },
  // Enable output filesystem caching for better performance
  output: 'standalone',
  // Remove the powered-by header for security
  poweredByHeader: false,
  // Increase static generation concurrency for faster builds
  staticPageGenerationTimeout: 120,
  // Set strict mode for better development experience
  reactStrictMode: true,
  // Compress assets for smaller file sizes
  compress: true,
  // Ignore TypeScript errors during build process
  typescript: {
    ignoreBuildErrors: true,
  },
  // Ignore ESLint errors during build process
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Configure Content Security Policy
  headers: async () => {
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
        ],
      },
    ];
  },
};

module.exports = nextConfig;
