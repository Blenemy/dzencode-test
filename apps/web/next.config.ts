import path from 'node:path';
import type { NextConfig } from 'next';

const devApiProxy = process.env.API_PROXY_URL;

const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.resolve(process.cwd(), '../..'),
  poweredByHeader: false,
  reactStrictMode: true,

  async rewrites() {
    if (!devApiProxy) return [];
    return [{ source: '/api/:path*', destination: `${devApiProxy}/api/:path*` }];
  },
};

export default nextConfig;
