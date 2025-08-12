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

export default function UserPagesLayout({ children }: UserPagesLayoutProps) {
  const pathname = usePathname();

  // Hide navigation for matrix routes
  const shouldHideNavigation = pathname.startsWith("/matrix");

  // Client-only dev diagnostics to avoid SSR resolving client deps
  const WebVitalsClient =
    process.env.NODE_ENV === "development"
      ? dynamic(
          () =>
            import("@/app/providers/setupWebVitalsClient").then(
              (m) => m.SetupWebVitalsClient,
            ),
          { ssr: false, loading: () => null },
        )
      : null;

  const WhyDidYouRenderClient =
    process.env.NODE_ENV === "development"
      ? dynamic(
          () =>
            import("@/app/providers/setupWhyDidYouRenderClient").then(
              (m) => m.SetupWhyDidYouRenderClient,
            ),
          { ssr: false, loading: () => null },
        )
      : null;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        {process.env.NODE_ENV === "development" && WebVitalsClient && (
          <WebVitalsClient />
        )}
        {process.env.NODE_ENV === "development" && WhyDidYouRenderClient && (
          <WhyDidYouRenderClient />
        )}
        {!shouldHideNavigation && <ProtectedNavigation />}
        <main>{children}</main>
      </div>
    </ProtectedRoute>
  );
}
