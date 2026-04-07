import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import SessionProvider from "@/components/SessionProvider";
import JsonLd from "@/components/shared/JsonLd";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-sans",
});

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://lenote.dev';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default:  'Lenote.dev',
    template: '%s | Lenote.dev',
  },
  description: 'Nền tảng học tập công nghệ — System Design, AI/ML, DevOps, Blockchain, Frontend, Backend.',
  keywords:    ['KS4.0', 'lập trình', 'system design', 'AI', 'devops', 'blockchain', 'frontend', 'backend'],
  authors:     [{ name: 'KS4.0 Academy' }],
  creator:     'KS4.0 Academy',
  openGraph: {
    type:        'website',
    locale:      'vi_VN',
    url:         BASE_URL,
    siteName:    'KS4.0 Academy',
    title:       'KS4.0 Academy',
    description: 'Nền tảng học tập công nghệ — System Design, AI/ML, DevOps, Blockchain, Frontend, Backend.',
    images: [{ url: '/logo.png', width: 1200, height: 1200, alt: 'Lenote.dev' }],
  },
  twitter: {
    card:        'summary_large_image',
    title:       'KS4.0 Academy',
    description: 'Nền tảng học tập công nghệ — System Design, AI/ML, DevOps, Blockchain, Frontend, Backend.',
    images: ['/logo.png'],
  },
  robots: { index: true, follow: true },
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
};

import GlobalTimer from "@/components/shared/GlobalTimer";
import ProductivityHub from "@/components/shared/ProductivityHub";
import NotesPanel from "@/features/member/components/NotesPanel";
import { Suspense } from "react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
      </head>
      <body className={`${inter.variable} font-sans antialiased min-h-screen flex flex-col relative bg-background-light dark:bg-background-dark text-slate-900 dark:text-white transition-colors duration-300 overflow-x-hidden`}>
        <JsonLd data={{
          '@context': 'https://schema.org',
          '@type':    'Organization',
          name:       'KS4.0 Academy',
          url:        BASE_URL,
          logo:       `${BASE_URL}/logo.png`,
          sameAs:     [],
        }} />
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={true}
          >
            {children}
            <Suspense fallback={null}>
              <GlobalTimer />
              <ProductivityHub />
              <NotesPanel />
            </Suspense>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
