import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Content-Security-Policy', value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'" },
    ] }];
  },
  /* config options here */
  reactStrictMode: false,
  // swcMinify: true,
  experimental: {
      //  appDir: true, // Ensure App Router is explicitly enabled
    externalDir: true, // Ensure API Routes are explicitly enabled
  },
  // Add this to help with potential trailing slash issues
  trailingSlash: false,
  // Improve build output for debugging
  output: 'standalone',
};

export default nextConfig;
