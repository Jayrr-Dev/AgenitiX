/**
 * WORKFLOW MANAGER TYPES - TypeScript type definitions
 *
 * • Centralized type definitions for workflow manager components
 * • Provides strong typing for better development experience
 * • Ensures type safety across workflow-related functionality
 * • Supports proper IntelliSense and auto-completion
 *
 * Keywords: typescript-types, type-safety, workflow-types, interface-definitions
 */

import type React from "react";

// Core workflow manager component props
export interface WorkflowManagerProps {
	className?: string;
}

// Action button component props with enhanced functionality
export interface ActionButtonProps {
	icon: React.ComponentType<{ className?: string }>;
	title: string;
	onClick: () => void;
	className?: string;
	disabled?: boolean;
	shortcut?: string;
	'aria-label'?: string;
}

// Workflow statistics for display and logic
export interface WorkflowStats {
	nodeCount: number;
	edgeCount: number;
	isWorkflowEmpty: boolean;
}

// Flow badge properties for visibility indicators
export interface FlowBadgeProps {
	variant: 'secondary' | 'default';
	className: string;
	icon: React.ComponentType<{ className?: string }>;
	label: string;
}

// Permission levels for user access control
export type PermissionLevel = 'view' | 'edit' | 'admin' | null;

// Auto-save status information
export interface AutoSaveStatus {
	isEnabled: boolean;
	isSaving: boolean;
	lastSaved: Date | null;
	lastError: string | null;
}

// Flow metadata structure
export interface FlowMetadata {
	id: string;
	name: string;
	description?: string;
	is_private: boolean;
	canEdit: boolean;
	isOwner: boolean;
	userPermission: PermissionLevel;
}

// Workflow execution status
export type WorkflowExecutionStatus = 
	| 'idle'
	| 'running' 
	| 'paused'
	| 'completed'
	| 'failed'
	| 'cancelled';

// Error boundary fallback props
export interface WorkflowErrorFallbackProps {
	error: Error;
	resetError: () => void;
}

// Keyboard shortcut configuration
export interface KeyboardShortcutConfig {
	key: string;
	modifiers?: ('ctrl' | 'meta' | 'shift' | 'alt')[];
	description: string;
	action: () => void;
}