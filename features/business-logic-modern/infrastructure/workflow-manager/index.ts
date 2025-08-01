/**
 * WORKFLOW MANAGER MODULE - Exports for workflow management components
 *
 * • Centralized exports for workflow management functionality
 * • Provides clean imports for workflow-related components
 * • Maintains separation of concerns for workflow operations
 * • Includes error boundaries and loading states for better UX
 * • Exports hooks for reusable workflow functionality
 *
 * Keywords: workflow-management, module-exports, component-organization, error-handling
 */

// Main components
export { default as WorkflowManager } from "./WorkflowManager";
export { WorkflowErrorBoundary } from "./components/WorkflowErrorBoundary";
export { WorkflowManagerSkeleton } from "./components/WorkflowManagerSkeleton";

// Hooks
export { useWorkflowActions } from "./hooks/useWorkflowActions";
export { useWorkflowKeyboardShortcuts } from "./hooks/useWorkflowKeyboardShortcuts";

// Types
export type {
	WorkflowManagerProps,
	ActionButtonProps,
	WorkflowStats,
	FlowBadgeProps,
	PermissionLevel,
} from "./types";

// Re-export common workflow-related types
export type {
	UseWorkflowActionsOptions,
	WorkflowActions,
} from "./hooks/useWorkflowActions";

export type {
	WorkflowKeyboardShortcuts,
	UseWorkflowKeyboardShortcutsOptions,
} from "./hooks/useWorkflowKeyboardShortcuts";
