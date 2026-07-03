import type { Metadata } from "next";
import "./globals.css";
import { plusJakartaSans, boing } from "./fonts";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Orbit",
  description: "Subscription billing built for modern products",
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
      <body className="min-h-full flex flex-col">
        <Toaster position="top-right" richColors />
        {children}
      </body>
    </html>
  );
}
