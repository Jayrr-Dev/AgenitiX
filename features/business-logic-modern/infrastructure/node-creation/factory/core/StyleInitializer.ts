/**
 * ENTERPRISE STYLE INITIALIZER
 *
 * Provides comprehensive CSS injection and style management for the node factory system.
 * Handles SSR-optimized style injection with duplicate prevention and performance optimization.
 *
 * FEATURES:
 * • SSR-optimized CSS injection with build-time inlining
 * • Duplicate prevention using sentinel pattern
 * • Fast Refresh compatibility for React development
 * • State machine visual feedback styles
 * • Performance-optimized animations and transitions
 * • Enterprise-grade styling with accessibility support
 *
 * PERFORMANCE BENEFITS:
 * • Prevents duplicate style injections
 * • Uses CSS transforms for hardware acceleration
 * • Optimized animations with cubic-bezier easing
 * • Minimal DOM manipulation overhead
 *
 * @author Factory Styling Team
 * @since v3.0.0
 * @keywords style-injection, css-optimization, ssr, animations, enterprise-styling
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface StyleInitializerOptions {
  /** Whether to enable debug logging (default: false) */
  debug?: boolean;
  /** Custom CSS selector for duplicate checking (default: "[data-enterprise-factory-styles]") */
  selector?: string;
  /** Custom style element ID (default: "enterprise-factory-styles") */
  styleId?: string;
  /** Whether to force re-injection (default: false) */
  forceReinject?: boolean;
  /** Additional CSS to append to base styles */
  additionalCSS?: string;
}

export interface StyleMetrics {
  /** Whether styles are currently injected */
  isInjected: boolean;
  /** Time when styles were last injected */
  lastInjectedAt?: string;
  /** Style element reference */
  styleElement?: HTMLStyleElement;
  /** Number of injection attempts */
  injectionAttempts: number;
  /** Size of injected CSS in bytes */
  cssSize: number;
}

// ============================================================================
// GLOBAL STATE
// ============================================================================

// Global sentinel to prevent duplicate style injection
let globalStyleSentinel = false;
let styleMetrics: StyleMetrics = {
  isInjected: false,
  injectionAttempts: 0,
  cssSize: 0,
};

// ============================================================================
// ENTERPRISE CSS STYLES
// ============================================================================

/**
 * Comprehensive CSS styles for enterprise node factory
 * Optimized for performance with hardware acceleration and minimal reflow
 */
export const ENTERPRISE_STYLES = `
  /* Enterprise Node Factory Styles with State Machine Support */
  .node-active-instant {
    box-shadow: 0 0 8px 2px rgba(34, 197, 94, 0.8);
    transform: translateZ(0) scale(1.02);
    transition: all 0.1s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .node-inactive-instant {
    box-shadow: none;
    transform: translateZ(0) scale(1);
    opacity: 0.9;
    transition: all 0.1s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* State Machine Visual Feedback */
  [data-node-state="ACTIVE"] {
    border: 2px solid rgba(34, 197, 94, 0.8);
    box-shadow: 0 0 12px 3px rgba(34, 197, 94, 0.4);
  }

  [data-node-state="INACTIVE"] {
    border: 2px solid rgba(156, 163, 175, 0.3);
    opacity: 0.8;
  }

  [data-node-state="PENDING_ACTIVATION"] {
    border: 2px solid rgba(255, 193, 7, 0.8);
    box-shadow: 0 0 8px 2px rgba(255, 193, 7, 0.3);
    animation: pending-pulse 1.5s ease-in-out infinite;
  }

  [data-node-state="PENDING_DEACTIVATION"] {
    border: 2px solid rgba(255, 107, 0, 0.8);
    box-shadow: 0 0 8px 2px rgba(255, 107, 0, 0.3);
    animation: deactivating-pulse 1s ease-in-out infinite;
  }

  @keyframes pending-pulse {
    0%, 100% { opacity: 0.8; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.01); }
  }

  @keyframes deactivating-pulse {
    0%, 100% { opacity: 0.9; transform: scale(1); }
    50% { opacity: 0.7; transform: scale(0.99); }
  }

  [data-enterprise-factory="true"] {
    will-change: transform, opacity, box-shadow;
    transform: translateZ(0);
    backface-visibility: hidden;
    perspective: 1000px;
  }

  .safety-indicator {
    background: linear-gradient(45deg, #10B981, #059669);
    border: 1px solid rgba(16, 185, 129, 0.3);
    backdrop-filter: blur(4px);
  }

  .loading-placeholder {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: loading-shimmer 1.5s infinite;
  }

  @keyframes loading-shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* Performance Optimizations */
  .node-active-instant,
  .node-inactive-instant,
  [data-node-state] {
    contain: layout style paint;
  }

  /* Accessibility Improvements */
  @media (prefers-reduced-motion: reduce) {
    .node-active-instant,
    .node-inactive-instant,
    [data-node-state] {
      transition: none;
      animation: none;
    }
  }

  /* High Contrast Mode Support */
  @media (prefers-contrast: high) {
    [data-node-state="ACTIVE"] {
      border-width: 3px;
      box-shadow: 0 0 15px 4px rgba(34, 197, 94, 0.6);
    }

    [data-node-state="INACTIVE"] {
      border-width: 3px;
      opacity: 1;
    }
  }

  /* Print Styles */
  @media print {
    [data-node-state],
    .node-active-instant,
    .node-inactive-instant {
      animation: none;
      box-shadow: none;
      transform: none;
    }
  }
`;

