import type { Metadata, Viewport } from "next";
import { Unbounded, Space_Grotesk } from "next/font/google";
import "./globals.css";

const display = Unbounded({ subsets: ["latin"], weight: ["500", "700", "800"], variable: "--f-display", display: "swap" });
const text = Space_Grotesk({ subsets: ["latin"], variable: "--f-text", display: "swap" });

export const metadata: Metadata = {
  title: "Outterspace — Cowboy Series Pop-Up",
  description: "The Outterspace Cowboy Series SS26 on stage. Join the guest list for the first Outterspace pop-up this November and open the full lookbook.",
};

export const viewport: Viewport = { themeColor: "#ffffff", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${text.variable}`}>
      <body>{children}</body>
    </html>
  );
}
