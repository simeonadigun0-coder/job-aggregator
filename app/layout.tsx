import type { Metadata, Viewport } from "next";
import "./globals.css";
import Script from "next/script";
import BottomNav from "@/components/BottomNav";
import TopProgressBar from "@/components/TopProgressBar";
import ScrollToTop from "@/components/ScrollToTop";

export const metadata: Metadata = {
  title: "JobHunt – Daily Job Intelligence",
  description: "Remote and hybrid jobs from around the world, updated daily. Find your next role faster.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "JobHunt",
  },
  icons: {
    icon: "/icon-192.svg",
    apple: "/icon-192.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#0d1526",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icon-192.svg" />
        {/* Capture PWA install prompt as early as possible */}
        <script dangerouslySetInnerHTML={{ __html: `
          window.addEventListener('beforeinstallprompt', function(e) {
            e.preventDefault();
            window.__pwaPrompt = e;
          });
        `}} />
      </head>
      <body className="min-h-full flex flex-col font-sans antialiased pb-16 sm:pb-0" style={{ background: '#0a0e1a' }}>
        <TopProgressBar />
        {children}
        <BottomNav />
        <ScrollToTop />
        <Script id="register-sw" strategy="afterInteractive">
          {`if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js').catch(() => {});
            });
          }`}
        </Script>
      </body>
    </html>
  );
}
