import type { Metadata } from "next";
import "./globals.css";
import { plusJakartaSans, boing } from "./fonts";
import { Toaster } from "sonner";
import { getAppUrl } from "@/lib/url";

const siteUrl = getAppUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Orbit — Modern Subscription Billing Infrastructure",
    template: "%s | Orbit",
  },
  description:
    "Automated recurring subscription billing engine, tokenized card renewals, and instant split payouts built for modern businesses.",
  keywords: [
    "Subscription billing",
    "Recurring payments",
    "Paystack subscriptions",
    "SaaS billing Nigeria",
    "Automated payouts",
    "Orbit billing",
  ],
  authors: [{ name: "Orbit" }],
  creator: "Orbit",
  publisher: "Orbit",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    title: "Orbit — Modern Subscription Billing Infrastructure",
    description:
      "Automated recurring subscription billing engine, tokenized card renewals, and instant split payouts built for modern businesses.",
    siteName: "Orbit",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Orbit Subscription Billing Infrastructure",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Orbit — Modern Subscription Billing Infrastructure",
    description:
      "Automated recurring subscription billing engine, tokenized card renewals, and instant split payouts built for modern businesses.",
    images: ["/og-image.png"],
    creator: "@useorbit",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${boing.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-zinc-900 selection:bg-[#0F86EE]/15 selection:text-zinc-900">
        <Toaster position="top-right" richColors />
        {children}
      </body>
    </html>
  );
}
