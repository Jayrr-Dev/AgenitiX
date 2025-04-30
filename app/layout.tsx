import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
// import { Navbar } from "@/components/Navbar";
import { CookieConsent } from "@/features/cookies";
import Footer from "@/features/marketing/components/footer";
import { Providers } from '@/app/provider';
import { Suspense } from "react";
import Loading from "./loading";
import { Analytics } from "@vercel/analytics/react"
import Script from "next/script";
import { Metadata } from "next";
import MainNavBar from "@/components/MainNavBar";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

  export const metadata: Metadata = {
    metadataBase: new URL(defaultUrl),
    title: {
      default: 'Utilitek Solutions',
      template: '%s | Utilitek Solutions',
    },
    description: 'Utilitek Solutions is an electrical engineering consulting company in Edmonton, Alberta, Canada that provides solutions to businesses in the utility industry.',
    keywords: [
      'Utilitek Solutions',
      'Electrical Engineering',
      'Utility Industry',
      'Consulting',
      'Edmonton',
      'Alberta',
      'Canada',
    ],
    authors: [
      {
        name: 'Utilitek Solutions Inc.',
        url: defaultUrl,
      },
    ],
    creator: 'Utilitek Solutions Inc.',
    publisher: 'Utilitek Solutions Inc.',
    openGraph: {
      title: 'Utilitek Solutions',
      description: 'Electrical engineering consulting services for the utility industry in Edmonton, Alberta, Canada.',
      url: defaultUrl,
      siteName: 'Utilitek Solutions',
      images: [
        {
          url: `https://d63wj7axnd.ufs.sh/f/7P3qnKUtDOoxmx8fO2EvrwqgHICeFRAkyXLoZEczbxh82KiQ`,
          width: 1200,
          height: 630,
          alt: 'Utilitek Solutions Cover Image',
        },
      ],
      locale: 'en_CA',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Utilitek Solutions',
      description: 'Electrical engineering consulting services for the utility industry in Edmonton, Alberta, Canada.',
      creator: '@UtilitekSolutions',
      images: [`https://d63wj7axnd.ufs.sh/f/7P3qnKUtDOoxmx8fO2EvrwqgHICeFRAkyXLoZEczbxh82KiQ`],
    },
    robots: {
      index: true,
      follow: true,
      nocache: true,
      googleBot: {
        index: true,
        follow: true,
        noimageindex: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: defaultUrl,
      languages: {
        'en-CA': '/',
      },
    },
    icons: {
      icon: 'https://d63wj7axnd.ufs.sh/f/7P3qnKUtDOoxJ1e43nvrKN08PwisukcGDYCdEBQlfXvLFg73',
      shortcut: 'https://d63wj7axnd.ufs.sh/f/7P3qnKUtDOoxJ1e43nvrKN08PwisukcGDYCdEBQlfXvLFg73',
      apple: 'https://d63wj7axnd.ufs.sh/f/7P3qnKUtDOoxJ1e43nvrKN08PwisukcGDYCdEBQlfXvLFg73',
    },
    // manifest: '/site.webmanifest',
    category: 'technology',
  };

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});



export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {


<Script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Utilitek Solutions Inc.',
      url: defaultUrl,
      logo: `https://d63wj7axnd.ufs.sh/f/7P3qnKUtDOoxJ1e43nvrKN08PwisukcGDYCdEBQlfXvLFg73`,
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'Customer Service',
        areaServed: 'CA',
        availableLanguage: 'English',
      },
    }),
  }}
/>

  return (
    <html lang="en" className={geistSans.className}>
      <body className="bg-background text-foreground" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <main className="min-h-screen flex flex-col items-center">
            <div className="flex-1 w-full flex flex-col items-center">
            
              {/* Navbar */}
              <MainNavBar />

              
              {/* Main Content */}
              <div className="w-full">
                <Providers>
                  <Suspense fallback={<Loading />}>
                    {children}
                  </Suspense>
                </Providers>

                {/* Cookie Consent */}
                <CookieConsent />
              </div>

              {/* Footer */}
              <Footer />
              </div>
          </main>
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
