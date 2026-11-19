import type { NextConfig } from "next";

const API_URL = (process.env.API_URL ?? "http://localhost:5001").replace(/\/$/, "");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Browser -> /api/* (same origin) -> Express. Keeps the session cookie first-party, which avoids
  // third-party-cookie blocking when the frontend (Vercel) and API (Render) live on different domains.
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_URL}/api/:path*` }];
  },
};

export default nextConfig;
