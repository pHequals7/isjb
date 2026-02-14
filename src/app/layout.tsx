import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Indian Startup Jobs Board",
  description:
    "Browse jobs at top VC-backed startups in India. Companies from PeakXV, Accel, Lightspeed, Nexus VP, and General Catalyst — all in one place.",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Indian Startup Jobs Board",
    description:
      "Browse jobs at top VC-backed startups in India. Companies from PeakXV, Accel, Lightspeed, Nexus VP, and General Catalyst — all in one place.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
