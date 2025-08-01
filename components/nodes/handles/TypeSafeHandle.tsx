/**
 * TYPESAFE HANDLE SYSTEM - A comprehensive, type-safe handle for React Flow.
 * Features:
 * • Extensive type system with over 25 supported types.
 * • Full support for union types (e.g., "string|number").
 * • Automatic validation and prevention of incompatible connections.
 * • User-friendly toast notifications for connection errors.
 * • Decoupled and reusable for any React Flow project.
 * • Uses React Icons for perfect centering and consistency.
 */
import { Handle, type HandleProps, type IsValidConnection, useStore } from "@xyflow/react";
import React, { useCallback } from "react";
import { LuBraces, LuBrackets, LuCheck, LuCircle, LuHash, LuWrench, LuType } from "react-icons/lu";
import { VscJson } from "react-icons/vsc";
import { toast } from "sonner";
// Auto-generated at build time (can be empty in dev before first build)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore – file is generated post-install / build

// ============================================================================
// CONFIGURATION CONSTANTS - Easy to maintain and adjust
// ============================================================================

/**
 * Handle visual configuration
 */
const HANDLE_SIZE_PX = 10;
const HANDLE_POSITION_OFFSET = 10; // pixels to move handles further out from nodes
const HANDLE_SPACING = 16; // pixels between multiple handles on the same side

/**
 * Utility to get CSS custom property value from the DOM
 * This allows us to inject Tailwind classes from tokens.json
 */
const getInjectableClasses = (cssVar: string): string => {
	if (typeof window === "undefined") {
		return "";
	}
	const value = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
	return value || "";
};

/**
 * Unified handle styling using semantic tokens
 * - Consistent theming across light/dark modes
 * - Semantic token-based backgrounds and borders
 * - Type-specific colors for visual distinction
 * - Perfect centering for all letters and icons
 */
const UNIFIED_HANDLE_STYLES = {
	// Base styling classes with perfect centering
	base: "flex items-center justify-center rounded-sm text-[6px] font-semibold uppercase select-none z-30 leading-none",

	// Background colors using semantic tokens
	backgrounds: {
		connected: "var(--core-handle-bg-connected)",
		source: "var(--core-handle-bg-source)",
		target: "var(--core-handle-bg-target)",
	},

	// Border and shadow configuration
	border: {
		width: 0,
		shadow: "var(--core-handle-shadow)",
	},
} as const;

/**
 * Toast notification configuration
 */
const TOAST_DEBOUNCE_MS = 2000;
const TOAST_ERROR_TITLE = "Incompatible connection";
const TOAST_ERROR_DESCRIPTION_TEMPLATE = "Cannot connect type '{source}' to '{target}'.";
const TOAST_DURATION = 3000;

/**
 * Type parsing defaults
 */
const DEFAULT_TYPE_FALLBACK = ["x"];
const DEFAULT_HANDLE_TYPE = "any";

/**
 * AJV validation configuration
 */
// const ajv = new Ajv({ allErrors: false, strict: false });

/**
 * Unified type display configuration using React Icons
 * Maps type names to React icon components and semantic token references
 */
const UNIFIED_TYPE_DISPLAY: Record<
	string,
	{ icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; tokenKey: string }
> = {
	string: { icon: LuType, tokenKey: "string" },
	number: { icon: LuHash, tokenKey: "number" },
	boolean: { icon: LuCheck, tokenKey: "boolean" },
	object: { icon: LuBraces, tokenKey: "object" },
	array: { icon: LuBrackets, tokenKey: "array" },
	any: { icon: LuCircle, tokenKey: "any" },
	json: { icon: VscJson, tokenKey: "json" },
	tools: { icon: LuWrench, tokenKey: "tools" },
};

/**
 * Ultimate type map - maps short codes to type information using semantic tokens
 */
