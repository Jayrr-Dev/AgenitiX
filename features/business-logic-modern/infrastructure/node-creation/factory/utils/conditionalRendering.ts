/**
 * CONDITIONAL RENDERING UTILITY - Dynamic UI rendering system
 *
 * • Provides advanced conditional rendering logic for factory nodes
 * • Implements dynamic UI component selection and configuration
 * • Supports rule-based rendering with validation and error handling
 * • Features performance-optimized rendering with lazy evaluation
 * • Integrates with node factory systems for flexible UI generation
 *
 * Keywords: conditional-rendering, dynamic-ui, rule-based, lazy-evaluation, ui-generation, factory
 */

// ============================================================================
// CONDITIONAL RENDERING UTILITIES
// ============================================================================

// ============================================================================
// ERROR STATE CALCULATION
// ============================================================================

/**
 * CALCULATE ERROR STATE FOR RENDERING
 * Extracts complex error state logic with early returns
 */
export function calculateRenderError(
  processingError: string | null,
  nodeData: any,
  supportsErrorInjection: boolean
): string | null {
  // EARLY RETURN: No error injection support and no processing error
  if (!supportsErrorInjection && !processingError) {
    return null;
  }

  // EARLY RETURN: Processing error takes priority
  if (processingError) {
    return processingError;
  }

  // EARLY RETURN: No error injection data
  if (!supportsErrorInjection) {
    return null;
  }

  // ERROR INJECTION ERROR STATE
  if (nodeData?.isErrorState === true) {
    return nodeData?.error || "Error state active";
  }

  return null;
}

// ============================================================================
// NODE SIZE CALCULATION
// ============================================================================

/**
 * GET NODE SIZE WITH SMART DEFAULTS
 * Simplified size calculation with early returns
 * Enhanced to handle variable height expanded sizes
 */
export function getNodeSize(
  configSize: any,
  nodeType: string,
  showUI: boolean
): { width: string; height: string } {
  // EARLY RETURN: Custom size provided
  if (configSize) {
    const targetSize = showUI ? configSize.expanded : configSize.collapsed;

    // Handle variable height sizes (expanded sizes without height)
    if (showUI && configSize.expanded && !configSize.expanded.height) {
      console.log(
        `🎯 [getNodeSize] Variable height detected for ${nodeType}:`,
        configSize.expanded
      );
      return {
        width: configSize.expanded.width,
        height: "auto", // Let content determine height
      };
    }

    // Handle regular fixed sizes
    if (targetSize && targetSize.width && targetSize.height) {
      return {
        width: targetSize.width,
        height: targetSize.height,
      };
    }

    // Fallback if size structure is unexpected
    console.warn(
      `[getNodeSize] Unexpected size structure for ${nodeType}:`,
      configSize
    );
  }

  // SMART DEFAULT SIZE SELECTION
  const smartSize = getSmartDefaultSize(nodeType);
  return showUI ? smartSize.expanded : smartSize.collapsed;
}

/**
 * GET SMART DEFAULT SIZE
 * Extract size logic for different node types
 */
function getSmartDefaultSize(nodeType: string): any {
  const lowerType = nodeType.toLowerCase();

  // TRIGGER NODE PATTERNS
  if (
    lowerType.includes("trigger") ||
    lowerType.includes("cycle") ||
    lowerType.includes("pulse")
  ) {
    return {
      collapsed: { width: "w-[50px]", height: "h-[50px]" },
      expanded: { width: "w-[120px]", height: "h-[120px]" },
    };
  }

  // LOGIC NODE PATTERNS
  if (
    lowerType.includes("logic") ||
    lowerType.includes("gate") ||
    lowerType.includes("operator")
  ) {
    return {
      collapsed: { width: "w-[60px]", height: "h-[60px]" },
      expanded: { width: "w-[120px]", height: "h-[100px]" },
    };
  }

  // DEFAULT TEXT NODE SIZE
  return {
    collapsed: { width: "w-[120px]", height: "h-[60px]" },
    expanded: { width: "w-[240px]", height: "h-[120px]" },
  };
}

