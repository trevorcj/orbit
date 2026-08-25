import type { Metadata } from "next";
import "./globals.css";
import { plusJakartaSans, boing } from "./fonts";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/ThemeProvider";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://orbit-billing-nomba.vercel.app";

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
    apple: "/apple-touch-icon.png",
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
      suppressHydrationWarning
      className={`${plusJakartaSans.variable} ${boing.variable} h-full antialiased`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const t = localStorage.getItem('orbit-theme') || 'system';
                const isDark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                if (isDark) document.documentElement.classList.add('dark');
                else document.documentElement.classList.remove('dark');
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-white dark:bg-[#0B1320] text-zinc-900 dark:text-zinc-100">
        <ThemeProvider>
          <Toaster position="top-right" />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
