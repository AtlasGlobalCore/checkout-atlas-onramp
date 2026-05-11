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
  title: "Atlas Payments - Checkout Seguro",
  description: "Complete a sua compra de forma segura com Atlas Payments. Pagamento rapido, fiavel e protegido.",
  keywords: ["Atlas", "Atlas Payments", "Checkout", "Pagamento", "Seguro", "SSL"],
  authors: [{ name: "Atlas Global" }],
  icons: {
    icon: "/logo-atlas.jpg",
  },
  openGraph: {
    title: "Atlas Payments - Checkout Seguro",
    description: "Pagamento seguro processado por Atlas Payments",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Atlas Payments - Checkout Seguro",
    description: "Pagamento seguro processado por Atlas Payments",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
