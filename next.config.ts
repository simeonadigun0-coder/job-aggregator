import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This app is fully dynamic — all pages require auth/session context.
  // Disabling static generation prevents prerender failures when env vars
  // (Supabase URL, keys) are absent at build time.
  output: 'standalone',
  experimental: {
    // Ensure server actions and dynamic routes work correctly on Vercel
  },
};

export default nextConfig;
