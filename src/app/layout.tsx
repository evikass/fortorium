import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import ClientWrapper from "@/components/ClientWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ФОРТОРИУМ - Анимационная студия будущего",
  description: "Мультиагентная AI-анимационная студия. Создавайте мультфильмы с помощью команды интеллектуальных агентов.",
  keywords: ["анимация", "AI", "мультфильмы", "агенты", "студия", "ФОРТОРИУМ"],
  authors: [{ name: "ФОРТОРИУМ" }],
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "1024x1024", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
  },
  openGraph: {
    title: "ФОРТОРИУМ",
    description: "Анимационная студия будущего - создавайте мультфильмы с AI",
    url: "https://fortorium-01.vercel.app",
    siteName: "ФОРТОРИУМ",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ФОРТОРИУМ",
    description: "Анимационная студия будущего",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ClientWrapper>
          {children}
        </ClientWrapper>
        <Toaster />
      </body>
    </html>
  );
}
