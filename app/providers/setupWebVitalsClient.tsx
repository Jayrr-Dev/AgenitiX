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
import type { CLSMetric, INPMetric, LCPMetric } from "web-vitals";
import type {
  CLSMetricWithAttribution,
  INPMetricWithAttribution,
  LCPMetricWithAttribution,
} from "web-vitals/attribution";

const IS_DEV = process.env.NODE_ENV === "development";

/**
 * Loggers for attribution-enabled metrics
 * [Explanation], basically strongly-typed handlers for specific metrics
 */
const logLCPWithAttribution = (metric: LCPMetricWithAttribution): void => {
  // [Explanation], basically print concise metric info with attribution (dev only)
  // eslint-disable-next-line no-console
  console.debug("[web-vitals][LCP]", {
    value: Math.round(metric.value ?? 0),
    id: metric.id,
    attribution: metric.attribution,
  });
};

const logINPWithAttribution = (metric: INPMetricWithAttribution): void => {
  // eslint-disable-next-line no-console
  console.debug("[web-vitals][INP]", {
    value: Math.round(metric.value ?? 0),
    id: metric.id,
    attribution: metric.attribution,
  });
};

const logCLSWithAttribution = (metric: CLSMetricWithAttribution): void => {
  // eslint-disable-next-line no-console
  console.debug("[web-vitals][CLS]", {
    value: Math.round(metric.value ?? 0),
    id: metric.id,
    attribution: metric.attribution,
  });
};

/**
 * Loggers for core metrics (no attribution fallback)
 * [Explanation], basically minimal info when attribution package not available
 */
const logLCP = (metric: LCPMetric): void => {
  // eslint-disable-next-line no-console
  console.debug("[web-vitals][LCP]", {
    value: Math.round(metric.value ?? 0),
    id: metric.id,
  });
};

const logINP = (metric: INPMetric): void => {
  // eslint-disable-next-line no-console
  console.debug("[web-vitals][INP]", {
    value: Math.round(metric.value ?? 0),
    id: metric.id,
  });
};

const logCLS = (metric: CLSMetric): void => {
  // eslint-disable-next-line no-console
  console.debug("[web-vitals][CLS]", {
    value: Math.round(metric.value ?? 0),
    id: metric.id,
  });
};

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
        mod.onLCP(logLCPWithAttribution);
        mod.onINP(logINPWithAttribution);
        mod.onCLS(logCLSWithAttribution);
      } catch (err) {
        try {
          // Fallback to core web-vitals without attribution
          const core = await import("web-vitals");
          if (cancelled) return;
          core.onLCP(logLCP);
          core.onINP(logINP);
          core.onCLS(logCLS);
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
