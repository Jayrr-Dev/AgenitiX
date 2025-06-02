/**
 * TYPESAFE HANDLE COMPONENT - Type-safe connection handles for React Flow nodes
 *
 * Last updated: 2024-12-20 - Removed all console logging for clean production code
 *
 * • Renders color-coded handles with data type validation for node connections
 * • Enforces type compatibility rules between source and target handles
 * • Provides visual feedback for valid/invalid connections with tooltips
 * • Supports union types and connection limits with proper error handling
 * • Integrates with node registry for dynamic handle configuration lookup
 *
 * Keywords: ReactFlow, handles, type-safety, connections, validation,
 * data-types, color-coding, tooltips, union-types, connection-limits,
 * source, target, compatibility, visual-feedback, node-registry
 */

import {
  Connection,
  Handle,
  type HandleProps,
  useReactFlow,
} from "@xyflow/react";
import React, { useCallback, useMemo, useState } from "react";

// ===== TYPE DEFINITIONS =====

interface TypeMapEntry {
  label: string;
  color: string;
}

interface CustomHandleProps
  extends Omit<HandleProps, "className" | "isConnectable"> {
  dataType: keyof typeof TYPE_MAP;
  className?: string;
  isConnectable?:
    | boolean
    | number
    | ((connection: any, context: any) => boolean);
}

interface ConnectionAttempt {
  source?: string;
  sourceHandle?: string | null;
}

// ===== CONSTANTS =====

// TYPE MAP WITH COLORS AND LABELS
const TYPE_MAP: Record<string, TypeMapEntry> = {
  s: { label: "s", color: "#3b82f6" }, // string - blue
  n: { label: "n", color: "#f59e42" }, // number - orange
  b: { label: "b", color: "#10b981" }, // boolean - green
  j: { label: "j", color: "#6366f1" }, // JSON - indigo
  a: { label: "a", color: "#f472b6" }, // array - pink
  N: { label: "N", color: "#a21caf" }, // Bigint - purple
  f: { label: "f", color: "#fbbf24" }, // float - yellow
  x: { label: "x", color: "#6b7280" }, // any - gray
  u: { label: "u", color: "#d1d5db" }, // undefined - light gray
  S: { label: "S", color: "#eab308" }, // symbol - gold
  "∅": { label: "∅", color: "#ef4444" }, // null - red
} as const;

// TYPE DESCRIPTIONS FOR TOOLTIPS
const TYPE_DESCRIPTIONS: Record<string, string> = {
  s: "String Only - Text and string values",
  n: "Number Only - Integer and numeric values",
  b: "Boolean Only - True/false values",
  j: "JSON Only - JavaScript objects and JSON data",
  a: "Array Only - Lists and array structures",
  N: "BigInt Only - Large integer values",
  f: "Float Only - Decimal and floating-point numbers",
  x: "Any Type - Accepts all data types",
  u: "Undefined Only - Undefined values",
  S: "Symbol Only - JavaScript symbol values",
  "∅": "Null Only - Null values",
} as const;

// ===== UTILITY FUNCTIONS =====

/**
 * Type guard to check if object has source handle properties
 */
function hasSourceHandle(
  obj: any
): obj is { source: string; sourceHandle: string | null } {
  return (
    obj && typeof obj === "object" && "source" in obj && "sourceHandle" in obj
  );
}

/**
 * Parse union type string into array of individual types
 */
export function parseTypes(typeStr?: string | null): string[] {
  if (!typeStr) return [];
  return typeStr
    .split("|")
    .map((t) => t.trim())
    .map((t) => (t.startsWith("b") ? "b" : t));
}

/**
 * Get node handles from registry with safe initialization handling
 */
function getNodeHandlesFromRegistry(nodeType: string | undefined): any[] {
  if (!nodeType) return [];

  try {
    // Use dynamic import to avoid circular dependency issues
    const registry = require("../node-registry/nodeRegistry");

    // Check if the registry is properly initialized
    if (!registry || typeof registry.getNodeHandles !== "function") {
      return [];
    }

    const handles = registry.getNodeHandles(nodeType);
    return Array.isArray(handles) ? handles : [];
  } catch (error) {
    // Silent fallback for any registry access issues
    // This includes circular dependency errors, missing registry, etc.
    return [];
  }
}