const ULTIMATE_TYPE_MAP: Record<string, { tokenKey: string; label: string }> = {
	s: { tokenKey: "string", label: "string" },
	n: { tokenKey: "number", label: "number" },
	b: { tokenKey: "boolean", label: "boolean" },
	j: { tokenKey: "json", label: "json" },
	a: { tokenKey: "array", label: "array" },
	x: { tokenKey: "any", label: "any" },
	V: { tokenKey: "vibe", label: "Vibe" },
	t: { tokenKey: "tools", label: "tools" },
	// Full data type names for direct mapping
	JSON: { tokenKey: "json", label: "json" },
	String: { tokenKey: "string", label: "string" },
	Boolean: { tokenKey: "boolean", label: "boolean" },
	Number: { tokenKey: "number", label: "number" },
	Array: { tokenKey: "array", label: "array" },
	Object: { tokenKey: "object", label: "object" },
	Tools: { tokenKey: "tools", label: "tools" },
};

/**
 * Type descriptions for tooltips - detailed explanations of each data type
 */
const TYPE_DESCRIPTIONS: Record<string, string> = {
	s: "String - Text and string values",
	n: "Number - Integer and numeric values",
	b: "Boolean - True/false values",
	j: "JSON - JavaScript objects and JSON data",
	a: "Array - Lists and array structures",
	x: "Any - Accepts all data types",
	V: "Vibe - Custom Vibe data type",
	t: "Tools - AI agent tool configurations",
	// Full data type names
	String: "String - Text and string values",
	Boolean: "Boolean - True/false values",
	Number: "Number - Integer and numeric values",
	JSON: "JSON - JavaScript objects and JSON data",
	Array: "Array - Lists and array structures",
	Object: "Object - JavaScript objects and data structures",
	Tools: "Tools - AI agent tool configurations",
};

// ============================================================================
// UTILITY FUNCTIONS - Pure functions using top-level constants
// ============================================================================

/**
 * Parse union types from type string
 */
function parseUnionTypes(typeStr?: string | null): string[] {
	if (!typeStr) {
		return DEFAULT_TYPE_FALLBACK;
	}
	return typeStr.split("|").map((t) => t.trim());
}

/**
 * Calculate positioning offset based on handle position and index
 * Supports multiple handles on the same side without overlapping
 */
function getPositionOffset(
	position: string,
	handleIndex = 0,
	totalHandlesOnSide = 1
): Record<string, number | string> {
	const baseOffset = {
		left: { left: -HANDLE_POSITION_OFFSET },
		right: { right: -HANDLE_POSITION_OFFSET },
		top: { top: -HANDLE_POSITION_OFFSET },
		bottom: { bottom: -HANDLE_POSITION_OFFSET },
	};

	const base = baseOffset[position as keyof typeof baseOffset] || {};

	// If only one handle on this side, use base positioning
	if (totalHandlesOnSide <= 1) {
		return base;
	}

	// Calculate spacing for multiple handles - center them properly
	// Calculate the total spacing between the handles, basically the total width of the handles
	const totalSpacing = (totalHandlesOnSide - 1) * HANDLE_SPACING;
	// Calculate the start offset to center the handles basically the middle of the handles
	const startOffset = -totalSpacing / 2 ;
	// Calculate the current offset based on the handle index and spacing, basically the position of the handle relative to the start offset
	const currentOffset = startOffset + handleIndex * HANDLE_SPACING;

	// Add perpendicular offset for multiple handles
	// Use transform to center handles properly relative to their own size
	switch (position) {
		case "left": 
			
		case "right":
			return {
				...base,
				top: `calc(50% + ${currentOffset}px)`,
	
				
			};
		case "top":
		case "bottom":
			return {
				...base,
				left: `calc(50% + ${currentOffset}px)`,
				
			};
		default:
			return base;
	}
}

/**
 * Get handle background color based on connection state using semantic tokens
 */
function getHandleBackgroundColor(isConnected: boolean, isSource: boolean): string {
	if (isConnected) {
		return UNIFIED_HANDLE_STYLES.backgrounds.connected;
	}
	return isSource
		? UNIFIED_HANDLE_STYLES.backgrounds.source
		: UNIFIED_HANDLE_STYLES.backgrounds.target;
}

