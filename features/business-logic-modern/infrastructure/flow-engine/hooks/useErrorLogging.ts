/**
 * ERROR LOGGING HOOK - Safe error tracking without console override
 *
 * • Uses window error events and React error boundaries for error tracking
 * • No console method overrides to prevent originalError crashes
 * • Filters out React internal errors to focus on user code issues
 * • Automatically logs errors for the currently selected node
 * • Provides safe cleanup without console restoration issues
 *
 * Keywords: error-tracking, window-events, error-boundary, safe-logging, node-errors
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
  reactFlowInstance?: any;
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
    message.includes("Internal React error") ||
    message.includes("Warning:") ||
    message.includes("validateDOMNesting") ||
    message.includes("React Flow") ||
    message.includes("Couldn't create edge")
  );
}

// ============================================================================
// MAIN HOOK
// ============================================================================

/**
 * Custom hook for safe error logging without console override
 */
export function useErrorLogging({
  selectedNodeId,
  logNodeError,
  reactFlowInstance,
}: UseErrorLoggingProps) {
  useEffect(() => {
    // Safe error handling using window events instead of console override
    const handleError = (event: ErrorEvent) => {
      const message = event.message || event.error?.message || "Unknown error";

      // Filter out React internals and system errors
      if (isReactInternalError(message)) {
        return;
      }

      // Only log if we have a selected node
      if (selectedNodeId) {
        try {
          logNodeError(selectedNodeId, message, "error", "window.error");
        } catch (err) {
          // Silent failure to prevent infinite loops
        }
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const message =
        event.reason?.message ||
        String(event.reason) ||
        "Unhandled promise rejection";

      // Filter out React internals and system errors
      if (isReactInternalError(message)) {
        return;
      }

      // Only log if we have a selected node
      if (selectedNodeId) {
        try {
          logNodeError(selectedNodeId, message, "error", "unhandled.rejection");
        } catch (err) {
          // Silent failure to prevent infinite loops
        }
      }
    };

    // Add event listeners for error tracking
    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    // Cleanup function to remove event listeners
    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection
      );
    };
  }, [selectedNodeId, logNodeError, reactFlowInstance]);
}
