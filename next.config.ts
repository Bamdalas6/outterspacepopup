import type { NextConfig } from "next";

// A fully static site: `next build` writes plain files to ./out. Vercel serves that with either project setting (the
// Next.js preset, or Output Directory "out"), and so can any other host. The guest list talks to Supabase straight
// from the browser, so there is no server code. Security and caching headers live in vercel.json, where Vercel applies
// them to the static files.

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