/**
 * Find source handle configuration by ID
 */
function findSourceHandleConfig(
  handles: any[],
  sourceHandle: string | null
): any {
  if (!sourceHandle) return null;
  return handles.find((h: any) => h.id === sourceHandle);
}

/**
 * Infer data type from common handle ID patterns
 */
function inferDataTypeFromHandleId(handleId: string): string {
  const lowerId = handleId.toLowerCase();

  // Common patterns
  if (lowerId.includes("trigger") || lowerId.includes("bool")) return "b";
  if (
    lowerId.includes("text") ||
    lowerId.includes("string") ||
    lowerId.includes("output")
  )
    return "s";
  if (lowerId.includes("number") || lowerId.includes("count")) return "n";
  if (lowerId.includes("json") || lowerId.includes("object")) return "j";
  if (lowerId.includes("array") || lowerId.includes("list")) return "a";
  if (lowerId.includes("error") || lowerId.includes("symbol")) return "S";

  // Default to 'any' if we can't infer
  return "x";
}

// ===== HOOK FUNCTIONS =====

/**
 * Custom hook for connection validation logic
 */
function useConnectionValidation(
  dataType: keyof typeof TYPE_MAP,
  id: string | null | undefined,
  setInvalid: (invalid: boolean) => void
) {
  const reactFlow = useReactFlow();

  return useCallback(
    (connection: Connection | ConnectionAttempt) => {
      if (!hasSourceHandle(connection)) {
        setInvalid(false);
        return true;
      }

      const { source, sourceHandle } = connection;

      // EARLY VALIDATION CHECKS
      if (!source) {
        setInvalid(true);
        return false;
      }

      const nodes = reactFlow.getNodes?.() || [];
      const sourceNode = nodes.find((n) => n.id === source);

      if (!sourceNode) {
        setInvalid(true);
        return false;
      }

      // GET SOURCE HANDLE DATA TYPE WITH FALLBACK
      const sourceHandles = getNodeHandlesFromRegistry(sourceNode.type);
      const sourceHandleConfig = findSourceHandleConfig(
        sourceHandles,
        sourceHandle
      );

      // If registry lookup fails, try to infer from handle ID or default to 'any'
      let sourceDataType = sourceHandleConfig?.dataType;

      if (!sourceDataType && sourceHandle) {
        // Try to infer data type from handle ID if it contains type info
        if (sourceHandle.includes("|")) {
          const types = parseTypes(sourceHandle);
          sourceDataType = types[0] || "x";
        } else {
          // Common handle ID patterns
          sourceDataType = inferDataTypeFromHandleId(sourceHandle);
        }
      }

      // Default to 'any' type if we can't determine the source type
      sourceDataType = sourceDataType || "x";

      // TARGET DATA TYPE
      const targetDataType = dataType;

      // TYPE COMPATIBILITY RULES
      const isCompatible = checkTypeCompatibility(
        sourceDataType,
        targetDataType
      );

      setInvalid(!isCompatible);
      return isCompatible;
    },
    [dataType, reactFlow, setInvalid]
  );
}

/**
 * Custom hook for connection limits - returns only boolean
 */
function useConnectionLimits(
  isConnectable: CustomHandleProps["isConnectable"],
  id: string | null | undefined
): boolean {
  const reactFlow = useReactFlow();

  return useMemo(() => {
    if (typeof isConnectable === "boolean") {
      return isConnectable;
    }

    if (typeof isConnectable === "number") {
      const edges = reactFlow.getEdges?.() || [];
      const existingConnections = edges.filter(
        (e) => e.targetHandle === id
      ).length;
      return existingConnections < isConnectable;
    }

    // Default to true for functions or undefined
    return true;
  }, [isConnectable, id, reactFlow]);
}

// ===== VALIDATION FUNCTIONS =====

/**
 * Check type compatibility between source and target
 */
