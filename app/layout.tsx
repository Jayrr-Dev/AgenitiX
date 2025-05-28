import { Geist } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import './globals.css';
import { Providers } from '@/app/provider';
import { Suspense } from 'react';
import Loading from './loading';
import { Analytics } from '@vercel/analytics/react';
import Script from 'next/script';
import type { Metadata, Viewport } from 'next';
import LayoutWrapper from '@/app/wrapper/LayoutWrapper';
import { Toaster } from 'sonner';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import PWAStatus from '@/components/PWAStatus';

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: {
    default: 'AgenitiX',
    template: '%s | AgenitiX - Digital Automation Solutions',
  },
  description:
    'AgenitiX is a digital technology agency specializing in n8n automation workflows...',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AgenitiX Flow Editor',
    startupImage: [
      '/icons/icon-192x192.png',
      '/icons/icon-512x512.png'
    ]
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'AgenitiX',
    title: {
      default: 'AgenitiX',
      template: '%s | AgenitiX - Digital Automation Solutions',
    },
    description: 'Visual flow editor for creating and managing node-based workflows',
  },
  twitter: {
    card: 'summary',
    title: {
      default: 'AgenitiX',
      template: '%s | AgenitiX - Digital Automation Solutions',
    },
    description: 'Visual flow editor for creating and managing node-based workflows',
  },
  icons: {
    icon: '/icons/icon-192x192.png',
    shortcut: '/icons/icon-192x192.png',
    apple: '/icons/icon-192x192.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#3b82f6' },
    { media: '(prefers-color-scheme: dark)', color: '#3b82f6' }
  ],
};

const geistSans = Geist({
  display: 'swap',
  subsets: ['latin'],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={geistSans.className}>
      <body className="bg-background text-foreground" suppressHydrationWarning>
        <ThemeProvider
          defaultTheme="dark"
          attribute="class"
          enableSystem
          enableColorScheme
          disableTransitionOnChange
        >
          <main className="min-h-screen flex flex-col items-center">
            <div className="flex-1 w-full flex flex-col items-center">
              <Providers>
                <Suspense fallback={<Loading />}>
                  <LayoutWrapper>{children}</LayoutWrapper>
                </Suspense>
              </Providers>
            </div>
          </main>
          <Toaster position="top-right" />
          <PWAInstallPrompt />
          <PWAStatus />

          <Analytics />

          <Script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'Organization',
                name: 'AgenitiX Inc.',
                url: defaultUrl,
                logo:
                  'https://86apvmagmm.ufs.sh/f/EORhWwIHc4gy98vCVQXnvd0FBAOChWPpUI7LwlytcoN5fm4Q',
                description:
                  'Digital technology agency specializing in n8n automation workflows...',
                contactPoint: {
                  '@type': 'ContactPoint',
                  contactType: 'Customer Service',
                  areaServed: 'Worldwide',
                  availableLanguage: 'English',
                },
                sameAs: [
                  'https://twitter.com/AgenitiX',
                  'https://linkedin.com/company/agenitix',
                  'https://github.com/agenitix',
                ],
              }),
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