/**
 * Get type-specific color using semantic tokens
 */
function getTypeColor(tokenKey: string): string {
	return `var(--core-handle-types-${tokenKey}-color)`;
}

/**
 * Get unified type display information (icon and color)
 */
function getTypeDisplay(handleTypeName: string): {
	icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
	color: string;
} {
	const display = UNIFIED_TYPE_DISPLAY[handleTypeName.toLowerCase()] || UNIFIED_TYPE_DISPLAY.any;
	return {
		icon: display.icon,
		color: getTypeColor(display.tokenKey),
	};
}

/**
 * Get handle type name for display
 */
function getHandleTypeName(tsSymbol?: string, dataType?: string, code?: string): string {
	if (tsSymbol) {
		return tsSymbol.split(".").pop() || DEFAULT_HANDLE_TYPE;
	}
	const typeCode = parseUnionTypes(dataType || code)[0];
	return ULTIMATE_TYPE_MAP[typeCode]?.label || DEFAULT_HANDLE_TYPE;
}

/**
 * Generate tooltip content for handle
 */
function getTooltipContent(
	handleType: "source" | "target",
	dataType?: string,
	code?: string,
	tsSymbol?: string
): string {
	const direction = handleType === "target" ? "Input" : "Output";

	// Handle TypeScript symbols
	if (tsSymbol) {
		const symbolName = tsSymbol.split(".").pop() || "Unknown";
		return `${direction}: ${symbolName} (TypeScript type)`;
	}

	// Get the primary type code
	const typeCode = parseUnionTypes(dataType || code)[0];

	// Check if it's a full data type name (like "String", "Boolean", etc.)
	const fullTypeMapping = ULTIMATE_TYPE_MAP[typeCode];
	if (fullTypeMapping) {
		return `${direction}: ${fullTypeMapping.label} - ${TYPE_DESCRIPTIONS[typeCode] || TYPE_DESCRIPTIONS[fullTypeMapping.tokenKey] || "Data type"}`;
	}

	const typeDescription = TYPE_DESCRIPTIONS[typeCode];

	if (!typeDescription) {
		return `${direction}: Unknown type (${typeCode || "undefined"})`;
	}

	// Handle union types (multiple types separated by |)
	const allTypes = parseUnionTypes(dataType || code);
	if (allTypes.length > 1) {
		const descriptions = allTypes
			.map((type) => {
				const fullMapping = ULTIMATE_TYPE_MAP[type];
				return fullMapping ? fullMapping.label : TYPE_DESCRIPTIONS[type];
			})
			.filter(Boolean);

		if (descriptions.length > 1) {
			return `${direction}: ${descriptions.join(" OR ")}`;
		}
	}

	return `${direction}: ${typeDescription}`;
}

function isTypeCompatible(sourceType: string, targetType: string): boolean {
	if (sourceType === "x" || targetType === "x") {
		return true;
	}
	const sourceTypes = parseUnionTypes(sourceType);
	const targetTypes = parseUnionTypes(targetType);
	return sourceTypes.some((s) => targetTypes.includes(s));
}

// Simple debounce map to avoid toast spam
const toastThrottle: Record<string, number> = {};

export const useUltimateFlowConnectionPrevention = () => {
	const isValidConnection: IsValidConnection = useCallback((connection) => {
		const { sourceHandle, targetHandle } = connection;

		// Extract types from handle IDs (e.g., "handle-id__string|number")
		const sourceDataType = sourceHandle?.split("__")[1];
		const targetDataType = targetHandle?.split("__")[1];

		if (!(sourceDataType && targetDataType)) {
			// If types aren't encoded in the handle, default to allowing the connection.
			// This maintains compatibility with older/un-migrated nodes.
			return true;
		}

		const compatible = isTypeCompatible(sourceDataType, targetDataType);

		if (!compatible) {
			const key = `${sourceDataType}->${targetDataType}`;
			const now = Date.now();
			if (!toastThrottle[key] || now - toastThrottle[key] > TOAST_DEBOUNCE_MS) {
				toast.error(TOAST_ERROR_TITLE, {
					description: TOAST_ERROR_DESCRIPTION_TEMPLATE.replace("{source}", sourceDataType).replace(
						"{target}",
						targetDataType
					),
					duration: TOAST_DURATION,
				});
				toastThrottle[key] = now;
			}
		}
		return compatible;
	}, []);
	return { isValidConnection };
};

