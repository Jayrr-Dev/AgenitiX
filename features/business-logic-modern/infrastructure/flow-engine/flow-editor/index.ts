/**
 * FLOW EDITOR MODULE - Core exports for the flow editor functionality
 *
 * • Exports main FlowEditor component and supporting components
 * • Provides type definitions and constants for flow editor
 * • Exposes custom hooks for state management and interactions
 * • Includes utility functions for node and connection handling
 *
 * Keywords: flow editor, components, hooks, types, constants, utils,
 * state management, drag-drop, keyboard shortcuts, canvas
 */

// Main component
export { default as FlowEditor } from "./FlowEditor";

// Types
export * from "./types";

// Constants
export * from "./constants";

// Hooks
export { useFlowEditorState } from "./hooks/useFlowEditorState";
export { useReactFlowHandlers } from "./hooks/useReactFlowHandlers";
export { useDragAndDrop } from "./hooks/useDragAndDrop";
export { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";

// Utils
export * from "../../../_temp/nodeFactory";
export * from "./utils/outputUtils";
export * from "./utils/connectionUtils";

// Components
export { FlowCanvas } from "./components/FlowCanvas";
