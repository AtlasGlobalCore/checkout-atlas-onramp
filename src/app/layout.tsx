import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Atlas Checkout - Secure Payment",
  description: "Complete your purchase securely with Atlas Checkout. Fast, reliable, and secure payment processing.",
  keywords: ["Atlas", "Checkout", "Payment", "Secure"],
  authors: [{ name: "Atlas" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Atlas Checkout",
    description: "Secure payment processing powered by Atlas",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Atlas Checkout",
    description: "Secure payment processing powered by Atlas",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
