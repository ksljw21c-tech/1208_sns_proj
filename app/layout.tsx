import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { koKR } from "@clerk/localizations";
import { Geist, Geist_Mono } from "next/font/google";

import { SyncUserProvider } from "@/components/providers/sync-user-provider";
import { ToastProvider } from "@/components/providers/toast-provider";
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
  title: "Mini Instagram",
  description: "Instagram UI 기반 SNS - Next.js + Clerk + Supabase",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  openGraph: {
    title: "Mini Instagram",
    description: "Instagram UI 기반 SNS - Next.js + Clerk + Supabase",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Mini Instagram",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mini Instagram",
    description: "Instagram UI 기반 SNS - Next.js + Clerk + Supabase",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/icons/icon-192x192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={koKR}>
      <html lang="ko">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ToastProvider>
            <SyncUserProvider>{children}</SyncUserProvider>
          </ToastProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
