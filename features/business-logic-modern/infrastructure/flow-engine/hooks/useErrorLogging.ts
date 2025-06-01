/**
 * ERROR LOGGING HOOK - Console error tracking and user error management
 *
 * • Intercepts console.error and console.warn for node-specific error tracking
 * • Filters out React internal errors to focus on user code issues
 * • Automatically logs errors for the currently selected node
 * • Provides cleanup to restore original console methods
 * • Integrates with node error tracking system
 *
 * Keywords: error-tracking, console-override, filtering, logging, cleanup, node-errors
 */

import { useEffect } from "react";

// ============================================================================
// TYPESCRIPT INTERFACES
// ============================================================================

interface UseErrorLoggingProps {
  selectedNodeId: string | null;
  logNodeError: (
    nodeId: string,
    message: string,
    type?: "error" | "warning" | "info",
    source?: string
  ) => void;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if error message is from React internals (should be ignored)
 */
function isReactInternalError(message: string): boolean {
  return (
    message.includes("React") ||
    message.includes("static flag") ||
    message.includes("Expected") ||
    message.includes("Internal React error")
  );
}

/**
 * Check if warning message is from React internals (should be ignored)
 */
function isReactInternalWarning(message: string): boolean {
  return (
    message.includes("React") ||
    message.includes("Warning:") ||
    message.includes("validateDOMNesting")
  );
}

// ============================================================================
// MAIN HOOK
// ============================================================================

/**
 * Custom hook for setting up error logging with proper cleanup
 */
export function useErrorLogging({
  selectedNodeId,
  logNodeError,
}: UseErrorLoggingProps) {
  useEffect(() => {
    // Store original console methods for restoration
    const originalError = console.error;
    const originalWarn = console.warn;

    // Override console.error for user error tracking
    console.error = (...args) => {
      originalError(...args);

      const message = args.join(" ");
      const isUserError = !isReactInternalError(message);

      if (selectedNodeId && isUserError) {
        logNodeError(selectedNodeId, message, "error", "console.error");
      }
    };

    // Override console.warn for user warning tracking
    console.warn = (...args) => {
      originalWarn(...args);

      const message = args.join(" ");
      const isUserWarning = !isReactInternalWarning(message);

      if (selectedNodeId && isUserWarning) {
        logNodeError(selectedNodeId, message, "warning", "console.warn");
      }
    };

    // Cleanup function to restore original console methods
    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, [selectedNodeId, logNodeError]);
}
