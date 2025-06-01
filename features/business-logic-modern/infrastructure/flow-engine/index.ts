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

export { useDragAndDrop } from "./hooks/useDragAndDrop";
export { useErrorLogging } from "./hooks/useErrorLogging";
export { useFlowEditorHandlers } from "./hooks/useFlowEditorHandlers";
export { useFlowEditorState } from "./hooks/useFlowEditorState";
export { useKeyboardShortcutHandlers } from "./hooks/useKeyboardShortcutHandlers";
export { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
export { useMultiSelectionCopyPaste } from "./hooks/useMultiSelectionCopyPaste";
export { useReactFlowHandlers } from "./hooks/useReactFlowHandlers";

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type { AgenEdge, AgenNode } from "./types";

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

export { getNodeOutput } from "./utils/outputUtils";

// ============================================================================
// CONSTANT EXPORTS
// ============================================================================

export { syncNodeTypeConfigWithRegistry } from "./constants";
