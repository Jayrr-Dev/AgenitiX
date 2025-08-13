"use client";
/**
Route: app/providers/wrapProfilerClient.tsx
 * DEV PROFILER WRAPPER - Measure commit durations of a subtree
 *
 * • Small client-only wrapper for onRender callback
 * • Use around hotspots in dev to see commit ms
 *
 * Keywords: profiler, commit-duration, diagnostics
 */

import React, { Profiler } from "react";

export type WrapProfilerClientProps = {
  id: string;
  children: React.ReactNode;
};

/**
 * Wrap children in a React Profiler in dev.
 * [Explanation], basically logs commit durations for the subtree
 */
export function WrapProfilerClient({ id, children }: WrapProfilerClientProps) {
  if (process.env.NODE_ENV !== "development") return <>{children}</>;
  return (
    <Profiler
      id={id}
      onRender={(_id, _phase, actualDuration) => {
        // eslint-disable-next-line no-console
        console.info(
          "[profiler]",
          id,
          "actualDuration(ms)=",
          Math.round(actualDuration)
        );
      }}
    >
      {children}
    </Profiler>
  );
}
