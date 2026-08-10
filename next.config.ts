import { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*.run.app", "ais-dev-rck7pkkzbemjyebvsxpiib-197089124330.europe-west2.run.app", "localhost:3000", "127.0.0.1:3000"],
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
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
    "@opentelemetry/sdk-node",
    "@opentelemetry/api",
  ],
};

export default nextConfig;
