/**
 * NODE OUTPUT COMPONENT - Node execution output display and formatting
 *
 * • Displays computed output results from node execution with registry-enhanced formatting
 * • Provides syntax highlighting for different data types and formats
 * • Shows formatted JSON, text, and structured data with proper indentation
 * • Includes copy-to-clipboard functionality for output values
 * • Renders loading states and error indicators for output computation
 * • Enhanced with modern registry integration for rich metadata and styling
 *
 * Keywords: node-output, syntax-highlighting, formatting, clipboard, results, display, registry-integration
 */

"use client";

import type React from "react";
import { useCallback, useMemo } from "react";

// MODERN REGISTRY INTEGRATION - Import proper types and registry
import type { NodeType } from "../../flow-engine/types/nodeData";
import { getNodeMetadata } from "../../node-registry/nodespec-registry";
import type { NodeMetadata } from "../../node-registry/types";
import { useComponentTheme } from "../../theming/components";

// ============================================================================
// COMPONENT INTERFACE
// ============================================================================

interface NodeOutputProps {
	output: string | null;
	nodeType: NodeType;
}

// ============================================================================
// OUTPUT FORMATTING TYPES
// ============================================================================

interface FormattedOutput {
	text: string;
	color: string;
	type: string;
	icon?: string;
	fullText?: string;
	metadata?: {
		nodeDisplayName?: string;
		nodeIcon?: string;
		nodeCategory?: string;
	};
}

// ============================================================================
// ENHANCED METADATA HELPERS
// ============================================================================

/**
 * GET OUTPUT FORMATTING PREFERENCES
 * Retrieves output formatting preferences from registry metadata
 */
function getOutputFormattingPreferences(nodeType: string): {
	hasCustomFormatting: boolean;
	customColor?: string;
	customIcon?: string;
	displayName?: string;
	category?: string;
	metadata: NodeMetadata | null;
} {
	const metadata = getNodeMetadata(nodeType as NodeType);
	if (!metadata) {
		return {
			hasCustomFormatting: false,
			metadata: null,
		};
	}

	return {
		hasCustomFormatting: true,
		customIcon: metadata.icon,
		displayName: metadata.displayName,
		category: metadata.category,
		metadata,
	};
}

/**
 * GET NODE-SPECIFIC OUTPUT STYLING
 * Returns node-specific styling based on registry metadata using component theme
 */
