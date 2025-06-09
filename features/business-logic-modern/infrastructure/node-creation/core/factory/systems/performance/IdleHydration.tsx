/**
 * IDLE HYDRATION SYSTEM
 *
 * Provides intelligent component hydration that defers heavy mounting until browser idle time.
 * This prevents blocking First Contentful Paint and improves perceived performance.
 *
 * FEATURES:
 * • SSR-safe idle time detection
 * • Graceful fallback for browsers without requestIdleCallback
 * • Configurable timeout for maximum defer time
 * • Customizable loading placeholder
 *
 * PERFORMANCE BENEFITS:
 * • Improves First Contentful Paint by deferring non-critical renders
 * • Utilizes browser idle time for optimal resource utilization
 * • Prevents main thread blocking during initial page load
 *
 * @author Factory Performance Team
 * @since v3.0.0
 * @keywords idle-hydration, performance, ssr-safe, deferred-loading
 */

"use client";

import { ReactNode, useEffect, useState } from "react";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface DeferUntilIdleProps {
  /** Component children to render after idle time */
  children: ReactNode;
  /** Fallback component to show while waiting for idle time */
  fallback?: ReactNode;
  /** Maximum time to wait before forcing render (ms) */
  timeout?: number;
}

// ============================================================================
// IDLE HYDRATION COMPONENT
// ============================================================================

/**
 * HOC that defers heavy component mounting until browser idle time (SSR-safe)
 * Prevents blocking First Contentful Paint by waiting for browser idle periods
 *
 * @param children - Components to render after idle time
 * @param fallback - Loading placeholder (default: animated skeleton)
 * @param timeout - Maximum defer time in milliseconds (default: 5000ms)
 *
 * @example
 * ```tsx
 * <DeferUntilIdle timeout={3000} fallback={<CustomLoader />}>
 *   <HeavyComponent />
 * </DeferUntilIdle>
 * ```
 */
export function DeferUntilIdle({
  children,
  fallback = (
    <div className="loading-placeholder h-20 bg-gray-100 animate-pulse rounded" />
  ),
  timeout = 5000,
}: DeferUntilIdleProps) {
  const [isIdle, setIsIdle] = useState(false);

  useEffect(() => {
    // SSR safety check - assume idle on server
    if (typeof window === "undefined") {
      setIsIdle(true);
      return;
    }

    // Use requestIdleCallback if available, fallback to setTimeout
    if ("requestIdleCallback" in window) {
      const handle = window.requestIdleCallback(() => setIsIdle(true), {
        timeout,
      });
      return () => window.cancelIdleCallback(handle);
    } else {
      // Fallback for browsers without requestIdleCallback
      const handle = setTimeout(() => setIsIdle(true), 100);
      return () => clearTimeout(handle);
    }
  }, [timeout]);

  return isIdle ? <>{children}</> : <>{fallback}</>;
}

// ============================================================================
// CONVENIENCE HOOKS
// ============================================================================

/**
 * Hook that returns whether the browser is currently idle
 *
 * @param timeout - Maximum time to wait for idle state (default: 5000ms)
 * @returns boolean indicating if browser is idle
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isIdle = useIdleState(3000);
 *
 *   if (!isIdle) {
 *     return <LoadingSpinner />;
 *   }
 *
 *   return <HeavyComponent />;
 * }
 * ```
 */
export function useIdleState(timeout: number = 5000): boolean {
  const [isIdle, setIsIdle] = useState(false);

  useEffect(() => {
    // SSR safety check
    if (typeof window === "undefined") {
      setIsIdle(true);
      return;
    }

    if ("requestIdleCallback" in window) {
      const handle = window.requestIdleCallback(() => setIsIdle(true), {
        timeout,
      });
      return () => window.cancelIdleCallback(handle);
    } else {
      const handle = setTimeout(() => setIsIdle(true), 100);
      return () => clearTimeout(handle);
    }
  }, [timeout]);

  return isIdle;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if requestIdleCallback is supported in current environment
 * @returns boolean indicating browser support
 */
export function isIdleCallbackSupported(): boolean {
  return typeof window !== "undefined" && "requestIdleCallback" in window;
}

/**
 * Get recommended timeout based on component complexity
 * @param complexity - Component complexity level
 * @returns recommended timeout in milliseconds
 */
export function getRecommendedTimeout(
  complexity: "simple" | "medium" | "complex" = "medium"
): number {
  switch (complexity) {
    case "simple":
      return 1000; // 1 second for simple components
    case "medium":
      return 3000; // 3 seconds for medium complexity
    case "complex":
      return 5000; // 5 seconds for complex components
    default:
      return 3000;
  }
}
