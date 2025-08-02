/**
 * BASE CONTROL COMPONENTS - Enhanced node inspector controls with semantic tokens
 *
 * • Provides foundational control components for node inspector
 * • Uses semantic tokens for consistent theming across node categories
 * • Supports registry-enhanced styling with node type awareness
 * • Maintains backward compatibility with existing control patterns
 * • Clean, maintainable component architecture
 *
 * Keywords: base-controls, semantic-tokens, node-inspector, registry-enhanced
 */

import type React from "react";
import { useMemo } from "react";
import { Textarea } from "@/components/ui/textarea";
import type { NodeType } from "../../flow-engine/types/nodeData";
import { getNodeMetadata } from "../../node-registry/nodespec-registry";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface ControlWrapperProps {
	children: React.ReactNode;
	title?: string;
	className?: string;
	nodeType?: string; // Optional for registry-enhanced styling
}

interface StatusBadgeProps {
	status: boolean;
	trueLabel?: string;
	falseLabel?: string;
	trueColor?: string;
	falseColor?: string;
	nodeType?: string; // Optional for registry-enhanced styling
}

interface ActionButtonProps {
	onClick: () => void;
	children: React.ReactNode;
	variant?: "primary" | "secondary" | "danger";
	disabled?: boolean;
	className?: string;
	nodeType?: string; // Optional for registry-enhanced styling
}

// ============================================================================
// SEMANTIC TOKEN MAPPING
// ============================================================================

/**
 * Maps node types to semantic token classes
 * Provides consistent theming across node categories
 */
function getSemanticClasses(nodeType?: string) {
	const baseType = nodeType?.toLowerCase();

	switch (baseType) {
		case "create":
		case "createnode":
			return {
				primary: "bg-node-create text-node-create-text",
				primaryHover: "hover:bg-node-create-hover",
				border: "border-node-create",
				borderHover: "hover:border-node-create-hover",
				text: "text-node-create-text",
				textSecondary: "text-node-create-text-secondary",
			};
		case "view":
		case "viewnode":
			return {
				primary: "bg-node-view text-node-view-text",
				primaryHover: "hover:bg-node-view-hover",
				border: "border-node-view",
				borderHover: "hover:border-node-view-hover",
				text: "text-node-view-text",
				textSecondary: "text-node-view-text-secondary",
			};
		case "trigger":
		case "triggernode":
			return {
				primary: "bg-node-trigger text-node-trigger-text",
				primaryHover: "hover:bg-node-trigger-hover",
				border: "border-node-trigger",
				borderHover: "hover:border-node-trigger-hover",
				text: "text-node-trigger-text",
				textSecondary: "text-node-trigger-text-secondary",
			};
		case "test":
		case "testnode":
			return {
				primary: "bg-node-test text-node-test-text",
				primaryHover: "hover:bg-node-test-hover",
				border: "border-node-test",
				borderHover: "hover:border-node-test-hover",
				text: "text-node-test-text",
				textSecondary: "text-node-test-text-secondary",
			};
		case "store":
		case "storenode":
			return {
				primary: "bg-node-store text-node-store-text",
				primaryHover: "hover:bg-node-store-hover",
				border: "border-node-store",
				borderHover: "hover:border-node-store-hover",
				text: "text-node-store-text",
				textSecondary: "text-node-store-text-secondary",
			};

		case "ai":
		case "ainode":
			return {
				primary: "bg-node-ai text-node-ai-text",
				primaryHover: "hover:bg-node-ai-hover",
				border: "border-node-ai",
				borderHover: "hover:border-node-ai-hover",
				text: "text-node-ai-text",
				textSecondary: "text-node-ai-text-secondary",
			};
		case "time":
		case "timenode":
			return {
				primary: "bg-node-time text-node-time-text",
				primaryHover: "hover:bg-node-time-hover",
				border: "border-node-time",
				borderHover: "hover:border-node-time-hover",
				text: "text-node-time-text",
				textSecondary: "text-node-time-text-secondary",
			};
		case "flow":
		case "flownode":
			return {
				primary: "bg-node-flow text-node-flow-text",
				primaryHover: "hover:bg-node-flow-hover",
				border: "border-node-flow",
				borderHover: "hover:border-node-flow-hover",
				text: "text-node-flow-text",
				textSecondary: "text-node-flow-text-secondary",
			};
		case "email":
		case "emailnode":
			return {
				primary: "bg-node-email text-node-email-text",
				primaryHover: "hover:bg-node-email-hover",
				border: "border-node-email",
				borderHover: "hover:border-node-email-hover",
				text: "text-node-email-text",
				textSecondary: "text-node-email-text-secondary",
			};
		default:
			// Default to view node styling for unknown types
			return {
				primary: "bg-node-view text-node-view-text",
				primaryHover: "hover:bg-node-view-hover",
				border: "border-node-view",
				borderHover: "hover:border-node-view-hover",
				text: "text-node-view-text",
				textSecondary: "text-node-view-text-secondary",
			};
	}
}

// ============================================================================
// BASE COMPONENTS
// ============================================================================

/**
 * BASE CONTROL WRAPPER
 * Provides consistent styling and spacing for control groups
 */
export const BaseControl: React.FC<ControlWrapperProps> = ({
	children,
	title,
	className = "",
	nodeType,
}) => {
	const semanticClasses = useMemo(() => getSemanticClasses(nodeType), [nodeType]);

	return (
		<div className={`space-y-2 ${className}`}>
			{title && (
				<div className={`font-semibold text-xs ${semanticClasses.text} uppercase tracking-wide`}>
					{title}
				</div>
			)}
			<div className="space-y-2 border-control-group border-l-2 pl-2">{children}</div>
		</div>
	);
};