// ============================================================================
// STYLE INJECTION FUNCTIONS
// ============================================================================

/**
 * Initialize enterprise safety styles with comprehensive duplicate prevention
 * Uses sentinel pattern to prevent Fast Refresh duplicates and provides metrics
 *
 * @param options - Style initialization options
 * @returns Style injection result with metrics
 *
 * @example
 * ```typescript
 * const result = initializeEnterpriseStyles({ debug: true });
 * if (result.success) {
 *   console.log('Styles injected successfully:', result.metrics);
 * }
 * ```
 */
export function initializeEnterpriseStyles(
  options: StyleInitializerOptions = {}
): { success: boolean; metrics: StyleMetrics; message: string } {
  const {
    debug = false,
    selector = "[data-enterprise-factory-styles]",
    styleId = "enterprise-factory-styles",
    forceReinject = false,
    additionalCSS = "",
  } = options;

  styleMetrics.injectionAttempts++;

  // SSR check
  if (typeof window === "undefined") {
    if (debug)
      console.log("[StyleInitializer] Skipping injection - SSR environment");
    return {
      success: false,
      metrics: styleMetrics,
      message: "SSR environment - styles will be injected client-side",
    };
  }

  // Check sentinel unless forcing reinject
  if (globalStyleSentinel && !forceReinject) {
    if (debug)
      console.log("[StyleInitializer] Styles already injected via sentinel");
    return {
      success: true,
      metrics: styleMetrics,
      message: "Styles already injected (sentinel check)",
    };
  }

  // Check for existing styles using data attribute selector
  const existingStyle = document.querySelector(selector) as HTMLStyleElement;
  if (existingStyle && !forceReinject) {
    if (debug) console.log("[StyleInitializer] Existing styles found");
    styleMetrics.isInjected = true;
    styleMetrics.styleElement = existingStyle;
    globalStyleSentinel = true;
    return {
      success: true,
      metrics: styleMetrics,
      message: "Existing styles found",
    };
  }

  try {
    // Remove existing style if forcing reinject
    if (forceReinject && existingStyle) {
      existingStyle.remove();
      if (debug)
        console.log("[StyleInitializer] Removed existing styles for reinject");
    }

    // Create and inject new style element
    const styleElement = document.createElement("style");
    styleElement.id = styleId;
    styleElement.setAttribute("data-enterprise-factory-styles", "true");

    const finalCSS = additionalCSS
      ? `${ENTERPRISE_STYLES}\n\n/* Additional CSS */\n${additionalCSS}`
      : ENTERPRISE_STYLES;

    styleElement.textContent = finalCSS;
    document.head.appendChild(styleElement);

    // Update metrics
    styleMetrics.isInjected = true;
    styleMetrics.lastInjectedAt = new Date().toISOString();
    styleMetrics.styleElement = styleElement;
    styleMetrics.cssSize = finalCSS.length;
    globalStyleSentinel = true;

    if (debug) {
      console.log("[StyleInitializer] Styles injected successfully", {
        cssSize: styleMetrics.cssSize,
        hasAdditionalCSS: !!additionalCSS,
        injectionAttempts: styleMetrics.injectionAttempts,
      });
    }

    return {
      success: true,
      metrics: styleMetrics,
      message: "Styles injected successfully",
    };
  } catch (error) {
    if (debug) console.error("[StyleInitializer] Injection failed:", error);
    return {
      success: false,
      metrics: styleMetrics,
      message: `Injection failed: ${error}`,
    };
  }
}