interface UltimateTypesafeHandleProps {
	dataType: string;
	position: "left" | "right" | "top" | "bottom";
	style?: React.CSSProperties;
	className?: string;
	tsSymbol?: string;
	code?: string;
	nodeId?: string;
	handleIndex?: number;
	totalHandlesOnSide?: number;
	type?: "source" | "target";
	id?: string;
}

const UltimateTypesafeHandle: React.FC<UltimateTypesafeHandleProps> = ({
	// eslint-disable-line @typescript-eslint/no-explicit-any
	dataType,
	tsSymbol,
	code,
	nodeId,
	handleIndex = 0,
	totalHandlesOnSide = 1,
	...props
}) => {
	// Get handle type name using utility function
	const handleTypeName = getHandleTypeName(tsSymbol, dataType, code);
	const typeDisplay = getTypeDisplay(handleTypeName);

	const { isValidConnection } = useUltimateFlowConnectionPrevention();

	  // Check if this handle is connected by looking at edges but subscribe only to relevant boolean
  const isConnected = useStore(
    React.useCallback(
      (state) =>
        state.edges.some((edge) =>
          props.type === "source"
            ? edge.source === nodeId && edge.sourceHandle === props.id
            : edge.target === nodeId && edge.targetHandle === props.id
        ),
      [nodeId, props.id, props.type]
    )
  );

	const isSource = props.type === "source";
	const connectableStart = isSource; // only sources can start connections
	const connectableEnd = !isSource; // only targets can end connections

	// Get background color using utility function
	const backgroundColor = getHandleBackgroundColor(isConnected, isSource);

	// Get injectable classes based on handle state
	const baseClasses = getInjectableClasses("--core-handle-classes-base");
	const stateClasses = isConnected
		? getInjectableClasses("--core-handle-classes-connected")
		: isSource
			? getInjectableClasses("--core-handle-classes-source")
			: getInjectableClasses("--core-handle-classes-target");

	// Generate tooltip content
	const tooltipContent = getTooltipContent(props.type || "target", dataType, code, tsSymbol);

	const IconComponent = typeDisplay.icon;

	return (
		<Handle
			{...(props as HandleProps)}
			className={`${UNIFIED_HANDLE_STYLES.base} ${baseClasses} ${stateClasses}`}
			title={tooltipContent} // Native browser tooltip
			style={{
				width: HANDLE_SIZE_PX,
				height: HANDLE_SIZE_PX,
				borderWidth: UNIFIED_HANDLE_STYLES.border.width,
				boxShadow: `${UNIFIED_HANDLE_STYLES.border.shadow} ${typeDisplay.color}`,
				borderColor: typeDisplay.color,
				color: typeDisplay.color,
				backgroundColor,
				pointerEvents: "all", // Ensure pointer events work for both input and output handles
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				lineHeight: "1",
				...getPositionOffset(props.position, handleIndex, totalHandlesOnSide), // Apply smart positioning
				...props.style,
			}}
			isValidConnection={isValidConnection}
			isConnectableStart={connectableStart}
			isConnectableEnd={connectableEnd}
		>
			<IconComponent width={8} height={8} style={{ pointerEvents: "none" }} />
		</Handle>
	);
};

const TypeSafeHandle = UltimateTypesafeHandle;
export default TypeSafeHandle;

export { isTypeCompatible, parseUnionTypes, ULTIMATE_TYPE_MAP };