// ============================================================================
// STYLING THEME SELECTION
// ============================================================================

/**
 * SELECT BUTTON THEME
 * Simplify button theme selection with early returns
 */
export function selectButtonTheme(
  hasError: boolean,
  errorButtonTheme: any,
  categoryButtonTheme: any
): any {
  // EARLY RETURN: Error state takes priority
  if (hasError) {
    return errorButtonTheme;
  }

  return categoryButtonTheme;
}

/**
 * SELECT TEXT THEME
 * Simplify text theme selection
 */
export function selectTextTheme(
  hasError: boolean,
  errorTextTheme: any,
  categoryTextTheme: any
): any {
  // EARLY RETURN: Error state takes priority
  if (hasError) {
    return errorTextTheme;
  }

  return categoryTextTheme;
}

// ============================================================================
// HANDLE VISIBILITY LOGIC
// ============================================================================

/**
 * SHOULD SHOW VIBE HANDLE
 * Handles vibe handle visibility logic (V handles only)
 */
export function shouldShowVibeHandle(
  handle: any,
  connections: any[],
  allNodes: any[],
  showVibeHandles: boolean,
  isVibeModeActive: boolean
): boolean {
  // EARLY RETURN: Not a vibe handle (using V as identifier)
  if (handle.dataType !== "V") {
    return true;
  }

  // CHECK FOR EXISTING CONNECTION
  const hasVibeConnection = connections.some(
    (c) => c.targetHandle === handle.id
  );

  // EARLY RETURN: Already connected (always visible)
  if (hasVibeConnection) {
    return true;
  }

  // VISIBILITY PRIORITY ORDER:
  // 1. Explicit show vibe handles setting
  // 2. Vibe Mode active
  return showVibeHandles || isVibeModeActive;
}

/**
 * GET VIBE HANDLE OPACITY
 * Returns the opacity value for vibe handles when they should be dimmed
 */
export function getVibeHandleOpacity(
  handle: any,
  showVibeHandles: boolean,
  vibeHandleOpacity: number
): number {
  // EARLY RETURN: Not a vibe handle or should be fully visible
  if (handle.dataType !== "V" || showVibeHandles) {
    return 1.0;
  }

  // Return the configured opacity for dimmed vibe handles
  return vibeHandleOpacity;
}

/**
 * SHOULD SHOW JSON HANDLE (LEGACY)
 * Legacy function maintained for backwards compatibility
 * Now only handles vibe handles - all other handles (including {}) show normally
 */
export function shouldShowJsonHandle(
  handle: any,
  connections: any[],
  allNodes: any[],
  showJsonHandles: boolean,
  isVibeModeActive: boolean
): boolean {
  // Check if it's a vibe handle
  if (handle.dataType === "V") {
    return shouldShowVibeHandle(
      handle,
      connections,
      allNodes,
      showJsonHandles,
      isVibeModeActive
    );
  }

  // For all other handles (including {}), show them normally
  return true;
}

// ============================================================================
// ERROR INJECTION DEBUG LOGGING
// ============================================================================

/**
 * LOG ERROR INJECTION STATE
 * Extract debug logging logic
 */
export function logErrorInjectionState(
  nodeType: string,
  nodeId: string,
  errorState: any
): void {
  // EARLY RETURN: No error injection
  if (!errorState.supportsErrorInjection || !errorState.hasVibeError) {
    return;
  }

  console.log(
    `🎨 [NodeRendering] ${nodeType} ${nodeId}: Error injection active:`,
    {
      hasVibeError: errorState.hasVibeError,
      errorType: errorState.finalErrorType,
      errorMessage: errorState.finalErrorForStyling,
      supportsErrorInjection: errorState.supportsErrorInjection,
    }
  );
}
