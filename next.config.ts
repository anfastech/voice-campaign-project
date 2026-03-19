import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,

  serverExternalPackages: [
    '@prisma/client',
    '@prisma/adapter-pg',
    'pg',
    'pg-native',
    '@anthropic-ai/sdk',
    'papaparse',
    'ultravox-client',
  ],

  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'date-fns'],
  },

  turbopack: {},
};

export default nextConfig;
