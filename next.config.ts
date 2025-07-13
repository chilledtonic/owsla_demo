import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  // Simplified webpack config to prevent module loading issues
  webpack: (config, { isServer }) => {
    // Ignore node-specific modules in browser bundles
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    
    return config;
  },
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'covers.openlibrary.org',
        port: '',
        pathname: '/b/**',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        port: '',
        pathname: '/vi/**',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
        port: '',
        pathname: '/vi/**',
      },
      
    ],
  },

  // Experimental features to improve stability
  experimental: {
    // Optimize package imports
    optimizePackageImports: ['@stackframe/stack', 'lucide-react'],
  },
};

export default nextConfig;
