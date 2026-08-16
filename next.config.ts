import { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  env: {
    GOOGLE_MAPS_PLATFORM_KEY: process.env.GOOGLE_MAPS_PLATFORM_KEY || '',
  },
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  generateEtags: false,
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "date-fns",
      "motion",
      "embla-carousel-react",
      "@radix-ui/react-accordion",
      "@radix-ui/react-alert-dialog",
      "@radix-ui/react-avatar",
      "@radix-ui/react-checkbox",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-label",
      "@radix-ui/react-menubar",
      "@radix-ui/react-popover",
      "@radix-ui/react-progress",
      "@radix-ui/react-radio-group",
      "@radix-ui/react-scroll-area",
      "@radix-ui/react-select",
      "@radix-ui/react-separator",
      "@radix-ui/react-slider",
      "@radix-ui/react-slot",
      "@radix-ui/react-switch",
      "@radix-ui/react-tabs",
      "@radix-ui/react-toast",
      "@radix-ui/react-tooltip",
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
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
    "@opentelemetry/sdk-node",
    "@opentelemetry/api",
    "@google/genai",
    "twilio",
  ],
};

export default nextConfig;


