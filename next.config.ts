import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  distDir: 'dist',
  images: {
    unoptimized: true
  },
  assetPrefix: process.env.NODE_ENV === 'production' ? '/budget-tracker/' : '',
  basePath: process.env.NODE_ENV === 'production' ? '/budget-tracker' : ''
};

export default nextConfig;
