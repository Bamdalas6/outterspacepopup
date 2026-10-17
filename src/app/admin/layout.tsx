import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Guest list admin — Outterspace",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
