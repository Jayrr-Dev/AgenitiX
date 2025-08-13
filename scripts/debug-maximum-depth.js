/**
 * MAXIMUM DEPTH DEBUG SCRIPT
 *
 * This script helps identify and debug maximum depth errors in your React components.
 * Run this in the browser console to get detailed information about render cycles.
 *
 * Usage:
 * 1. Open browser console
 * 2. Run: await import('/scripts/debug-maximum-depth.js')
 * 3. Check the console for detailed render information
 *
 * Keywords: maximum-depth-debugging, render-cycles, infinite-loops
 */

// Global debug state
window.debugState = {
  renderCounts: new Map(),
  lastRenderTime: new Map(),
  renderStack: new Set(),
  maxDepthErrors: [],
  excessiveRenders: [],
};

// Enhanced console logging for maximum depth detection
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.error = function (...args) {
  const message = args.join(" ");

  // Check for maximum depth error
  if (
    message.includes("Maximum update depth exceeded") ||
    message.includes("Maximum call stack size exceeded") ||
    message.includes("too many re-renders")
  ) {
    const errorInfo = {
      message,
      timestamp: new Date().toISOString(),
      stack: new Error().stack,
      renderCounts: Array.from(window.debugState.renderCounts.entries()),
      renderStack: Array.from(window.debugState.renderStack),
    };

    window.debugState.maxDepthErrors.push(errorInfo);

    console.group("🚨 MAXIMUM DEPTH ERROR DETECTED");
    console.error("Error:", message);
    console.error("Timestamp:", errorInfo.timestamp);
    console.error("Render Counts:", errorInfo.renderCounts);
    console.error("Current Render Stack:", errorInfo.renderStack);
    console.error("Stack Trace:", errorInfo.stack);
    console.groupEnd();
  }

  originalConsoleError.apply(console, args);
};

console.warn = function (...args) {
  const message = args.join(" ");

  // Check for excessive re-renders
  if (
    message.includes("EXCESSIVE RE-RENDERS") ||
    message.includes("INFINITE LOOP DETECTED")
  ) {
    const warningInfo = {
      message,
      timestamp: new Date().toISOString(),
      renderCounts: Array.from(window.debugState.renderCounts.entries()),
    };

    window.debugState.excessiveRenders.push(warningInfo);
  }

  originalConsoleWarn.apply(console, args);
};

// Debug functions for manual inspection
window.debugHelpers = {
  // Get current render statistics
  getRenderStats() {
    return {
      renderCounts: Array.from(window.debugState.renderCounts.entries()),
      renderStack: Array.from(window.debugState.renderStack),
      maxDepthErrors: window.debugState.maxDepthErrors,
      excessiveRenders: window.debugState.excessiveRenders,
    };
  },

  // Clear debug state
  clearDebugState() {
    window.debugState.renderCounts.clear();
    window.debugState.lastRenderTime.clear();
    window.debugState.renderStack.clear();
    window.debugState.maxDepthErrors = [];
    window.debugState.excessiveRenders = [];
    console.log("🧹 Debug state cleared");
  },

  // Find components with excessive renders
  findExcessiveRenders(threshold = 10) {
    const excessive = Array.from(window.debugState.renderCounts.entries())
      .filter(([_, count]) => count > threshold)
      .sort(([_, a], [__, b]) => b - a);

    console.log(`🔍 Components with >${threshold} renders:`, excessive);
    return excessive;
  },

  // Get detailed error information
  getErrorDetails() {
    return {
      maxDepthErrors: window.debugState.maxDepthErrors,
      excessiveRenders: window.debugState.excessiveRenders,
      totalErrors: window.debugState.maxDepthErrors.length,
      totalWarnings: window.debugState.excessiveRenders.length,
    };
  },
};

// Auto-log render statistics every 5 seconds in development
if (process.env.NODE_ENV === "development") {
  setInterval(() => {
    const stats = window.debugHelpers.getRenderStats();
    if (stats.renderCounts.length > 0) {
      console.log("📊 Render Statistics:", {
        totalComponents: stats.renderCounts.length,
        totalRenders: stats.renderCounts.reduce(
          (sum, [_, count]) => sum + count,
          0
        ),
        currentRenderStack: stats.renderStack.length,
        maxDepthErrors: stats.maxDepthErrors.length,
        excessiveRenders: stats.excessiveRenders.length,
      });
    }
  }, 5000);
}

console.log("🔍 Maximum Depth Debug Script Loaded");
console.log("Available commands:");
console.log("- window.debugHelpers.getRenderStats()");
console.log("- window.debugHelpers.clearDebugState()");
console.log("- window.debugHelpers.findExcessiveRenders()");
console.log("- window.debugHelpers.getErrorDetails()");