function checkTypeCompatibility(
  sourceDataType: string,
  targetDataType: string
): boolean {
  // UNIVERSAL COMPATIBILITY: 'x' (any) accepts anything
  if (sourceDataType === "x" || targetDataType === "x") {
    return true;
  }

  // EXACT TYPE MATCH
  if (sourceDataType === targetDataType) {
    return true;
  }

  // SPECIAL COMPATIBILITY RULES
  // String and JSON are compatible in some cases
  if (
    (sourceDataType === "s" && targetDataType === "j") ||
    (sourceDataType === "j" && targetDataType === "s")
  ) {
    return true;
  }

  return false;
}

// ===== TOOLTIP FUNCTIONS =====

/**
 * Generate tooltip text based on handle type and state
 */
function generateTooltip(
  invalid: boolean,
  dataType: keyof typeof TYPE_MAP,
  id: string | undefined | null,
  type: HandleProps["type"]
): string {
  if (invalid) {
    return "Type mismatch: cannot connect these handles.";
  }

  const direction = type === "target" ? "Input" : "Output";

  // HANDLE UNION TYPES
  if (id && id.includes("|")) {
    const types = parseTypes(id);
    const descriptions = types
      .map((type) => TYPE_DESCRIPTIONS[type])
      .filter(Boolean);

    if (descriptions.length > 1) {
      return `${direction}: ${descriptions.join(" OR ")}`;
    } else if (descriptions.length === 1) {
      return `${direction}: ${descriptions[0]}`;
    }
  }

  // SINGLE TYPE
  const typeDescription = TYPE_DESCRIPTIONS[dataType] || "Unknown type";
  return `${direction}: ${typeDescription}`;
}

// ===== STYLE FUNCTIONS =====

/**
 * Generate handle style object
 */
function generateHandleStyle(
  color: string,
  baseStyle?: React.CSSProperties
): React.CSSProperties {
  return {
    ...baseStyle,
    backgroundColor: color,
    color: "#fff",
    border: "0.5px solid rgba(255, 255, 255, 0.3)",
  };
}

/**
 * Generate handle className string
 */
function generateHandleClassName(
  invalid: boolean,
  baseClassName: string
): string {
  const baseClasses =
    "w-8 h-8 flex items-center justify-center rounded-full p-1 shadow";
  const invalidClass = invalid ? "ring-2 ring-red-500" : "";

  return `${baseClasses} ${invalidClass} ${baseClassName}`.trim();
}

// ===== MAIN COMPONENT =====

const TypesafeHandle: React.FC<CustomHandleProps> = ({
  dataType,
  className = "",
  position,
  id,
  isConnectable = true,
  ...props
}) => {
  // STATE
  const [invalid, setInvalid] = useState(false);

  // DERIVED VALUES
  const { label, color } = TYPE_MAP[dataType] || {
    label: "?",
    color: "#6b7280",
  };

  // HOOKS
  const isValidConnection = useConnectionValidation(dataType, id, setInvalid);
  const handleIsConnectable = useConnectionLimits(isConnectable, id);

  // COMPUTED PROPERTIES
  const tooltip = useMemo(
    () => generateTooltip(invalid, dataType, id, props.type),
    [invalid, dataType, id, props.type]
  );

  const handleStyle = useMemo(
    () => generateHandleStyle(color, props.style),
    [color, props.style]
  );

  const handleClassName = useMemo(
    () => generateHandleClassName(invalid, className),
    [invalid, className]
  );

  // RENDER
  return (
    <Handle
      {...props}
      id={id}
      position={position}
      isValidConnection={isValidConnection}
      isConnectable={handleIsConnectable}
      className={handleClassName}
      style={handleStyle}
      title={tooltip}
    >
      <span
        style={{
          fontSize: "8px",
          fontWeight: 200,
          lineHeight: 1,
          pointerEvents: "none",
          color: "#fff",
          userSelect: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          marginBottom: "1.5px",
        }}
      >
        {label}
      </span>
    </Handle>
  );
};

export default TypesafeHandle;
