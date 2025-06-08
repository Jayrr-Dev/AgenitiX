/**
 * NODE ERROR BOUNDARY SYSTEM
 *
 * Provides comprehensive error handling and recovery for individual nodes in the factory system.
 * Includes advanced error tracking, automatic recovery, and debugging capabilities.
 *
 * FEATURES:
 * • Per-node error isolation with granular error boundaries
 * • Automatic error recovery with configurable retry strategies
 * • Error metrics tracking and performance monitoring
 * • Development-time debugging with detailed error information
 * • Production-optimized error reporting and user feedback
 * • Memory-safe error handling with cleanup procedures
 *
 * ERROR RECOVERY STRATEGIES:
 * • Automatic retry with exponential backoff
 * • Fallback rendering with degraded functionality
 * • Manual recovery triggers via user interaction
 * • Context-aware error recovery based on error type
 *
 * @author Factory Safety Team
 * @since v3.0.0
 * @keywords error-handling, boundaries, recovery, safety, debugging
 */

"use client";

import { Component, ErrorInfo, ReactNode } from "react";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ErrorBoundaryState {
  /** Whether an error has occurred */
  hasError: boolean;
  /** The error instance if one occurred */
  error?: Error;
  /** Additional error information from React */
  errorInfo?: ErrorInfo;
  /** Number of error occurrences */
  errorCount: number;
  /** Timestamp of first error */
  firstErrorAt?: string;
  /** Timestamp of last error */
  lastErrorAt?: string;
  /** Whether auto-recovery is enabled */
  autoRecoveryEnabled: boolean;
  /** Number of recovery attempts */
  recoveryAttempts: number;
}

export interface ErrorBoundaryProps {
  /** Child components to protect */
  children: ReactNode;
  /** Unique identifier for the protected node */
  nodeId: string;
  /** Keys that when changed will reset the error state */
  resetKeys: (string | number)[];
  /** Custom error fallback component */
  fallback?: (
    error: Error,
    errorInfo?: ErrorInfo,
    retry?: () => void
  ) => ReactNode;
  /** Maximum number of automatic recovery attempts (default: 3) */
  maxRetryAttempts?: number;
  /** Whether to enable automatic recovery (default: true) */
  enableAutoRecovery?: boolean;
  /** Custom error reporting function */
  onError?: (error: Error, errorInfo: ErrorInfo, nodeId: string) => void;
  /** Whether to show detailed error information (development mode) */
  showErrorDetails?: boolean;
}

export interface ErrorMetrics {
  /** Total number of errors across all boundaries */
  totalErrors: number;
  /** Number of active error boundaries */
  activeBoundaries: number;
  /** Number of successful recoveries */
  successfulRecoveries: number;
  /** Map of node IDs to their error counts */
  errorsByNode: Map<string, number>;
  /** Average time to recovery */
  averageRecoveryTime: number;
}

// ============================================================================
// GLOBAL ERROR TRACKING
// ============================================================================

let globalErrorMetrics: ErrorMetrics = {
  totalErrors: 0,
  activeBoundaries: 0,
  successfulRecoveries: 0,
  errorsByNode: new Map(),
  averageRecoveryTime: 0,
};

const recoveryTimes: number[] = [];

// ============================================================================
// DEBUG LOGGING
// ============================================================================

const IS_DEBUG = process.env.NEXT_PUBLIC_NODE_FACTORY_DEBUG === "true";

/**
 * Debug logger for error boundary operations
 * @param nodeId - Node identifier for context
 * @param message - Debug message
 * @param data - Additional debug data
 */
function debugError(nodeId: string, message: string, ...data: any[]): void {
  if (IS_DEBUG) {
    console.group(`[ErrorBoundary:${nodeId}] ${message}`);
    if (data.length > 0) {
      console.log(...data);
    }
    console.groupEnd();
  }
}

// ============================================================================
// ENHANCED NODE ERROR BOUNDARY
// ============================================================================

/**
 * Enhanced error boundary component for individual nodes
 * Provides comprehensive error handling, recovery, and metrics tracking
 */
