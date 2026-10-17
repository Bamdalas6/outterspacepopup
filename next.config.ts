import type { NextConfig } from "next";

// Built for Vercel: a normal Next.js build, which Vercel detects and deploys with no extra settings. Every page is still
// pre-rendered to static HTML at build time and served from Vercel's edge; the guest list talks to Supabase straight
// from the browser, so there is no server code to run.

const security = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  trailingSlash: true,
  allowedDevOrigins: ["127.0.0.1"],
  async headers() {
    return [
      { source: "/:path*", headers: security },
      // The admin page should never show up in search results or be cached by a shared cache.
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }, { key: "Cache-Control", value: "private, no-store" }] },
      // Product pictures and campaign photos never change under the same name, so browsers can keep them for a week.
      { source: "/:dir(garments|editorial)/:file*", headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }] },
    ];
  },
};

export default nextConfig;