/**
 * Legacy initialization function for backward compatibility
 * Maintains the original simple interface
 */
export function initializeEnterpriseStylesLegacy(): void {
  initializeEnterpriseStyles();
}

// ============================================================================
// STYLE MANAGEMENT UTILITIES
// ============================================================================

/**
 * Remove enterprise styles from the document
 * Useful for cleanup or testing scenarios
 *
 * @param options - Removal options
 * @returns Whether styles were successfully removed
 */
export function removeEnterpriseStyles(
  options: {
    selector?: string;
    resetSentinel?: boolean;
    debug?: boolean;
  } = {}
): boolean {
  const {
    selector = "[data-enterprise-factory-styles]",
    resetSentinel = true,
    debug = false,
  } = options;

  if (typeof window === "undefined") {
    if (debug)
      console.log("[StyleInitializer] Cannot remove styles - SSR environment");
    return false;
  }

  try {
    const styleElement = document.querySelector(selector) as HTMLStyleElement;
    if (styleElement) {
      styleElement.remove();
      if (resetSentinel) {
        globalStyleSentinel = false;
        styleMetrics.isInjected = false;
        styleMetrics.styleElement = undefined;
      }
      if (debug) console.log("[StyleInitializer] Styles removed successfully");
      return true;
    } else {
      if (debug) console.log("[StyleInitializer] No styles found to remove");
      return false;
    }
  } catch (error) {
    if (debug) console.error("[StyleInitializer] Removal failed:", error);
    return false;
  }
}

/**
 * Check if enterprise styles are currently injected
 * @returns Current injection status
 */
export function areStylesInjected(): boolean {
  if (typeof window === "undefined") return false;
  return (
    globalStyleSentinel &&
    !!document.querySelector("[data-enterprise-factory-styles]")
  );
}

/**
 * Get current style metrics and status
 * @returns Comprehensive style metrics
 */
export function getStyleMetrics(): StyleMetrics {
  return {
    ...styleMetrics,
    isInjected: areStylesInjected(),
  };
}

/**
 * Reset the style injection sentinel (useful for testing)
 * @param hardReset - Whether to also reset metrics
 */
export function resetStyleSentinel(hardReset = false): void {
  globalStyleSentinel = false;
  if (hardReset) {
    styleMetrics = {
      isInjected: false,
      injectionAttempts: 0,
      cssSize: 0,
    };
  }
}

/**
 * Validate that all required CSS classes are present in the stylesheet
 * @returns Validation result with missing classes
 */
export function validateInjectedStyles(): {
  isValid: boolean;
  missingClasses: string[];
  totalClasses: number;
} {
  const requiredClasses = [
    "node-active-instant",
    "node-inactive-instant",
    "safety-indicator",
    "loading-placeholder",
  ];

  const requiredSelectors = [
    '[data-node-state="ACTIVE"]',
    '[data-node-state="INACTIVE"]',
    '[data-node-state="PENDING_ACTIVATION"]',
    '[data-node-state="PENDING_DEACTIVATION"]',
    '[data-enterprise-factory="true"]',
  ];

  const missingClasses: string[] = [];
  const allSelectors = [
    ...requiredClasses.map((c) => `.${c}`),
    ...requiredSelectors,
  ];

  if (typeof window === "undefined" || !styleMetrics.styleElement) {
    return {
      isValid: false,
      missingClasses: allSelectors,
      totalClasses: allSelectors.length,
    };
  }

  const cssText = styleMetrics.styleElement.textContent || "";

  allSelectors.forEach((selector) => {
    if (!cssText.includes(selector)) {
      missingClasses.push(selector);
    }
  });

  return {
    isValid: missingClasses.length === 0,
    missingClasses,
    totalClasses: allSelectors.length,
  };
}
