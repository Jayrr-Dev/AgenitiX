
import LayoutWrapper from "@/app/wrapper/LayoutWrapper";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import PWAStatus from "@/components/PWAStatus";
import { AnubisControlPanel } from "@/components/anubis/AnubisControlPanel";
import { AnubisDebugger } from "@/components/anubis/AnubisDebugger";
import {
  AnubisProvider,
  AnubisStatus,
} from "@/components/anubis/AnubisProvider";
import { OptimisticVerificationProvider } from "@/components/anubis/OptimisticVerification";
import { RiskDashboard } from "@/components/anubis/RiskDashboard";
import MagicLinkTest from "@/components/auth/MagicLinkTest";
import { Analytics } from "@vercel/analytics/react";
import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "next-themes";
import { Geist, Inter } from "next/font/google";
import Script from "next/script";
import type React from "react";
import { Suspense } from "react";
import { Toaster } from "sonner";
import "./globals.css";
import "@arco-design/web-react/dist/css/arco.css";
import Loading from "./loading";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { ConvexClientProvider } from "./provider";

// Import why-did-you-render for development debugging
import "@/lib/why-did-you-render";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: {
    default: "AgenitiX",
    template: "%s | AgenitiX - Digital Automation Solutions",
  },
  description:
    "AgenitiX is a digital technology agency specializing in n8n automation workflows...",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AgenitiX Flow Editor",
    startupImage: ["/icons/icon-192x192.png", "/icons/icon-512x512.png"],
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "AgenitiX",
    title: {
      default: "AgenitiX",
      template: "%s | AgenitiX - Digital Automation Solutions",
    },
    description:
      "Visual flow editor for creating and managing node-based workflows",
  },
  twitter: {
    card: "summary",
    title: {
      default: "AgenitiX",
      template: "%s | AgenitiX - Digital Automation Solutions",
    },
    description:
      "Visual flow editor for creating and managing node-based workflows",
  },
  icons: {
    icon: "/icons/icon-192x192.png",
    shortcut: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#3b82f6" },
    { media: "(prefers-color-scheme: dark)", color: "#3b82f6" },
  ],
};

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

const inter = Inter({
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ConvexAuthNextjsServerProvider>
    <html lang="en" className={`${geistSans.className} ${inter.className}`}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Work+Sans:wght@400;600&family=Source+Serif+Pro:ital,wght@0,400;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="bg-background text-foreground"
        suppressHydrationWarning={true}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={true}
          disableTransitionOnChange={true}
        >
          <AnubisProvider>
            <OptimisticVerificationProvider>
              <ConvexClientProvider>
                <Suspense fallback={<Loading />}>
                  <LayoutWrapper>{children}</LayoutWrapper>
                </Suspense>
                {/* {process.env.NODE_ENV === "development" && <MagicLinkTest />} */}
              </ConvexClientProvider>
              <PWAInstallPrompt />
              <PWAStatus />
              {/* <AnubisToggle /> */}
              <AnubisStatus />
              {process.env.NODE_ENV === "development" && <AnubisDebugger />}
              {process.env.NODE_ENV === "development" && <RiskDashboard />}
            </OptimisticVerificationProvider>
          </AnubisProvider>
          <Toaster position="top-right" />

          <Analytics />

          <Script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Organization",
                name: "AgenitiX Inc.",
                url: defaultUrl,
                logo: "https://86apvmagmm.ufs.sh/f/EORhWwIHc4gy98vCVQXnvd0FBAOChWPpUI7LwlytcoN5fm4Q",
                description:
                  "Digital technology agency specializing in n8n automation workflows...",
                contactPoint: {
                  "@type": "ContactPoint",
                  contactType: "Customer Service",
                  areaServed: "Worldwide",
                  availableLanguage: "English",
                },
                sameAs: [
                  "https://twitter.com/AgenitiX",
                  "https://linkedin.com/company/agenitix",
                  "https://github.com/agenitix",
                ],
              }),
            }}
          />
        </ThemeProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
      </>
  );
}
