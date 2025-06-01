// ============================================================================
// CONDITIONAL RENDERING UTILITIES
// ============================================================================

import type { BaseNodeData } from '../types';

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
    return nodeData?.error || 'Error state active';
  }

  return null;
}

// ============================================================================
// NODE SIZE CALCULATION
// ============================================================================

/**
 * GET NODE SIZE WITH SMART DEFAULTS
 * Simplified size calculation with early returns
 */
export function getNodeSize(
  configSize: any,
  nodeType: string,
  showUI: boolean
): { width: string; height: string } {
  // EARLY RETURN: Custom size provided
  if (configSize) {
    return showUI ? configSize.expanded : configSize.collapsed;
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
  if (lowerType.includes('trigger') || 
      lowerType.includes('cycle') || 
      lowerType.includes('pulse')) {
    return {
      collapsed: { width: 'w-[50px]', height: 'h-[50px]' },
      expanded: { width: 'w-[120px]', height: 'h-[120px]' }
    };
  }

  // LOGIC NODE PATTERNS
  if (lowerType.includes('logic') || 
      lowerType.includes('gate') || 
      lowerType.includes('operator')) {
    return {
      collapsed: { width: 'w-[60px]', height: 'h-[60px]' },
      expanded: { width: 'w-[120px]', height: 'h-[100px]' }
    };
  }

  // DEFAULT TEXT NODE SIZE
  return {
    collapsed: { width: 'w-[120px]', height: 'h-[60px]' },
    expanded: { width: 'w-[240px]', height: 'h-[120px]' }
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
 * SHOULD SHOW JSON HANDLE
 * Extract complex JSON handle visibility logic
 */
export function shouldShowJsonHandle(
  handle: any,
  connections: any[],
  allNodes: any[],
  showJsonHandles: boolean,
  isVibeModeActive: boolean
): boolean {
  // EARLY RETURN: Not a JSON handle
  if (handle.dataType !== 'j') {
    return true;
  }

  // CHECK FOR EXISTING CONNECTION
  const hasJsonConnection = connections.some(c => c.targetHandle === handle.id);

  // EARLY RETURN: Already connected (always visible)
  if (hasJsonConnection) {
    return true;
  }

  // CHECK FOR JSON SOURCES
  const hasJsonSources = allNodes.some(node => 
    node.type === 'testJson' || 
    node.type === 'testError' ||
    (node.data && (node.data.json !== undefined || node.data.parsedJson !== undefined))
  );

  // VISIBILITY PRIORITY ORDER:
  // 1. Explicit show JSON handles setting
  // 2. Vibe Mode active (legacy support)
  // 3. Smart auto-show when JSON sources exist
  return showJsonHandles || isVibeModeActive || hasJsonSources;
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

  console.log(`🎨 [NodeRendering] ${nodeType} ${nodeId}: Error injection active:`, {
    hasVibeError: errorState.hasVibeError,
    errorType: errorState.finalErrorType,
    errorMessage: errorState.finalErrorForStyling,
    supportsErrorInjection: errorState.supportsErrorInjection
  });
} 