/**
 * STATUS BADGE
 * Shows boolean status with semantic styling
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
	status,
	trueLabel = "TRUE",
	falseLabel = "FALSE",
	nodeType,
}) => {
	const _semanticClasses = useMemo(() => getSemanticClasses(nodeType), [nodeType]);

	// Use semantic tokens for status colors
	const statusClasses = status
		? "bg-control-success text-control-success border-control-success"
		: "bg-control-error text-control-error border-control-error";

	return (
		<span className={`rounded border px-2 py-1 font-medium text-xs ${statusClasses}`}>
			{status ? trueLabel : falseLabel}
		</span>
	);
};

/**
 * ACTION BUTTON
 * Themed button with semantic token styling
 */
export const ActionButton: React.FC<ActionButtonProps> = ({
	onClick,
	children,
	variant = "primary",
	disabled = false,
	className = "",
	nodeType,
}) => {
	const semanticClasses = useMemo(() => getSemanticClasses(nodeType), [nodeType]);
	const baseClasses = "text-xs px-3 py-1.5 rounded transition-colors font-medium";

	// Use semantic tokens for variant styling
	const variantClasses = useMemo(() => {
		switch (variant) {
			case "primary":
				return `${semanticClasses.primary} ${semanticClasses.primaryHover} ${semanticClasses.border}`;
			case "secondary":
				return "bg-control-debug text-control-debug border-control-input hover:bg-control-input-dark";
			case "danger":
				return "bg-control-error text-control-error border-control-error hover:bg-control-warning";
			default:
				return `${semanticClasses.primary} ${semanticClasses.primaryHover} ${semanticClasses.border}`;
		}
	}, [variant, semanticClasses]);

	const handleClick = (e: React.MouseEvent) => {
		e.stopPropagation(); // Prevent event bubbling
		if (!disabled) {
			onClick();
		}
	};

	return (
		<button
			type="button"
			onClick={handleClick}
			disabled={disabled}
			className={`${baseClasses} ${variantClasses} ${
				disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
			} ${className}`}
		>
			{children}
		</button>
	);
};

// ============================================================================
// ENHANCED INPUT COMPONENTS
// ============================================================================

/**
 * REGISTRY-ENHANCED INPUT
 * Base input with semantic token styling
 */
interface EnhancedInputProps {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	disabled?: boolean;
	className?: string;
	nodeType?: string;
	type?: "text" | "number" | "email" | "password";
}

export const EnhancedInput: React.FC<EnhancedInputProps> = ({
	value,
	onChange,
	placeholder,
	disabled = false,
	className = "",
	nodeType,
	type = "text",
}) => {
	const semanticClasses = useMemo(() => getSemanticClasses(nodeType), [nodeType]);

	return (
		<input
			type={type}
			value={value}
			onChange={(e) => onChange(e.target.value)}
			placeholder={placeholder}
			disabled={disabled}
			className={`rounded border bg-control-input px-2 py-1.5 text-control-input text-xs dark:bg-control-input-dark ${semanticClasses.border} placeholder-control-placeholder focus:border-control-input-focus focus:outline-none focus:ring-2 focus:ring-control-input-focus ${disabled ? "cursor-not-allowed opacity-50" : ""}
        ${className}
      `}
		/>
	);
};

/**
 * REGISTRY-ENHANCED TEXTAREA
 * Base textarea with semantic token styling
 */
interface EnhancedTextareaProps {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	disabled?: boolean;
	className?: string;
	nodeType?: string;
	rows?: number;
}

export const EnhancedTextarea: React.FC<EnhancedTextareaProps> = ({
	value,
	onChange,
	placeholder,
	disabled = false,
	className = "",
	nodeType,
	rows = 3,
}) => {
	const semanticClasses = useMemo(() => getSemanticClasses(nodeType), [nodeType]);

	return (
		<Textarea
			value={value}
			onChange={(e) => onChange(e.target.value)}
			placeholder={placeholder}
			disabled={disabled}
			rows={rows}
			className={`resize-none px-2 py-1.5 text-xs ${semanticClasses.border} ${disabled ? "cursor-not-allowed opacity-50" : ""} ${className}`}
		/>
	);
};

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

/**
 * CONTROL GROUP
 * Groups related controls with consistent spacing
 */
interface ControlGroupProps {
	title?: string;
	children: React.ReactNode;
	nodeType?: string;
	className?: string;
}

export const ControlGroup: React.FC<ControlGroupProps> = ({
	title,
	children,
	nodeType,
	className = "",
}) => {
	const semanticClasses = useMemo(() => getSemanticClasses(nodeType), [nodeType]);

	return (
		<div className={`space-y-2 ${className}`}>
			{title && (
				<div
					className={`font-semibold text-xs ${semanticClasses.textSecondary} uppercase tracking-wide`}
				>
					{title}
				</div>
			)}
			<div className="space-y-2 border-control-group border-l-2 pl-2">{children}</div>
		</div>
	);
};

/**
 * REGISTRY DEBUG BADGE
 * Shows registry integration status (development only)
 */
interface RegistryDebugBadgeProps {
	nodeType?: string;
}

export const RegistryDebugBadge: React.FC<RegistryDebugBadgeProps> = ({ nodeType }) => {
	if (process.env.NODE_ENV !== "development" || !nodeType) {
		return null;
	}

	const metadata = getNodeMetadata(nodeType as NodeType);

	return (
		<div className="mt-2 flex items-center gap-1 text-[10px] text-control-debug">
			<span>🔧</span>
			<span>Registry: ✅</span>
			{metadata && <span>• Category: {metadata.category}</span>}
		</div>
	);
};

// Re-export the BaseControlProps type for convenience
export type { BaseControlProps } from "../types";