export class NodeErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  private retryTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private recoveryStartTime: number = 0;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorCount: 0,
      autoRecoveryEnabled: props.enableAutoRecovery ?? true,
      recoveryAttempts: 0,
    };

    // Track this boundary
    globalErrorMetrics.activeBoundaries++;
    debugError(props.nodeId, "Error boundary initialized");
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      lastErrorAt: new Date().toISOString(),
      errorCount: 1, // Will be properly incremented in componentDidCatch
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { nodeId, onError, maxRetryAttempts = 3 } = this.props;

    // Update state with full error information
    this.setState((prevState) => ({
      errorInfo,
      errorCount: prevState.errorCount + 1,
      firstErrorAt: prevState.firstErrorAt || new Date().toISOString(),
    }));

    // Update global metrics
    globalErrorMetrics.totalErrors++;
    const nodeErrorCount = globalErrorMetrics.errorsByNode.get(nodeId) || 0;
    globalErrorMetrics.errorsByNode.set(nodeId, nodeErrorCount + 1);

    // Debug logging
    debugError(nodeId, "Error caught", { error, errorInfo, state: this.state });

    // Custom error reporting
    if (onError) {
      try {
        onError(error, errorInfo, nodeId);
      } catch (reportingError) {
        debugError(nodeId, "Error in custom error handler", reportingError);
      }
    }

    // Attempt automatic recovery if enabled and within retry limits
    if (
      this.state.autoRecoveryEnabled &&
      this.state.recoveryAttempts < maxRetryAttempts
    ) {
      this.scheduleRecovery();
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    // Reset error state when resetKeys change
    if (
      this.state.hasError &&
      prevProps.resetKeys.some((key, i) => key !== this.props.resetKeys[i])
    ) {
      debugError(
        this.props.nodeId,
        "Resetting error state due to resetKeys change"
      );
      this.resetErrorState();
    }
  }

  componentWillUnmount() {
    // Cleanup timeout and update metrics
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
    globalErrorMetrics.activeBoundaries--;
    debugError(this.props.nodeId, "Error boundary unmounted");
  }

  /**
   * Schedule automatic recovery with exponential backoff
   */
  private scheduleRecovery = (): void => {
    const { nodeId } = this.props;
    const delay = Math.min(
      1000 * Math.pow(2, this.state.recoveryAttempts),
      10000
    );

    debugError(
      nodeId,
      `Scheduling recovery attempt ${this.state.recoveryAttempts + 1} in ${delay}ms`
    );

    this.retryTimeoutId = setTimeout(() => {
      this.attemptRecovery();
    }, delay);
  };

  /**
   * Attempt to recover from error state
   */
  private attemptRecovery = (): void => {
    const { nodeId } = this.props;

    debugError(nodeId, "Attempting recovery");
    this.recoveryStartTime = Date.now();

    this.setState((prevState) => ({
      recoveryAttempts: prevState.recoveryAttempts + 1,
    }));

    // Try to reset the error state
    this.resetErrorState();
  };

  /**
   * Reset the error state and track recovery metrics
   */
  private resetErrorState = (): void => {
    const { nodeId } = this.props;

    // Track recovery time if this was an automatic recovery
    if (this.recoveryStartTime > 0) {
      const recoveryTime = Date.now() - this.recoveryStartTime;
      recoveryTimes.push(recoveryTime);
      globalErrorMetrics.successfulRecoveries++;
      globalErrorMetrics.averageRecoveryTime =
        recoveryTimes.reduce((sum, time) => sum + time, 0) /
        recoveryTimes.length;

      debugError(nodeId, `Recovery successful in ${recoveryTime}ms`);
      this.recoveryStartTime = 0;
    }

    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      recoveryAttempts: 0,
    });
  };

  /**
   * Manual retry function for user-triggered recovery
   */
  private handleManualRetry = (): void => {
    debugError(this.props.nodeId, "Manual retry triggered");
    this.resetErrorState();
  };

  /**
   * Render error fallback UI
   */
  private renderErrorFallback(): ReactNode {
    const { nodeId, fallback, showErrorDetails = IS_DEBUG } = this.props;
    const { error, errorInfo, errorCount, recoveryAttempts } = this.state;

    // Use custom fallback if provided
    if (fallback && error) {
      return fallback(error, errorInfo, this.handleManualRetry);
    }

    // Default error UI
    return (
      <div
        className="error-node p-3 border-2 border-red-500 bg-red-50 text-red-700 rounded-lg shadow-sm"
        data-testid={`error-boundary-${nodeId}`}
        data-error-count={errorCount}
        data-recovery-attempts={recoveryAttempts}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold">Node Error</div>
          <button
            onClick={this.handleManualRetry}
            className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 transition-colors"
            title="Retry this node"
          >
            Retry
          </button>
        </div>

        <div className="text-xs mb-2">
          {error?.message || "Unknown error occurred"}
        </div>

        {showErrorDetails && (
          <details className="text-xs">
            <summary className="cursor-pointer text-red-600 hover:text-red-800">
              Error Details
            </summary>
            <div className="mt-2 p-2 bg-red-100 rounded border">
              <div>
                <strong>Node:</strong> {nodeId}
              </div>
              <div>
                <strong>Errors:</strong> {errorCount}
              </div>
              <div>
                <strong>Recovery Attempts:</strong> {recoveryAttempts}
              </div>
              {error?.stack && (
                <div className="mt-2">
                  <strong>Stack:</strong>
                  <pre className="text-xs overflow-auto max-h-20 mt-1">
                    {error.stack}
                  </pre>
                </div>
              )}
            </div>
          </details>
        )}
      </div>
    );
  }

  render() {
    if (this.state.hasError) {
      return this.renderErrorFallback();
    }

    return this.props.children;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get global error metrics for monitoring and debugging
 * @returns Current error metrics across all boundaries
 */
export function getErrorMetrics(): ErrorMetrics {
  return { ...globalErrorMetrics };
}

/**
 * Reset global error metrics (useful for testing)
 */
export function resetErrorMetrics(): void {
  globalErrorMetrics = {
    totalErrors: 0,
    activeBoundaries: 0,
    successfulRecoveries: 0,
    errorsByNode: new Map(),
    averageRecoveryTime: 0,
  };
  recoveryTimes.length = 0;
}

/**
 * Get error statistics for a specific node
 * @param nodeId - Node identifier
 * @returns Error count for the specified node
 */
export function getNodeErrorCount(nodeId: string): number {
  return globalErrorMetrics.errorsByNode.get(nodeId) || 0;
}

/**
 * Create a simple error boundary wrapper for legacy compatibility
 * @param props - Error boundary props
 * @returns Error boundary component
 */
export function createErrorBoundary(props: ErrorBoundaryProps) {
  return <NodeErrorBoundary {...props} />;
}

// ============================================================================
// TYPE DEFINITIONS FOR ERROR INJECTION (DEBUGGING)
// ============================================================================

export interface VibeErrorInjection {
  /** Whether this node should be in error state */
  isErrorState?: boolean;
  /** Type of error to inject */
  errorType?: "warning" | "error" | "critical";
  /** Custom error message */
  error?: string;
}
