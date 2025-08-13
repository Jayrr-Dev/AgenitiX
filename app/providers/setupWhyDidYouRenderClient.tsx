"use client";
/**
Route: app/providers/setupWhyDidYouRenderClient.tsx
 * DEV RENDER DIAGNOSTICS - why-did-you-render integration
 *
 * • Monkey-patches React in the browser (dev only)
 * • Tracks key node components and the scaffold wrapper
 * • Keeps logs concise and collapsible
 *
 * Keywords: why-did-you-render, re-render, diagnostics, hooks-tracking
 */

import React from "react";

/**
 * Initialize why-did-you-render (dev only).
 * [Explanation], basically attaches WDYR to React with include filters
 */
export function SetupWhyDidYouRenderClient(): null {
  if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const whyDidYouRender = require("@welldone-software/why-did-you-render");
      if (!(React as any).__WDYR_INSTALLED__) {
        whyDidYouRender(React, {
          trackAllPureComponents: false,
          // Disable hook tracking to avoid a known incompatibility with
          // Context values returning primitives (e.g., booleans) which can
          // trigger "Cannot create property 'current' on boolean" in WDYR.
          // You still get owner reasons + component re-render tracking.
          trackHooks: false,
          logOwnerReasons: true,
          include: [
            /withNodeScaffold/i,
            /EmailReader/i,
            /EmailPreview/i,
            /ViewArray/i,
            /ViewBoolean/i,
            /ReactFlow/i,
          ],
          exclude: [/NodeToastContainer/, /ProtectedRoute/i, /AuthProvider/i],
          hotReloadBufferMs: 800,
          collapseGroups: true,
        });
        (React as any).__WDYR_INSTALLED__ = true;
        // WDYR runtime attached
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("why-did-you-render not installed (dev only):", err);
    }
  }
  return null;
}
