/**
 * LONG TASK TRACKER - Capture detailed call stacks during lag
 *
 * Instruments performance to show exactly which functions are slow
 */

let isTracking = false;
let callStack: Array<{ name: string; start: number; duration?: number }> = [];

// Override console functions to capture timing
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

export function startLongTaskTracking() {
  if (process.env.NODE_ENV !== "development" || isTracking) return;

  isTracking = true;

  // Capture performance logs from our profiler
  console.warn = (...args) => {
    const message = args[0];
    if (typeof message === "string" && message.startsWith("[perf]")) {
      const match = message.match(/\[perf\] (.+) took ([\d.]+)ms/);
      if (match) {
        const [, functionName, duration] = match;
        addToCallStack(functionName, parseFloat(duration));
      }
    }
    originalConsoleWarn(...args);
  };

  console.log(
    "🔍 Long task tracking enabled - will capture slow function calls"
  );
}

function addToCallStack(name: string, duration: number) {
  callStack.push({
    name,
    start: performance.now(),
    duration,
  });

  // Keep only recent entries to avoid memory bloat
  if (callStack.length > 50) {
    callStack = callStack.slice(-30);
  }

  // If this is a really slow operation, log the current stack
  if (duration > 100) {
    console.group(`🐌 SLOW OPERATION: ${name} (${duration.toFixed(2)}ms)`);
    console.log("Recent call stack:", getRecentSlowCalls());
    console.log("Full stack trace:", new Error().stack);
    console.groupEnd();
  }
}

export function getRecentSlowCalls() {
  const now = performance.now();
  return callStack
    .filter((call) => now - call.start < 5000) // Last 5 seconds
    .filter((call) => (call.duration || 0) > 10) // Only slow calls
    .sort((a, b) => (b.duration || 0) - (a.duration || 0))
    .slice(0, 10)
    .map((call) => `${call.name}: ${call.duration?.toFixed(2)}ms`);
}

export function stopLongTaskTracking() {
  if (!isTracking) return;

  isTracking = false;
  console.warn = originalConsoleWarn;
  console.log = originalConsoleLog;

  console.log("🔍 Long task tracking disabled");

  if (callStack.length > 0) {
    console.group("📊 PERFORMANCE SUMMARY");
    console.log("Slowest operations during session:");
    console.table(
      callStack
        .filter((call) => (call.duration || 0) > 10)
        .sort((a, b) => (b.duration || 0) - (a.duration || 0))
        .slice(0, 15)
        .map((call) => ({
          Function: call.name,
          Duration: `${call.duration?.toFixed(2)}ms`,
        }))
    );
    console.groupEnd();
  }
}

// Auto-start tracking in development
if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
  // Start tracking after a brief delay to let app initialize
  setTimeout(startLongTaskTracking, 1000);

  // Stop tracking and show summary when page unloads
  window.addEventListener("beforeunload", stopLongTaskTracking);
}
