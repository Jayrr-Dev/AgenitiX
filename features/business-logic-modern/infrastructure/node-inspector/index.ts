/**
 * NODE INSPECTOR MODULE - Clean exports for NodeSpec-aligned system
 *
 * This module exports the main NodeInspector component and its related
 * sub-components, hooks, types, and utilities. Provides a comprehensive
 * interface for inspecting and editing nodes and edges within the flow canvas.
 * Aligned with modern Plop-based NodeSpec architecture.
 *
 * Keywords: node-inspector, exports, nodespec-aligned, modern-architecture
 */

// ============================================================================
// MAIN INSPECTOR COMPONENT
// ============================================================================

export { default as NodeInspector } from "./NodeInspector";

// ============================================================================
// CORE COMPONENTS
// ============================================================================

export { DynamicControls } from "./components/DynamicControls";
export { EdgeInspector } from "./components/EdgeInspector";
export { ErrorLog } from "./components/ErrorLog";
export { NodeControls } from "./components/NodeControls";
export { NodeHeader } from "./components/NodeHeader";
export { NodeOutput } from "./components/NodeOutput";

// ============================================================================
// CORE HOOKS
// ============================================================================

export { useInspectorState } from "./hooks/useInspectorState";

// ============================================================================
// SERVICES & ADAPTERS
// ============================================================================

export { NodeInspectorAdapter } from "./adapters/NodeInspectorAdapter";
export { NodeInspectorService } from "./services/NodeInspectorService";

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
