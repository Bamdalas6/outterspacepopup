import type { NextConfig } from "next";

// A fully static site: `next build` writes plain files to ./out, which Cloudflare Pages serves. The backend (guest list,
// admin sign-in, receipt email) is the Cloudflare Pages Functions in ./functions, with the data in D1 (wrangler.toml).
// Security and caching headers for the static files live in public/_headers.

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
