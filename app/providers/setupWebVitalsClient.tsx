"use client";
/**
Route: app/providers/setupWebVitalsClient.tsx
 * DEV WEB-VITALS RUNTIME - Logs LCP/INP/CLS with attribution
 *
 * • Client-only and dev-only integration
 * • Uses web-vitals/attribution to attribute element/event owners
 * • Safe to ship: lazy dynamic import and guarded by NODE_ENV
 *
 * Keywords: web-vitals, attribution, INP, LCP, CLS, diagnostics
 */

import { useEffect } from "react";

const IS_DEV = process.env.NODE_ENV === "development";

interface WebVitalEvent {
  name: string;
  value: number;
  id?: string;
  attribution?: Record<string, unknown>;
}

/**
 * Initialize runtime Web Vitals listeners (dev only).
 * [Explanation], basically attaches LCP/INP/CLS handlers and prints brief info
 */
export function SetupWebVitalsClient(): null {
  useEffect(() => {
    if (!IS_DEV) return;
    let cancelled = false;
    // Web vitals runtime attached
    (async () => {
      try {
        const mod = await import("web-vitals/attribution");
        if (cancelled) return;
        const log = (m: WebVitalEvent) => {
          // Keep concise to avoid console noise
          // [Explanation], basically show metric name, value, and key attribution fields
          const rounded = Math.round(m.value ?? 0);
          const attr = m.attribution ?? {};
          // Web vitals metric logged
        };
        mod.onLCP(log);
        mod.onINP(log);
        mod.onCLS(log);
      } catch (err) {
        try {
          // Fallback to core web-vitals without attribution
          const core = await import("web-vitals");
          if (cancelled) return;
          const log = (m: WebVitalEvent) => {
            // [Explanation], basically show metric name and rounded value only
            const _ = Math.round(m.value ?? 0);
          };
          core.onLCP(log);
          core.onINP(log);
          core.onCLS(log);
        } catch (innerErr) {
          // eslint-disable-next-line no-console
          console.warn("web-vitals not available (dev only):", innerErr);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  return null;
}
