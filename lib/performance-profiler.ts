/**
 * PERFORMANCE PROFILER - Detailed bottleneck tracking
 *
 * Add this to suspected slow components to get precise timing
 */

// Track expensive operations
export function timeOperation<T>(name: string, operation: () => T): T {
  if (process.env.NODE_ENV !== "development") return operation();

  const start = performance.now();
  const result = operation();
  const end = performance.now();
  const duration = end - start;

  if (duration > 5) {
    // Log operations taking > 5ms
    console.warn(`[perf] ${name} took ${duration.toFixed(2)}ms`);

    // For really slow operations, capture stack trace
    if (duration > 50) {
      console.group(
        `🚨 CRITICAL SLOW OPERATION: ${name} (${duration.toFixed(2)}ms)`
      );
      console.trace("Call stack:");
      console.groupEnd();
    }
  }

  return result;
}

// Track React component renders
export function trackRender(componentName: string, props: any) {
  if (process.env.NODE_ENV !== "development") return;

  const start = performance.now();

  // Return cleanup function
  return () => {
    const end = performance.now();
    const duration = end - start;

    if (duration > 10) {
      // Log renders taking > 10ms
      console.warn(
        `[render] ${componentName} rendered in ${duration.toFixed(2)}ms`,
        {
          props: Object.keys(props),
          propsSize: JSON.stringify(props).length,
        }
      );
    }
  };
}

// Track state updates
let updateQueue: Array<{ name: string; time: number }> = [];

export function trackStateUpdate(name: string) {
  if (process.env.NODE_ENV !== "development") return;

  updateQueue.push({ name, time: performance.now() });

  // Flush queue every 100ms to see update patterns
  setTimeout(() => {
    if (updateQueue.length > 5) {
      const grouped = updateQueue.reduce(
        (acc, item) => {
          acc[item.name] = (acc[item.name] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      console.warn("[state-updates] Frequent updates:", grouped);
    }
    updateQueue = [];
  }, 100);
}
