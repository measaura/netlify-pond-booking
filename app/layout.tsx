import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ClientBody from "./ClientBody";
import { ToastProvider } from '@/components/ui/toast'
import Script from "next/script";

// Import CSS with explicit type to ensure same.new processes it correctly
import "./globals.css";
import "react-day-picker/style.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FishComp - Fishing Competition App",
  description: "Book your fishing spots and join competitions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        {/* Load critical CSS immediately */}
        <link rel="stylesheet" href="/same-fix.css" />
        <Script
          strategy="beforeInteractive"
          crossOrigin="anonymous"
          src="//unpkg.com/same-runtime/dist/index.global.js"
        />
        {/* Fallback Tailwind CDN for same.new compatibility */}
        <Script src="https://cdn.tailwindcss.com"></Script>
        {/* Force CSS to load early for same.new */}
        <style>{`
          html { background: white; }
          body { margin: 0; padding: 0; }
        `}</style>
      </head>
      <body suppressHydrationWarning className="antialiased">
        <ClientBody>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ClientBody>
      </body>
    </html>
  );
}
