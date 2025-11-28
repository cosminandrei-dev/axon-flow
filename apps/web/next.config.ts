import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
  },
};

// Bundle analyzer integration
const withBundleAnalyzer = async (config: NextConfig) => {
  if (process.env.ANALYZE === 'true') {
    const bundleAnalyzer = await import('@next/bundle-analyzer');
    return bundleAnalyzer.default({ enabled: true })(config);
  }
  return config;
};

export default withBundleAnalyzer(nextConfig);
