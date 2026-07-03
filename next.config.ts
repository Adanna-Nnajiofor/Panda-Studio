import type { NextConfig } from "next";

function readApiBaseEnv(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    process.env.INTERNAL_API_BASE_URL ??
    process.env.BACKEND_URL ??
    process.env.NEXT_PUBLIC_BACKEND_URL
  )?.trim();
}

function resolveBackendRoot(): string {
  const apiBase = readApiBaseEnv()?.replace(/\/$/, "");
  if (apiBase) {
    return apiBase.endsWith("/api") ? apiBase.slice(0, -4) : apiBase;
  }

  if (process.env.NODE_ENV === "production") {
    return "https://panda-studio.onrender.com";
  }

  return "http://localhost:5000";
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const backendRoot = resolveBackendRoot();

    return [
      {
        source: "/api/academy/:path*",
        destination: `${backendRoot}/api/academy/:path*`,
      },
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
