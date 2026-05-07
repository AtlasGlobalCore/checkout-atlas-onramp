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
  title: "SafePay - Checkout Seguro",
  description: "Complete a sua compra de forma segura com SafePay. Pagamento rapido, fiavel e protegido.",
  keywords: ["SafePay", "Checkout", "Pagamento", "Seguro", "SSL"],
  authors: [{ name: "SafePay" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "SafePay - Checkout Seguro",
    description: "Pagamento seguro processado por SafePay",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "SafePay - Checkout Seguro",
    description: "Pagamento seguro processado por SafePay",
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
