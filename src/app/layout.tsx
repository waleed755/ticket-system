import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gatherly — Discover & Book Amazing Events",
  description: "Browse events, book tickets in minutes, and manage everything from one account.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">{children}</body>
    </html>
  );
}
