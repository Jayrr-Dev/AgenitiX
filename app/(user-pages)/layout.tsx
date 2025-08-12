"use client";
/**
Route: app/(user-pages)/layout.tsx
 * USER-PAGES LAYOUT - Auth guard + optional dev diagnostics
 *
 * • Renders protected navigation except on matrix routes
 * • In dev, mounts Web Vitals + WDYR providers for diagnostics
 *
 * Keywords: layout, auth, diagnostics, web-vitals, why-did-you-render
 */

import dynamic from "next/dynamic";
// Import long task tracker (auto-starts)
import { ProtectedNavigation } from "@/components/auth/ProtectedNavigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import "@/lib/long-task-tracker";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

interface UserPagesLayoutProps {
  children: ReactNode;
}

const IS_DEV = process.env.NODE_ENV === "development";

// Client-only dev diagnostics to avoid SSR resolving client deps
const WebVitalsClient = IS_DEV
  ? dynamic(
      () =>
        import("@/app/providers/setupWebVitalsClient").then(
          (m) => m.SetupWebVitalsClient
        ),
      { ssr: false, loading: () => null }
    )
  : null;

const WhyDidYouRenderClient = IS_DEV
  ? dynamic(
      () =>
        import("@/app/providers/setupWhyDidYouRenderClient").then(
          (m) => m.SetupWhyDidYouRenderClient
        ),
      { ssr: false, loading: () => null }
    )
  : null;

export default function UserPagesLayout({ children }: UserPagesLayoutProps) {
  const pathname = usePathname();

  // Hide navigation for matrix routes
  const shouldHideNavigation = pathname.startsWith("/matrix");

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        {IS_DEV && WebVitalsClient && <WebVitalsClient />}
        {IS_DEV && WhyDidYouRenderClient && <WhyDidYouRenderClient />}
        {!shouldHideNavigation && <ProtectedNavigation />}
        <main>{children}</main>
      </div>
    </ProtectedRoute>
  );
}
