import path from 'node:path';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const devApiProxy = process.env.API_PROXY_URL;

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.resolve(process.cwd(), '../..'),
  poweredByHeader: false,
  reactStrictMode: true,
  agentRules: false,

  experimental: {
    optimizePackageImports: ['react-bootstrap'],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },

  async rewrites() {
    if (!devApiProxy) return [];
    return [
      { source: '/api/:path*', destination: `${devApiProxy}/api/:path*` },
      { source: '/uploads/:path*', destination: `${devApiProxy}/uploads/:path*` },
    ];
  },
};

export default withNextIntl(nextConfig);
