import type { Metadata, Viewport } from "next";
import { Unbounded, Space_Grotesk } from "next/font/google";
import "./globals.css";

const display = Unbounded({ subsets: ["latin"], weight: ["500", "700", "800"], variable: "--f-display", display: "swap" });
const text = Space_Grotesk({ subsets: ["latin"], variable: "--f-text", display: "swap" });

// Link previews need full addresses. On Vercel this is the project's production domain (your own domain once one is
// added as production); NEXT_PUBLIC_SITE_URL overrides it.
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "https://outterspacepopup.vercel.app");

const TITLE = "Outterspace — Cowboy Series Pop-Up";
const DESCRIPTION = "The first Outterspace pop-up, November 2026. Join the guest list for the Cowboy Series SS26 and open the full lookbook.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Outterspace",
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_NG",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Outterspace Cowboy Series — the first Outterspace pop-up, November 2026. Join the guest list." }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og.jpg"],
  },
};

export const viewport: Viewport = { themeColor: "#ffffff", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${text.variable}`}>
      <body>{children}</body>
    </html>
  );
}
