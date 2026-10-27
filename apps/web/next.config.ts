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

  async rewrites() {
    if (!devApiProxy) return [];
    return [
      { source: '/api/:path*', destination: `${devApiProxy}/api/:path*` },
      { source: '/uploads/:path*', destination: `${devApiProxy}/uploads/:path*` },
    ];
  },
};

export default withNextIntl(nextConfig);