function getNodeSpecificStyling(
	nodeType: NodeType,
	preferences: ReturnType<typeof getOutputFormattingPreferences>,
	theme: any
): Partial<FormattedOutput> {
	// Registry-enhanced styling using component theme
	if (preferences.hasCustomFormatting && preferences.metadata) {
		const metadata = preferences.metadata;

		// Category-based styling with proper theme colors
		switch (metadata.category) {
			case "create":
				return {
					color: theme.text.primary,
					icon: metadata.icon || "CREATE",
				};
			case "view":
				return {
					color: theme.text.secondary,
					icon: metadata.icon || "VIEW",
				};
			case "trigger":
				return {
					color: theme.text.primary,
					icon: metadata.icon || "TRIGGER",
				};
			case "test":
				return {
					color: theme.text.primary,
					icon: metadata.icon || "TEST",
				};
			case "cycle":
				return {
					color: theme.text.secondary,
					icon: metadata.icon || "CYCLE",
				};
			case "store":
				return {
					color: theme.text.primary,
					icon: metadata.icon || "STORE",
				};










			case "ai":
				return {
					color: theme.text.primary,
					icon: metadata.icon || "AI",
				};
			case "time":
				return {
					color: theme.text.primary,
					icon: metadata.icon || "TIME",
				};
			case "flow":
				return {
					color: theme.text.primary,
					icon: metadata.icon || "FLOW",
				};
			case "email":
				return {
					color: theme.text.primary,
					icon: metadata.icon || "EMAIL",
				};
			default:
				return {
					color: theme.text.muted,
					icon: metadata.icon || "NODE",
				};
		}
	}

	// Fallback to node type specific styling using theme
	return {
		color: theme.text.muted,
		icon: "NODE",
	};
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const NodeOutput: React.FC<NodeOutputProps> = ({ output, nodeType }) => {
	// Get component theme
	const theme = useComponentTheme("nodeInspector");

	// REGISTRY METADATA - Get formatting preferences
	const outputPreferences = useMemo(() => {
		return getOutputFormattingPreferences(nodeType);
	}, [nodeType]);

	// COPY TO CLIPBOARD FUNCTIONALITY
	const copyToClipboard = useCallback(async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
			// You could add a toast notification here
			console.log("Copied to clipboard:", text);
		} catch (error) {
			console.error("Failed to copy to clipboard:", error);
		}
	}, []);

	// ENHANCED OUTPUT FORMATTING - Registry-aware with theme
	const formatOutput = useMemo((): FormattedOutput => {
		if (output === null || output === undefined) {
			return {
				text: "—",
				color: `${theme.text.muted} italic`,
				type: "null",
				icon: "NULL",
				metadata: {
					nodeDisplayName: outputPreferences.displayName,
					nodeIcon: outputPreferences.customIcon,
					nodeCategory: outputPreferences.category,
				},
			};
		}

		// Try to parse and detect data type
		let parsedValue: any = output;
		let detectedType = "string";

		try {
			parsedValue = JSON.parse(output);
			detectedType = Array.isArray(parsedValue) ? "array" : typeof parsedValue;
		} catch {
			// Keep as string if not valid JSON
			detectedType = "string";
		}

		// Get node-specific styling
		const nodeSpecificStyling = getNodeSpecificStyling(nodeType, outputPreferences, theme);

		// Special handling for objects with text property (common in text nodes)
		if (
			detectedType === "object" &&
			parsedValue &&
			typeof parsedValue === "object" &&
			parsedValue.text !== undefined
		) {
			return {
				text: String(parsedValue.text),
				color: nodeSpecificStyling.color || theme.text.primary,
				type: "string",
				icon: nodeSpecificStyling.icon || "STR",
				fullText: String(parsedValue.text),
				metadata: {
					nodeDisplayName: outputPreferences.displayName,
					nodeIcon: outputPreferences.customIcon,
					nodeCategory: outputPreferences.category,
				},
			};
		}

		// Format based on detected type
		switch (detectedType) {
			case "object":
				return {
					text: JSON.stringify(parsedValue, null, 2),
					color: nodeSpecificStyling.color || theme.text.primary,
					type: "object",
					icon: nodeSpecificStyling.icon || "OBJ",
					fullText: JSON.stringify(parsedValue, null, 2),
					metadata: {
						nodeDisplayName: outputPreferences.displayName,
						nodeIcon: outputPreferences.customIcon,
						nodeCategory: outputPreferences.category,
					},
				};
			case "array":
				return {
					text: JSON.stringify(parsedValue, null, 2),
					color: nodeSpecificStyling.color || theme.text.primary,
					type: "array",
					icon: nodeSpecificStyling.icon || "ARR",
					fullText: JSON.stringify(parsedValue, null, 2),
					metadata: {
						nodeDisplayName: outputPreferences.displayName,
						nodeIcon: outputPreferences.customIcon,
						nodeCategory: outputPreferences.category,
					},
				};
			case "number":
				return {
					text: String(parsedValue),
					color: nodeSpecificStyling.color || theme.text.primary,
					type: "number",
					icon: nodeSpecificStyling.icon || "NUM",
					fullText: String(parsedValue),
					metadata: {
						nodeDisplayName: outputPreferences.displayName,
						nodeIcon: outputPreferences.customIcon,
						nodeCategory: outputPreferences.category,
					},
				};
			case "boolean":
				return {
					text: String(parsedValue),
					color: nodeSpecificStyling.color || theme.text.primary,
					type: "boolean",
					icon: nodeSpecificStyling.icon || (parsedValue ? "TRUE" : "FALSE"),
					fullText: String(parsedValue),
					metadata: {
						nodeDisplayName: outputPreferences.displayName,
						nodeIcon: outputPreferences.customIcon,
						nodeCategory: outputPreferences.category,
					},
				};
			default:
				return {
					text: String(output),
					color: nodeSpecificStyling.color || theme.text.primary,
					type: "string",
					icon: nodeSpecificStyling.icon || "STR",
					fullText: String(output),
					metadata: {
						nodeDisplayName: outputPreferences.displayName,
						nodeIcon: outputPreferences.customIcon,
						nodeCategory: outputPreferences.category,
					},
				};
		}
	}, [output, nodeType, outputPreferences, theme]);

	return (
		<div className="flex flex-col h-full min-h-0">
			{/* Output Header with Metadata */}
			<div className="flex items-center justify-between mb-3">
				<div className="flex items-center gap-3">
					<span className="text-sm font-semibold text-foreground uppercase tracking-wide">
						{formatOutput.type}
					</span>
					{formatOutput.metadata?.nodeDisplayName && (
						<span className="text-xs text-muted-foreground font-medium">
							from {formatOutput.metadata.nodeDisplayName}
						</span>
					)}
				</div>
				{formatOutput.fullText && (
					<button
						onClick={() => copyToClipboard(formatOutput.fullText!)}
						className="px-3 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground bg-muted/30 hover:bg-muted/50 rounded transition-all duration-200 uppercase tracking-wide"
						title="Copy to clipboard"
					>
						COPY
					</button>
				)}
			</div>

			{/* Output Content */}
			<div className="flex-1 overflow-auto">
				<pre className="text-sm font-mono leading-relaxed whitespace-pre-wrap break-words text-foreground p-3 bg-muted/20 rounded border">
					{formatOutput.text}
				</pre>
			</div>
		</div>
	);
};
