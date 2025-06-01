/**
 * USE NODE STYLING HOOK - Advanced styling system for factory nodes
 *
 * • Provides dynamic styling and theming for factory-created nodes
 * • Implements responsive design and adaptive visual states
 * • Supports custom CSS variables and GPU-accelerated animations
 * • Features real-time style computation and optimization
 * • Integrates with safety layers for instant visual updates
 *
 * Keywords: node-styling, theming, responsive-design, gpu-animations, style-optimization, visual-updates
 */

import { useMemo } from "react";
import {
  useNodeButtonTheme,
  useNodeCategoryBaseClasses,
  useNodeCategoryButtonTheme,
  useNodeCategoryTextTheme,
  useNodeStyleClasses,
  useNodeTextTheme,
} from "../../../theming/stores/nodeStyleStore";
import { ERROR_INJECTION_SUPPORTED_NODES } from "../constants";

// TYPES
interface ErrorState {
  supportsErrorInjection: boolean;
  hasVibeError: boolean;
  finalErrorForStyling: string | null;
  finalErrorType: string;
}

interface ThemeObject {
  primary: string;
  secondary: string;
  border: string;
  focus: string;
}

interface NodeStyling {
  nodeStyleClasses: string;
  buttonTheme: string | ThemeObject;
  textTheme: string | ThemeObject;
  categoryBaseClasses: any;
  categoryButtonTheme: string | ThemeObject;
  categoryTextTheme: string | ThemeObject;
  errorState: ErrorState;
}

/**
 * USE NODE STYLING
 * Consolidated styling and theming logic
 * Enhanced with proper TypeScript support and error injection
 *
 * @param nodeType - Node type identifier
 * @param selected - Whether node is selected
 * @param error - Current error state
 * @param isActive - Whether node is active
 * @param nodeData - Node data for error injection checking
 * @returns Complete styling object
 */
export function useNodeStyling(
  nodeType: string,
  selected: boolean,
  error: string | null,
  isActive: boolean,
  nodeData?: any // Add nodeData parameter for error injection
): NodeStyling {
  // ERROR STATE CALCULATION WITH VIBE MODE SUPPORT
  const errorState: ErrorState = useMemo(() => {
    const supportsErrorInjection = ERROR_INJECTION_SUPPORTED_NODES.includes(
      nodeType as any
    );

    // Check for Vibe Mode error injection
    const hasVibeError =
      supportsErrorInjection && nodeData?.isErrorState === true;
    const vibeErrorType = nodeData?.errorType || "error";

    // Priority: local error > vibe error > no error
    const finalErrorForStyling =
      error || (hasVibeError ? nodeData?.error || "Error state active" : null);
    const finalErrorType = error ? "local" : vibeErrorType;

    return {
      supportsErrorInjection,
      hasVibeError,
      finalErrorForStyling,
      finalErrorType,
    };
  }, [
    nodeType,
    error,
    nodeData?.isErrorState,
    nodeData?.errorType,
    nodeData?.error,
  ]);

  // BASE STYLING HOOKS
  const nodeStyleClasses = useNodeStyleClasses(
    !!selected,
    !!errorState.finalErrorForStyling,
    isActive
  );

  const buttonTheme = useNodeButtonTheme(
    !!errorState.finalErrorForStyling,
    isActive
  );

  const textTheme = useNodeTextTheme(!!errorState.finalErrorForStyling);

  // CATEGORY-SPECIFIC STYLING HOOKS
  const categoryBaseClasses = useNodeCategoryBaseClasses(nodeType);

  const categoryButtonTheme = useNodeCategoryButtonTheme(
    nodeType,
    !!errorState.finalErrorForStyling,
    isActive
  );

  const categoryTextTheme = useNodeCategoryTextTheme(
    nodeType,
    !!errorState.finalErrorForStyling
  );

  return {
    nodeStyleClasses,
    buttonTheme,
    textTheme,
    categoryBaseClasses,
    categoryButtonTheme,
    categoryTextTheme,
    errorState,
  };
}
