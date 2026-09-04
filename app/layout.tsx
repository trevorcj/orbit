import type { Metadata } from "next";
import "./globals.css";
import { plusJakartaSans, boing } from "./fonts";
import { Toaster } from "sonner";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, Loader2 } from "lucide-react";
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
        <Toaster
          position="top-right"
          toastOptions={{
            className: "!bg-white !text-zinc-900 !border !border-zinc-200 !shadow-lg !rounded-xl !p-3.5 !font-sans !text-xs",
            style: {
              background: "#ffffff",
              color: "#09090b",
              border: "1px solid #e4e4e7",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)",
              borderRadius: "12px",
              fontSize: "13px",
              fontWeight: 500,
            },
          }}
          icons={{
            success: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />,
            error: <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />,
            info: <Info className="w-4 h-4 text-[#0F86EE] shrink-0" />,
            warning: <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />,
            loading: <Loader2 className="w-4 h-4 animate-spin text-zinc-500 shrink-0" />,
          }}
        />
        {children}
      </body>
    </html>
  );
}
