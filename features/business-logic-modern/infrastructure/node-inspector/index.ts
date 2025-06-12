/**
 * NODE INSPECTOR MODULE
 *
 * This module exports the main NodeInspector component and its related
 * sub-components, hooks, types, and utilities. It provides a comprehensive
 * interface for inspecting and editing nodes and edges within the flow canvas.
 *
 * Keywords: node-inspector, exports, components, hooks, types
 */

// ============================================================================
// MAIN INSPECTOR COMPONENT
// ============================================================================

export { default as NodeInspector } from "./NodeInspector";

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

export { EdgeInspector } from "./components/EdgeInspector";
export { ErrorLog } from "./components/ErrorLog";
export { NodeControls } from "./components/NodeControls";
export { NodeHeader } from "./components/NodeHeader";
export { NodeOutput } from "./components/NodeOutput";

// ============================================================================
// HOOKS
// ============================================================================

export { useInspectorState } from "./hooks/useInspectorState";

// ============================================================================
// UTILITIES
// ============================================================================

export { JsonHighlighter } from "./utils/JsonHighlighter";

// ============================================================================
// TYPES AND CONSTANTS
// ============================================================================

export type {
  BaseControlProps,
  EditingRefs,
  ErrorType,
  InspectorState,
  JsonHighlighterProps,
  NodeControlsProps,
  NodeError,
  NodeInspectorProps,
  NodeType,
} from "./types";

export {
  DEFAULT_DURATIONS,
  DEFAULT_VALUES,
  ERROR_CATEGORIES,
  ERROR_SEVERITY,
  ERROR_TYPES,
  VALIDATION,
  VALIDATION_RULES,
} from "./constants";

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export { default } from "./NodeInspector";
