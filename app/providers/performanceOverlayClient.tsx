"use client";
/**
Route: app/providers/performanceOverlayClient.tsx
 * DEV PERFORMANCE OVERLAY - Real-time performance metrics
 *
 * • Shows FPS, long tasks, and React render times
 * • Only visible in development
 * • Helps identify when lag occurs
 */

import { useEffect, useState } from "react";

export function PerformanceOverlayClient() {
  const [metrics, setMetrics] = useState({
    fps: 0,
    longTasks: 0,
    lastLongTask: 0,
    lastLongTaskSource: "",
    renderCount: 0,
    heaviestTasks: [] as Array<{
      duration: number;
      source: string;
      time: number;
    }>,
  });

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    let frameCount = 0;
    let lastTime = performance.now();
    let longTaskCount = 0;

    // FPS monitoring
    function updateFPS() {
      frameCount++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        setMetrics((prev) => ({
          ...prev,
          fps: Math.round((frameCount * 1000) / (now - lastTime)),
        }));
        frameCount = 0;
        lastTime = now;
      }
      requestAnimationFrame(updateFPS);
    }
    requestAnimationFrame(updateFPS);

    // Long task monitoring with source attribution
    if ("PerformanceObserver" in window) {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            longTaskCount++;

            // Try to get the source script/function causing the long task
            const attribution = (entry as any).attribution || [];
            let source = "unknown";

            if (attribution.length > 0) {
              const container = attribution[0];
              source =
                container.containerName ||
                container.containerSrc ||
                container.containerType ||
                "script";
            }

            // Keep track of the worst offenders
            setMetrics((prev) => {
              const newTask = {
                duration: entry.duration,
                source,
                time: Date.now(),
              };

              const updatedTasks = [...prev.heaviestTasks, newTask]
                .sort((a, b) => b.duration - a.duration)
                .slice(0, 3); // Keep top 3

              return {
                ...prev,
                longTasks: longTaskCount,
                lastLongTask: entry.duration,
                lastLongTaskSource: source,
                heaviestTasks: updatedTasks,
              };
            });
          }
        }
      });
      longTaskObserver.observe({ entryTypes: ["longtask"] });

      return () => longTaskObserver.disconnect();
    }
  }, []);

  if (process.env.NODE_ENV !== "development") return null;

  return (
    <div className="fixed top-4 right-4 bg-black/90 text-white p-3 rounded text-xs font-mono z-[9999] backdrop-blur max-w-xs">
      <div>FPS: {metrics.fps}</div>
      <div>Long Tasks: {metrics.longTasks}</div>

      {metrics.lastLongTask > 0 && (
        <div
          className={
            metrics.lastLongTask > 100 ? "text-red-400" : "text-yellow-400"
          }
        >
          Last: {metrics.lastLongTask.toFixed(0)}ms
          {metrics.lastLongTaskSource && (
            <div className="text-gray-300 text-[10px] truncate">
              {metrics.lastLongTaskSource}
            </div>
          )}
        </div>
      )}

      {metrics.heaviestTasks.length > 0 && (
        <div className="mt-2 border-t border-gray-600 pt-2">
          <div className="text-gray-400 text-[10px]">Worst Tasks:</div>
          {metrics.heaviestTasks.map((task, i) => (
            <div key={i} className="text-[10px] text-red-300">
              {task.duration.toFixed(0)}ms: {task.source.slice(0, 25)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
