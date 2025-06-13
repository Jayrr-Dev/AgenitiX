/**
 * TYPESAFE HANDLE SYSTEM - A comprehensive, type-safe handle for React Flow.
 * Features:
 * • Extensive type system with over 25 supported types.
 * • Full support for union types (e.g., "string|number").
 * • Automatic validation and prevention of incompatible connections.
 * • User-friendly toast notifications for connection errors.
 * • Decoupled and reusable for any React Flow project.
 */
import {
  Handle,
  type HandleProps,
  IsValidConnection,
  useStoreApi,
  useStore,
} from "@xyflow/react";
import React, { useCallback } from "react";
import { toast } from "sonner";
import Ajv from "ajv";
// Auto-generated at build time (can be empty in dev before first build)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore – file is generated post-install / build
import schemaManifest from "@/generated/handle-types.manifest.json";

// ============================================================================
// CONFIGURATION CONSTANTS - Easy to maintain and adjust
// ============================================================================

/**
 * Handle visual configuration
 */
const HANDLE_SIZE_PX = 10;
const HANDLE_POSITION_OFFSET = 12; // pixels to move handles further out from nodes
const HANDLE_SPACING = 12; // pixels between multiple handles on the same side

/**
 * Handle background colors
 */
const HANDLE_BACKGROUND_CONNECTED = 'rgba(0,0,0,0.5)';
const HANDLE_BACKGROUND_SOURCE = 'rgba(0,0,0,0.5)';
const HANDLE_BACKGROUND_TARGET = 'rgba(255,255,255,0.1)';

/**
 * Handle CSS styling
 */
const HANDLE_CSS_CLASSES = "flex items-center justify-center rounded-sm text-[6px] font-semibold uppercase select-none z-30";
const HANDLE_BORDER_WIDTH = 0;
const HANDLE_BOX_SHADOW_TEMPLATE = "0 0 0.5px 0.5px "; // color will be appended

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
const ajv = new Ajv({ allErrors: false, strict: false });

/**
 * Display map - maps basic type names to icon text & color
 */
const DISPLAY_MAP: Record<string, { icon: string; color: string }> = {
  string: { icon: "T", color: "#3b82f6" },
  number: { icon: "#", color: "#f59e42" },
  boolean: { icon: "✓", color: "#10b981" },
  object: { icon: "{}", color: "#6366f1" },
  array: { icon: "[]", color: "#f472b6" },
  any: { icon: "?", color: "#6b7280" },
  json: { icon: "J", color: "#6366f1" },
};

/**
 * Ultimate type map - maps short codes to type information
 */
const ULTIMATE_TYPE_MAP: Record<string, any> = {
  s: { color: "#3b82f6", label: "string" },
  n: { color: "#f59e42", label: "number" },
  b: { color: "#10b981", label: "boolean" },
  j: { color: "#6366f1", label: "json" },
  a: { color: "#f472b6", label: "array" },
  x: { color: "#6b7280", label: "any" },
  V: { color: "#8b5cf6", label: "Vibe" },
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
};

// ============================================================================
// UTILITY FUNCTIONS - Pure functions using top-level constants
// ============================================================================

/**
 * Parse union types from type string
 */
function parseUnionTypes(typeStr?: string | null): string[] {
  if (!typeStr) return DEFAULT_TYPE_FALLBACK;
  return typeStr.split("|").map(t => t.trim());
}

/**
 * Calculate positioning offset based on handle position and index
 * Supports multiple handles on the same side without overlapping
 */
function getPositionOffset(
  position: string, 
  handleIndex: number = 0, 
  totalHandlesOnSide: number = 1
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
  const totalSpacing = (totalHandlesOnSide - 1) * HANDLE_SPACING;
  const startOffset = -totalSpacing / 2;
  const currentOffset = startOffset + (handleIndex * HANDLE_SPACING);

  // Add perpendicular offset for multiple handles
  // Use transform to center handles properly relative to their own size
  switch (position) {
    case 'left':
    case 'right':
      return { 
        ...base, 
        top: `calc(50% + ${currentOffset}px)` as any,
        transform: 'translateY(-50%)' 
      };
    case 'top':
    case 'bottom':
      return { 
        ...base, 
        left: `calc(50% + ${currentOffset}px)` as any,
        transform: 'translateX(-50%)' 
      };
    default:
      return base;
  }
}

/**
 * Get handle background color based on connection state
 */
