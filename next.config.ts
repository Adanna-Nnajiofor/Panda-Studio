import type { NextConfig } from "next";

function resolveBackendRoot(): string {
  const apiBase = (
    process.env.INTERNAL_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "http://localhost:5000/api"
  ).replace(/\/$/, "");

  return apiBase.endsWith("/api") ? apiBase.slice(0, -4) : apiBase;
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const backendRoot = resolveBackendRoot();

    return [
      {
        source: "/api/backend/:path*",
        destination: `${backendRoot}/api/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
