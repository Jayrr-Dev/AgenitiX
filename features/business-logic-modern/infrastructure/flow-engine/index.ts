/**
 * FLOW ENGINE INDEX - Centralized export hub for flow engine functionality
 *
 * • Single source of truth for all flow engine exports
 * • Organized exports by category (components, hooks, types, utilities)
 * • Eliminates import redundancy and naming conflicts
 * • Provides clean, discoverable API surface for consumers
 * • Follows modular export patterns with clear naming
 *
 * Keywords: exports, flow-engine, centralized, API, modular, clean-imports
 */

// ============================================================================
// MAIN COMPONENT EXPORTS
// ============================================================================

export { FlowCanvas } from "./components/FlowCanvas";
export { FlowEditorLoading } from "./components/FlowEditorLoading";

// Default export for FlowEditor
export { default as FlowEditor } from "./FlowEditor";

// ============================================================================
// HOOK EXPORTS
// ============================================================================

export { useFlowEditorHandlers } from "./hooks/useFlowEditorHandlers";
export { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
export { useMultiSelectionCopyPaste } from "./hooks/useMultiSelectionCopyPaste";

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type { AgenEdge, AgenNode } from "./types/nodeData";

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

export { getNodeOutput } from "./utils/outputUtils";

// ============================================================================
// CONSTANT EXPORTS
// ============================================================================

export { NODE_TYPE_CONFIG, getNodeTypeConfig, KEYBOARD_SHORTCUTS } from "./constants";
