import type { Metadata } from "next";
import "./globals.css";

const APP_URL = process.env.APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Ticket Buddy — Find It. Book It. Be There.",
    template: "%s — Ticket Buddy",
  },
  description: "Pakistan's platform for concerts, conferences & live events. Browse events, book tickets in minutes, and pay easily with a simple, secure booking process.",
  openGraph: {
    title: "Ticket Buddy — Find It. Book It. Be There.",
    description: "Pakistan's platform for concerts, conferences & live events.",
    siteName: "Ticket Buddy",
    images: [{ url: "/social-share.jpg", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ticket Buddy — Find It. Book It. Be There.",
    description: "Pakistan's platform for concerts, conferences & live events.",
    images: ["/social-share.jpg"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">{children}</body>
    </html>
  );
}
