// import { withOpenNextConfig } from '@opennextjs/cloudflare';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    serverActions: true,
  },
};

// export default withOpenNextConfig(nextConfig);

export default nextConfig;