function getHandleBackgroundColor(isConnected: boolean, isSource: boolean): string {
  if (isConnected) return HANDLE_BACKGROUND_CONNECTED;
  return isSource ? HANDLE_BACKGROUND_SOURCE : HANDLE_BACKGROUND_TARGET;
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
  handleType: 'source' | 'target', 
  dataType?: string, 
  code?: string,
  tsSymbol?: string
): string {
  const direction = handleType === 'target' ? 'Input' : 'Output';
  
  // Handle TypeScript symbols
  if (tsSymbol) {
    const symbolName = tsSymbol.split(".").pop() || 'Unknown';
    return `${direction}: ${symbolName} (TypeScript type)`;
  }
  
  // Get the primary type code
  const typeCode = parseUnionTypes(dataType || code)[0];
  const typeDescription = TYPE_DESCRIPTIONS[typeCode];
  
  if (!typeDescription) {
    return `${direction}: Unknown type (${typeCode || 'undefined'})`;
  }
  
  // Handle union types (multiple types separated by |)
  const allTypes = parseUnionTypes(dataType || code);
  if (allTypes.length > 1) {
    const descriptions = allTypes
      .map(type => TYPE_DESCRIPTIONS[type])
      .filter(Boolean);
    
    if (descriptions.length > 1) {
      return `${direction}: ${descriptions.join(' OR ')}`;
    }
  }
  
  return `${direction}: ${typeDescription}`;
}

function isTypeCompatible(sourceType: string, targetType: string): boolean {
    if (sourceType === 'x' || targetType === 'x') return true;
    const sourceTypes = parseUnionTypes(sourceType);
    const targetTypes = parseUnionTypes(targetType);
    return sourceTypes.some(s => targetTypes.includes(s));
}

// Simple debounce map to avoid toast spam
const toastThrottle: Record<string, number> = {};

export const useUltimateFlowConnectionPrevention = () => {
    const isValidConnection: IsValidConnection = useCallback(
    (connection) => {
      const { source, sourceHandle, target, targetHandle } = connection;

      // Extract types from handle IDs (e.g., "handle-id__string|number")
      const sourceDataType = sourceHandle?.split("__")[1];
      const targetDataType = targetHandle?.split("__")[1];
      
      if (!sourceDataType || !targetDataType) {
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
              description: TOAST_ERROR_DESCRIPTION_TEMPLATE
                .replace('{source}', sourceDataType)
                .replace('{target}', targetDataType),
              duration: TOAST_DURATION,
            });
            toastThrottle[key] = now;
          }
      }
      return compatible;
    },
    []
  );
  return { isValidConnection };
}

const UltimateTypesafeHandle: React.FC<any> = ({
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
  const badge = DISPLAY_MAP[handleTypeName.toLowerCase()] || DISPLAY_MAP.any;

  const { isValidConnection } = useUltimateFlowConnectionPrevention();

  // Check if this handle is connected by looking at edges
  const edges = useStore((state) => state.edges);
  const isConnected = edges.some((edge) => {
    if (props.type === 'source') {
      return edge.source === nodeId && edge.sourceHandle === props.id;
    } else {
      return edge.target === nodeId && edge.targetHandle === props.id;
    }
  });

  const isSource = props.type === 'source';
  const connectableStart = isSource; // only sources can start connections
  const connectableEnd = !isSource;  // only targets can end connections

  // Get background color using utility function
  const backgroundColor = getHandleBackgroundColor(isConnected, isSource);

  // Generate tooltip content
  const tooltipContent = getTooltipContent(props.type, dataType, code, tsSymbol);

  return (
    <Handle
      {...(props as HandleProps)}
      className={HANDLE_CSS_CLASSES}
      title={tooltipContent} // Native browser tooltip
      style={{
        width: HANDLE_SIZE_PX,
        height: HANDLE_SIZE_PX,
        borderWidth: HANDLE_BORDER_WIDTH,
        boxShadow: HANDLE_BOX_SHADOW_TEMPLATE + badge.color,
        borderColor: badge.color,
        color: badge.color,
        backgroundColor,
        pointerEvents: 'all', // Ensure pointer events work for both input and output handles
        ...getPositionOffset(props.position, handleIndex, totalHandlesOnSide), // Apply smart positioning
        ...props.style,
      }}
      isValidConnection={isValidConnection}
      isConnectableStart={connectableStart}
      isConnectableEnd={connectableEnd}
    >
      {badge.icon}
    </Handle>
  );
};

const TypeSafeHandle = UltimateTypesafeHandle;
export default TypeSafeHandle;

export {
  ULTIMATE_TYPE_MAP,
  parseUnionTypes,
  isTypeCompatible,
}; 