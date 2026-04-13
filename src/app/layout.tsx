import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import SessionProvider from "@/components/SessionProvider";
import JsonLd from "@/components/shared/JsonLd";
import MaterialIconsCss from "@/components/MaterialIconsCss";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/seo";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default:  SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords:    ['Lenote', 'lập trình', 'system design', 'AI', 'devops', 'blockchain', 'frontend', 'backend'],
  authors:     [{ name: SITE_NAME }],
  creator:     SITE_NAME,
  openGraph: {
    type:        'website',
    locale:      'vi_VN',
    url:         SITE_URL,
    siteName:    SITE_NAME,
    title:       SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [{ url: '/logo.png', width: 1200, height: 1200, alt: SITE_NAME }],
  },
  twitter: {
    card:        'summary_large_image',
    title:       SITE_NAME,
    description: SITE_DESCRIPTION,
    images:      ['/logo.png'],
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple:    '/icon-512.png',
  },
  other: {
    "google-adsense-account": "ca-pub-9196783506195067",
  },
};

export const viewport: Viewport = {
  themeColor:   '#6366f1',
  width:        'device-width',
  initialScale: 1,
};

import GlobalTimer from "@/components/shared/GlobalTimer";
import ProductivityHub from "@/components/shared/ProductivityHub";
import NotesPanel from "@/features/member/components/NotesPanel";
import InteractiveGlow from "@/components/shared/InteractiveGlow";
import { Suspense } from "react";

import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased min-h-screen flex flex-col relative bg-background-light dark:bg-background-dark text-zinc-800 dark:text-white transition-colors duration-300 overflow-x-hidden`}>
        <MaterialIconsCss />
        <JsonLd data={{
          '@context': 'https://schema.org',
          '@type':    'Organization',
          name:       SITE_NAME,
          url:        SITE_URL,
          logo:       `${SITE_URL}/logo.png`,
          sameAs:     [],
        }} />
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={true}
          >
            <InteractiveGlow />
            {children}
            <Suspense fallback={null}>
              <GlobalTimer />
              <ProductivityHub />
              <NotesPanel />
            </Suspense>
            <Toaster 
              position="top-right" 
              expand={false} 
              richColors={false}
              closeButton={false}
              theme="system"
              className="premium-toaster"
              toastOptions={{
                className: 'premium-toast group',
              }}
            />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
