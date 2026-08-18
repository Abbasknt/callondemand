import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: [
    "react-remove-scroll",
    "react-remove-scroll-bar",
  ],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  env: {
    GOOGLE_MAPS_PLATFORM_KEY: process.env.GOOGLE_MAPS_PLATFORM_KEY || '',
  },
  async redirects() {
    return [
      { source: '/services/shipping', destination: '/logistics', permanent: true },
      { source: '/services/errands', destination: '/logistics', permanent: true },
      { source: '/profile', destination: '/settings', permanent: true },
      { source: '/orders', destination: '/services', permanent: true },
      { source: '/cart', destination: '/services/shop', permanent: true },
      { source: '/checkout', destination: '/services/shop', permanent: true },
      { source: '/drive', destination: '/dashboard/drive', permanent: true },
      { source: '/notifications', destination: '/settings', permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
        port: "",
        pathname: "/**",
      },
    ],
  },
  serverExternalPackages: [
    "genkit",
    "@genkit-ai/google-genai",
    "@genkit-ai/core",
    "@genkit-ai/ai",
    "@genkit-ai/flow",
    "firebase-admin",
    "@grpc/grpc-js",
    "@grpc/proto-loader",
    "@google-cloud/firestore",
    "@google-cloud/storage",
    "@google-cloud/paginator",
    "@google-cloud/projectify",
    "@google-cloud/promisify",
    "@google-cloud/common",
    "@google-cloud/logging",
    "google-gax",
    "@opentelemetry/sdk-node",
    "@opentelemetry/api",
    "@google/genai",
    "twilio",
  ],
};

export default nextConfig;


