// import { withOpenNextConfig } from '@opennextjs/cloudflare';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    serverActions: true,
    optimizeCss: false,
  },
};

// export default withOpenNextConfig(nextConfig);

export default nextConfig;
