/**
 * ULTIMATE TYPESAFE HANDLE SYSTEM - Complete replacement with expanded types
 *
 * • Maintains exact colors from original TypesafeHandle system
 * • Expanded type system with 25+ types including specialized types
 * • Full union type support (e.g., "s|n", "j|a|s")
 * • Preserves original toast styling and structure
 * • Automatic disconnection of incompatible connections
 * • Enhanced compatibility rules with smart inference
 * • Clean, maintainable architecture
 */

import {
  Handle,
  type HandleProps,
  IsValidConnection,
  useReactFlow,
} from "@xyflow/react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

// ===== EXPANDED TYPE SYSTEM WITH ORIGINAL COLORS =====

interface TypeMapEntry {
  label: string;
  color: string;
  description: string;
  category: "primitive" | "complex" | "special" | "functional" | "meta";
}

// MASSIVELY EXPANDED TYPE SYSTEM - 25+ TYPES
const ULTIMATE_TYPE_MAP: Record<string, TypeMapEntry> = {
  // === PRIMITIVE TYPES (Original Colors Preserved) ===
  s: {
    label: "s",
    color: "#3b82f6",
    description: "String - Text and string values",
    category: "primitive",
  },
  n: {
    label: "n",
    color: "#f59e42",
    description: "Number - Integer and numeric values",
    category: "primitive",
  },
  b: {
    label: "b",
    color: "#10b981",
    description: "Boolean - True/false values",
    category: "primitive",
  },
  f: {
    label: "f",
    color: "#fbbf24",
    description: "Float - Decimal and floating-point numbers",
    category: "primitive",
  },
  N: {
    label: "N",
    color: "#a21caf",
    description: "BigInt - Large integer values",
    category: "primitive",
  },
  u: {
    label: "u",
    color: "#d1d5db",
    description: "Undefined - Undefined values",
    category: "primitive",
  },
  "∅": {
    label: "∅",
    color: "#ef4444",
    description: "Null - Null values",
    category: "primitive",
  },

  // === COMPLEX DATA TYPES ===
  j: {
    label: "j",
    color: "#6366f1",
    description: "JSON - JavaScript objects and JSON data",
    category: "complex",
  },
  a: {
    label: "a",
    color: "#f472b6",
    description: "Array - Lists and array structures",
    category: "complex",
  },
  o: {
    label: "o",
    color: "#8b5cf6",
    description: "Object - Plain JavaScript objects",
    category: "complex",
  },
  m: {
    label: "m",
    color: "#06b6d4",
    description: "Map - Key-value Map structures",
    category: "complex",
  },
  st: {
    label: "st",
    color: "#84cc16",
    description: "Set - Unique value collections",
    category: "complex",
  },
  t: {
    label: "t",
    color: "#f97316",
    description: "Tuple - Fixed-length arrays with typed elements",
    category: "complex",
  },

  // === SPECIAL TYPES ===
  S: {
    label: "S",
    color: "#eab308",
    description: "Symbol - JavaScript symbol values",
    category: "special",
  },
  d: {
    label: "d",
    color: "#dc2626",
    description: "Date - Date and time objects",
    category: "special",
  },
  r: {
    label: "r",
    color: "#be123c",
    description: "RegExp - Regular expression patterns",
    category: "special",
  },
  e: {
    label: "e",
    color: "#dc2626",
    description: "Error - Error objects and exceptions",
    category: "special",
  },
  w: {
    label: "w",
    color: "#7c3aed",
    description: "WeakMap - Weak key-value references",
    category: "special",
  },
  ws: {
    label: "ws",
    color: "#7c3aed",
    description: "WeakSet - Weak value collections",
    category: "special",
  },

  // === FUNCTIONAL TYPES ===
  fn: {
    label: "fn",
    color: "#059669",
    description: "Function - Callable functions",
    category: "functional",
  },
  af: {
    label: "af",
    color: "#0891b2",
    description: "AsyncFunction - Promise-returning functions",
    category: "functional",
  },
  gf: {
    label: "gf",
    color: "#0d9488",
    description: "GeneratorFunction - Generator functions",
    category: "functional",
  },
  p: {
    label: "p",
    color: "#1d4ed8",
    description: "Promise - Asynchronous operations",
    category: "functional",
  },

  // === TYPED ARRAYS ===
  ta: {
    label: "ta",
    color: "#9333ea",
    description: "TypedArray - Binary data arrays",
    category: "complex",
  },
  ab: {
    label: "ab",
    color: "#c026d3",
    description: "ArrayBuffer - Raw binary data",
    category: "complex",
  },

  // === META TYPES ===
  x: {
    label: "x",
    color: "#6b7280",
    description: "Any - Accepts all data types",
    category: "meta",
  },
  v: {
    label: "v",
    color: "#374151",
    description: "Void - No return value",
    category: "meta",
  },
  nv: {
    label: "nv",
    color: "#4b5563",
    description: "Never - Never returns",
    category: "meta",
  },
  uk: {
    label: "uk",
    color: "#9ca3af",
    description: "Unknown - Unknown type (safer than any)",
    category: "meta",
  },

  // === FLOW CONTROL TYPES ===
  tr: {
    label: "tr",
    color: "#22c55e",
    description: "Trigger - Flow control signals",
    category: "special",
  },
  sg: {
    label: "sg",
    color: "#facc15",
    description: "Signal - Event notifications",
    category: "special",
  },
  ev: {
    label: "ev",
    color: "#fb7185",
    description: "Event - DOM or custom events",
    category: "special",
  },
} as const;

// ===== UNION TYPE SYSTEM =====

/**
 * Parse union type string into array of individual types
 */
export function parseUnionTypes(typeStr?: string | null): string[] {
  if (!typeStr) return [];

  return typeStr
    .split("|")
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
    .map((t) => {
      if (t.startsWith("bool")) return "b";
      if (t.startsWith("int")) return "n";
      if (t.startsWith("str")) return "s";
      return t;
    });
}

/**
 * Create union type string from array
 */
export function createUnionType(types: string[]): string {
  return Array.from(new Set(types)).sort().join("|");
}

/**
 * Check if a type string represents a union
 */
export function isUnionType(typeStr?: string | null): boolean {
  return Boolean(typeStr && typeStr.includes("|"));
}

// ===== ENHANCED COMPATIBILITY SYSTEM =====

const ULTIMATE_COMPATIBILITY_RULES: Record<string, string[]> = {
  // === PRIMITIVE COMPATIBILITY ===
  s: ["s", "j", "o", "x", "uk"], // String can connect to String, JSON, Object, Any, Unknown
  n: ["n", "f", "s", "x", "uk"], // Number can connect to Number, Float, String, Any, Unknown
  b: ["b", "s", "n", "x", "uk"], // Boolean can connect to Boolean, String, Number, Any, Unknown
  f: ["f", "n", "s", "x", "uk"], // Float can connect to Float, Number, String, Any, Unknown
  N: ["N", "s", "x", "uk"], // BigInt can connect to BigInt, String, Any, Unknown
  u: ["u", "x", "uk"], // Undefined can connect to Undefined, Any, Unknown
  "∅": ["∅", "x", "uk"], // Null can connect to Null, Any, Unknown

  // === COMPLEX DATA COMPATIBILITY ===
  j: ["j", "s", "o", "a", "x", "uk"], // JSON can connect to JSON, String, Object, Array, Any, Unknown
  a: ["a", "j", "s", "t", "ta", "x", "uk"], // Array can connect to Array, JSON, String, Tuple, TypedArray, Any, Unknown
  o: ["o", "j", "s", "m", "x", "uk"], // Object can connect to Object, JSON, String, Map, Any, Unknown
  m: ["m", "o", "j", "x", "uk"], // Map can connect to Map, Object, JSON, Any, Unknown
  st: ["st", "a", "j", "x", "uk"], // Set can connect to Set, Array, JSON, Any, Unknown
  t: ["t", "a", "j", "x", "uk"], // Tuple can connect to Tuple, Array, JSON, Any, Unknown

  // === SPECIAL TYPE COMPATIBILITY ===
  S: ["S", "s", "x", "uk"], // Symbol can connect to Symbol, String, Any, Unknown
  d: ["d", "s", "n", "x", "uk"], // Date can connect to Date, String, Number, Any, Unknown
  r: ["r", "s", "x", "uk"], // RegExp can connect to RegExp, String, Any, Unknown
  e: ["e", "s", "o", "x", "uk"], // Error can connect to Error, String, Object, Any, Unknown
  w: ["w", "m", "o", "x", "uk"], // WeakMap can connect to WeakMap, Map, Object, Any, Unknown
  ws: ["ws", "st", "a", "x", "uk"], // WeakSet can connect to WeakSet, Set, Array, Any, Unknown

  // === FUNCTIONAL TYPE COMPATIBILITY ===
  fn: ["fn", "af", "gf", "x", "uk"], // Function can connect to Function, AsyncFunction, GeneratorFunction, Any, Unknown
  af: ["af", "fn", "p", "x", "uk"], // AsyncFunction can connect to AsyncFunction, Function, Promise, Any, Unknown
  gf: ["gf", "fn", "x", "uk"], // GeneratorFunction can connect to GeneratorFunction, Function, Any, Unknown
  p: ["p", "af", "x", "uk"], // Promise can connect to Promise, AsyncFunction, Any, Unknown

  // === TYPED ARRAY COMPATIBILITY ===
  ta: ["ta", "a", "ab", "x", "uk"], // TypedArray can connect to TypedArray, Array, ArrayBuffer, Any, Unknown
  ab: ["ab", "ta", "x", "uk"], // ArrayBuffer can connect to ArrayBuffer, TypedArray, Any, Unknown

  // === META TYPE COMPATIBILITY ===
  x: Object.keys(ULTIMATE_TYPE_MAP), // Any accepts everything
  uk: Object.keys(ULTIMATE_TYPE_MAP), // Unknown accepts everything
  v: ["v", "x", "uk"], // Void can connect to Void, Any, Unknown
  nv: ["nv", "x", "uk"], // Never can connect to Never, Any, Unknown

  // === FLOW CONTROL COMPATIBILITY ===
  tr: ["tr", "b", "sg", "x", "uk"], // Trigger can connect to Trigger, Boolean, Signal, Any, Unknown
  sg: ["sg", "tr", "ev", "b", "x", "uk"], // Signal can connect to Signal, Trigger, Event, Boolean, Any, Unknown
  ev: ["ev", "sg", "o", "x", "uk"], // Event can connect to Event, Signal, Object, Any, Unknown
};

/**
 * Enhanced type compatibility check with union support
 */
function isTypeCompatible(sourceType: string, targetType: string): boolean {
  if (isUnionType(sourceType) || isUnionType(targetType)) {
    return checkUnionCompatibility(sourceType, targetType);
  }

  const compatibleTargets = ULTIMATE_COMPATIBILITY_RULES[sourceType] || [];
  return compatibleTargets.includes(targetType);
}

/**
 * Check compatibility between union types
 */
function checkUnionCompatibility(
  sourceType: string,
  targetType: string
): boolean {
  const sourceTypes = parseUnionTypes(sourceType);
  const targetTypes = parseUnionTypes(targetType);

  if (sourceTypes.length > 1) {
    return sourceTypes.some((sType) => {
      if (targetTypes.length > 1) {
        return targetTypes.some((tType) => isTypeCompatible(sType, tType));
      } else {
        return isTypeCompatible(sType, targetType);
      }
    });
  }

  if (targetTypes.length > 1) {
    return targetTypes.some((tType) => isTypeCompatible(sourceType, tType));
  }

  return isTypeCompatible(sourceType, targetType);
}

/**
 * Get compatible types for a given source type
 */
function getCompatibleTypes(sourceType: string): string[] {
  if (isUnionType(sourceType)) {
    const sourceTypes = parseUnionTypes(sourceType);
    const allCompatible = new Set<string>();

    sourceTypes.forEach((sType) => {
      const compatible = ULTIMATE_COMPATIBILITY_RULES[sType] || [];
      compatible.forEach((t) => allCompatible.add(t));
    });

    return Array.from(allCompatible);
  }

  return ULTIMATE_COMPATIBILITY_RULES[sourceType] || [];
}

// ===== REGISTRY INTEGRATION =====

/**
 * DATA TYPE MAPPING - Convert between JSON registry full names and Ultimate handle short codes
 */
const DATATYPE_MAPPING: Record<string, string> = {
  // Primitive types
  boolean: "b",
  string: "s",
  number: "n",
  bigint: "N",
  undefined: "u",
  null: "∅",
  symbol: "S",

  // Complex types
  object: "o",
  array: "a",
  json: "j",
  map: "m",
  set: "st",
  tuple: "t",

  // Special types
  date: "d",
  regexp: "r",
  error: "e",
  weakmap: "w",
  weakset: "ws",

  // Functional types
  function: "fn",
  asyncfunction: "af",
  generatorfunction: "gf",
  promise: "p",

  // Typed arrays
  typedarray: "ta",
  arraybuffer: "ab",

  // Meta types
  any: "x",
  void: "v",
  never: "nv",
  unknown: "uk",

  // Flow control
  trigger: "tr",
  signal: "sg",
  event: "ev",

  // Custom/Extended types for compatibility
  image: "o", // Treat images as objects for now
};

/**
 * Convert full dataType name to short code
 */
function normalizeDataType(dataType: string): string {
  if (!dataType) return "x"; // Default to "any"

  const normalized = dataType.toLowerCase().trim();
  return DATATYPE_MAPPING[normalized] || dataType; // Return original if no mapping found
}

/**
 * Get handle type from node registry with proper dataType normalization
 */
function getHandleDataType(
  nodeId: string,
  handleId: string,
  handleType: "source" | "target"
): string | null {
  try {
    const registry = require("../json-node-registry/unifiedRegistry");
    const reactFlowInstance = (window as any).__ultimateReactFlowInstance;
    if (!reactFlowInstance) return null;

    const node = reactFlowInstance.getNodes().find((n: any) => n.id === nodeId);
    if (!node) return null;

    // Use the new normalized handle access function
    const handle = registry.getNodeHandle(node.type, handleId, handleType);

    if (!handle?.dataType) {
      console.debug(
        `[UltimateTypesafeHandle] Handle not found: ${node.type}.${handleId} (${handleType})`
      );

      // Fallback: try to get handles from factory constants
      try {
        const factoryHandles = require("../factory/constants/handles");
        const fallbackHandles = factoryHandles.getNodeHandles(node.type);
        const fallbackHandle = fallbackHandles.find(
          (h: any) => h.id === handleId && h.type === handleType
        );

        if (fallbackHandle?.dataType) {
          console.debug(
            `[UltimateTypesafeHandle] Using fallback handle: ${node.type}.${handleId} → ${fallbackHandle.dataType}`
          );
          return fallbackHandle.dataType;
        }
      } catch (fallbackError) {
        console.debug(
          `[UltimateTypesafeHandle] Fallback handle lookup failed:`,
          fallbackError
        );
      }

      return null;
    }

    console.debug(
      `[UltimateTypesafeHandle] Handle found: ${node.type}.${handleId} → ${handle.dataType} (original: ${handle.originalDataType || "N/A"})`
    );

    return handle.dataType;
  } catch (error) {
    console.warn("[UltimateTypesafeHandle] Failed to get handle type:", error);
    return null;
  }
}

// ===== MAIN HANDLE COMPONENT =====

interface UltimateHandleProps
  extends Omit<HandleProps, "className" | "isConnectable"> {
  dataType: string; // Now supports unions like "s|n" or "j|a|o"
  className?: string;
  isConnectable?: boolean | number;
  unionDisplay?: "first" | "all" | "count"; // How to display union types
}

const UltimateTypesafeHandle: React.FC<UltimateHandleProps> = ({
  dataType,
  className = "",
  position,
  id,
  isConnectable = true,
  unionDisplay = "first",
  ...props
}) => {
  const [invalid, setInvalid] = useState(false);
  const { getNodes, getEdges, setEdges } = useReactFlow();

  // Auto-hide error state after 5 seconds
  useEffect(() => {
    if (invalid) {
      const timeout = setTimeout(() => {
        setInvalid(false);
      }, 5000); // 5 seconds

      return () => clearTimeout(timeout);
    }
  }, [invalid]);

  // Store React Flow instance globally
  useEffect(() => {
    (window as any).__ultimateReactFlowInstance = {
      getNodes,
      getEdges,
      setEdges,
    };
  }, [getNodes, getEdges, setEdges]);

  // HANDLE UNION TYPE DISPLAY
  const displayInfo = useMemo(() => {
    // DEBUG: Log what we're working with
    console.log(
      `[UltimateHandle] Rendering handle with dataType: "${dataType}"`
    );
    console.log(
      `[UltimateHandle] Type mapping lookup:`,
      ULTIMATE_TYPE_MAP[dataType]
    );

    if (isUnionType(dataType)) {
      const types = parseUnionTypes(dataType);
      const firstType = types[0] || "x";
      const firstTypeInfo = ULTIMATE_TYPE_MAP[firstType] || ULTIMATE_TYPE_MAP.x;

      switch (unionDisplay) {
        case "all":
          return {
            label: types.map((t) => ULTIMATE_TYPE_MAP[t]?.label || t).join("|"),
            color: firstTypeInfo.color,
            description: `Union Type: ${types.map((t) => ULTIMATE_TYPE_MAP[t]?.description || t).join(" OR ")}`,
          };
        case "count":
          return {
            label: `${types.length}`,
            color: firstTypeInfo.color,
            description: `Union of ${types.length} types: ${types.join(", ")}`,
          };
        case "first":
        default:
          return {
            label: firstTypeInfo.label,
            color: firstTypeInfo.color,
            description: `Union Type (${types.length}): ${firstTypeInfo.description} + ${types.length - 1} more`,
          };
      }
    }

    const typeInfo = ULTIMATE_TYPE_MAP[dataType] || ULTIMATE_TYPE_MAP.x;
    return {
      label: typeInfo.label,
      color: typeInfo.color,
      description: typeInfo.description,
    };
  }, [dataType, unionDisplay]);

  // ENHANCED CONNECTION VALIDATION
  const isValidConnection = useCallback((connection: any): boolean => {
    const { source, sourceHandle, target, targetHandle } = connection;

    if (!source || !sourceHandle || !target || !targetHandle) {
      return false;
    }

    // === CRITICAL: Validate handle directions ===
    // Ensure we're connecting SOURCE (output) → TARGET (input)
    const sourceHandleType = getHandleDataType(source, sourceHandle, "source");
    const targetHandleType = getHandleDataType(target, targetHandle, "target");

    // Block connections if handle directions are wrong
    if (!sourceHandleType) {
      console.warn(
        `[UltimateTypesafeHandle] BLOCKED: Source handle "${sourceHandle}" is not a valid output handle`
      );
      setInvalid(true);
      return false;
    }

    if (!targetHandleType) {
      console.warn(
        `[UltimateTypesafeHandle] BLOCKED: Target handle "${targetHandle}" is not a valid input handle`
      );
      setInvalid(true);
      return false;
    }

    // === Type compatibility check ===
    const isCompatible = isTypeCompatible(sourceHandleType, targetHandleType);

    if (!isCompatible) {
      console.info(
        `[UltimateTypesafeHandle] Blocked connection: ${sourceHandleType} → ${targetHandleType}`
      );
      showOriginalStyledToast(sourceHandleType, targetHandleType);

      setTimeout(() => {
        disconnectIncompatibleConnections(target, targetHandle);
      }, 100);
    }

    setInvalid(!isCompatible);
    return isCompatible;
  }, []);

  // CONNECTION LIMITS
  const handleIsConnectable = useMemo(() => {
    if (typeof isConnectable === "boolean") {
      return isConnectable;
    }

    if (typeof isConnectable === "number") {
      const edges = getEdges();
      const existingConnections = edges.filter(
        (e) => e.targetHandle === id
      ).length;
      return existingConnections < isConnectable;
    }

    return true;
  }, [isConnectable, id, getEdges]);

  // ENHANCED TOOLTIP GENERATION
  const tooltip = useMemo(() => {
    if (invalid) {
      return "⚠️ Type mismatch: cannot connect these handles.";
    }

    const direction = props.type === "target" ? "Input" : "Output";
    const typeLabel = displayInfo.label;
    const typeDescription = displayInfo.description;

    // For union types, show all component types
    if (isUnionType(dataType)) {
      const unionTypes = parseUnionTypes(dataType);
      const unionLabels = unionTypes
        .map((t) => ULTIMATE_TYPE_MAP[t]?.label || t)
        .join(" | ");
      return `${direction}: ${unionLabels}\n${typeDescription}`;
    }

    // For single types, show compatibility info
    if (props.type === "source") {
      // For outputs, show what they can connect TO
      const compatibleTypes = getCompatibleTypes(dataType);
      const compatibleLabels = compatibleTypes
        .slice(0, 4)
        .map((t) => ULTIMATE_TYPE_MAP[t]?.label || t)
        .join(", ");
      const moreText =
        compatibleTypes.length > 4
          ? ` (+${compatibleTypes.length - 4} more)`
          : "";

      return `${direction}: ${typeLabel}\n${typeDescription}\n\nCan connect to: ${compatibleLabels}${moreText}`;
    } else {
      // For inputs, show what can connect TO them
      const allTypes = Object.keys(ULTIMATE_TYPE_MAP);
      const compatibleSources = allTypes.filter((sourceType) =>
        isTypeCompatible(sourceType, dataType)
      );
      const sourceLabels = compatibleSources
        .slice(0, 4)
        .map((t) => ULTIMATE_TYPE_MAP[t]?.label || t)
        .join(", ");
      const moreText =
        compatibleSources.length > 4
          ? ` (+${compatibleSources.length - 4} more)`
          : "";

      return `${direction}: ${typeLabel}\n${typeDescription}\n\nAccepts from: ${sourceLabels}${moreText}`;
    }
  }, [invalid, displayInfo, props.type, dataType]);

  // STYLE GENERATION
  const handleStyle = useMemo(() => {
    console.log(
      `[UltimateHandle] Applying color: ${displayInfo.color} for dataType: ${dataType}`
    );

    const style = {
      backgroundColor: displayInfo.color,
      color: "#fff",
      border: "0.5px solid rgba(255, 255, 255, 0.3)",
      ...props.style,
    };

    return style;
  }, [displayInfo.color, props.style, dataType]);

  const handleClassName = useMemo(() => {
    const baseClasses =
      "w-8 h-8 flex items-center justify-center rounded-full p-1 shadow";
    const invalidClass = invalid
      ? "outline-1 outline-red-500/20  shadow-[0_0_2px_2px_rgba(239,68,68,0.6)]"
      : "";
    const unionClass = isUnionType(dataType)
      ? "outline-1 outline-red-500/20 shadow-[0_0_2px_2px_rgba(239,68,68,0.6)]"
      : "";
    const finalClassName =
      `${baseClasses} ${invalidClass} ${unionClass} ${className}`.trim();

    return finalClassName;
  }, [invalid, dataType, className]);

  // RENDER - Force inline styles to override any CSS
  return (
    <Handle
      {...props}
      id={id}
      position={position}
      isValidConnection={isValidConnection as IsValidConnection}
      isConnectable={handleIsConnectable}
      className={handleClassName}
      style={handleStyle}
      title={tooltip}
    >
      <span
        style={{
          fontSize:
            isUnionType(dataType) && unionDisplay === "all" ? "6px" : "8px",
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
        }}
      >
        {displayInfo.label}
      </span>
      {/* Union indicator */}
      {isUnionType(dataType) && (
        <div
          style={{
            position: "absolute",
            top: "-2px",
            right: "-2px",
            width: "6px",
            height: "6px",
            backgroundColor: "#fff",
            borderRadius: "50%",
            fontSize: "6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: displayInfo.color,
            fontWeight: "bold",
          }}
        >
          ∪
        </div>
      )}
    </Handle>
  );
};

// ===== UTILITY FUNCTIONS =====

/**
 * Auto-disconnect incompatible connections
 */
function disconnectIncompatibleConnections(
  targetNodeId: string,
  targetHandleId: string
) {
  try {
    const reactFlowInstance = (window as any).__ultimateReactFlowInstance;
    if (!reactFlowInstance) return;

    const edges = reactFlowInstance.getEdges();

    const validEdges = edges.filter((edge: any) => {
      if (
        edge.target !== targetNodeId ||
        edge.targetHandle !== targetHandleId
      ) {
        return true;
      }

      const sourceType = getHandleDataType(
        edge.source,
        edge.sourceHandle,
        "source"
      );
      const targetType = getHandleDataType(
        edge.target,
        edge.targetHandle,
        "target"
      );

      if (!sourceType || !targetType) return true;

      const isValid = isTypeCompatible(sourceType, targetType);

      if (!isValid) {
        console.info(
          `[UltimateTypesafeHandle] Auto-disconnecting: ${sourceType} → ${targetType}`
        );
      }

      return isValid;
    });

    if (validEdges.length !== edges.length) {
      reactFlowInstance.setEdges(validEdges);
    }
  } catch (error) {
    console.error(
      "[UltimateTypesafeHandle] Failed to disconnect incompatible connections:",
      error
    );
  }
}

// ============================================================================
// TOAST DEDUPLICATION SYSTEM
// ============================================================================

let lastToastKey = "";
let lastDirectionToastKey = "";
let toastTimeout: number | null = null;
let directionToastTimeout: number | null = null;

/**
 * Prevent duplicate toasts from showing too quickly
 */
function shouldShowToast(sourceType: string, targetType: string): boolean {
  const toastKey = `${sourceType}-${targetType}`;
  if (lastToastKey === toastKey && toastTimeout) {
    return false; // Duplicate toast, skip
  }

  lastToastKey = toastKey;
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => {
    lastToastKey = "";
    toastTimeout = null;
  }, 2000); // Reset after 2 seconds

  return true;
}

/**
 * Prevent duplicate direction error toasts (input/output handle errors)
 */
function shouldShowDirectionToast(toastKey: string): boolean {
  if (lastDirectionToastKey === toastKey && directionToastTimeout) {
    return false; // Duplicate toast, skip
  }

  lastDirectionToastKey = toastKey;
  if (directionToastTimeout) clearTimeout(directionToastTimeout);
  directionToastTimeout = window.setTimeout(() => {
    lastDirectionToastKey = "";
    directionToastTimeout = null;
  }, 1500); // Reset after 1.5 seconds

  return true;
}

/**
 * Show user feedback using Sonner toast system (integrated with app)
 */
function showOriginalStyledToast(sourceType: string, targetType: string) {
  // Prevent duplicate toasts
  if (!shouldShowToast(sourceType, targetType)) {
    return;
  }

  const sourceTypes = parseUnionTypes(sourceType);
  const targetTypes = parseUnionTypes(targetType);

  const sourceLabel =
    sourceTypes.length > 1
      ? `${sourceTypes.map((t) => ULTIMATE_TYPE_MAP[t]?.label || t).join("|")}`
      : ULTIMATE_TYPE_MAP[sourceType]?.label || sourceType;

  const targetLabel =
    targetTypes.length > 1
      ? `${targetTypes.map((t) => ULTIMATE_TYPE_MAP[t]?.label || t).join("|")}`
      : ULTIMATE_TYPE_MAP[targetType]?.label || targetType;

  const compatibleTypes = getCompatibleTypes(sourceType);
  const compatibleLabels = compatibleTypes
    .slice(0, 3)
    .map((t) => ULTIMATE_TYPE_MAP[t]?.label || t)
    .join(", ");

  // Use Sonner toast system with app theming - Enhanced clarity
  const compatibleTypeNames = compatibleTypes
    .slice(0, 4)
    .map((t) => ULTIMATE_TYPE_MAP[t]?.label || t)
    .join(", ");

  const hasMoreTypes = compatibleTypes.length > 4;
  const moreTypesText = hasMoreTypes
    ? ` and ${compatibleTypes.length - 4} more`
    : "";

  // More descriptive toast message
  toast.error(`🚫 Cannot connect ${sourceLabel} to ${targetLabel}`, {
    description: `${sourceLabel} outputs can connect to: ${compatibleTypeNames}${moreTypesText}`,
    duration: 5000,
  });
}

// ===== FLOW-LEVEL CONNECTION PREVENTION HOOK =====

/**
 * Ultimate Flow-level connection prevention with union support
 */
export function useUltimateFlowConnectionPrevention() {
  const { getNodes, getEdges, setEdges } = useReactFlow();

  useEffect(() => {
    (window as any).__ultimateReactFlowInstance = {
      getNodes,
      getEdges,
      setEdges,
    };
    return () => {
      delete (window as any).__ultimateReactFlowInstance;
    };
  }, [getNodes, getEdges, setEdges]);

  const isValidConnection = useCallback((connection: any): boolean => {
    const { source, sourceHandle, target, targetHandle } = connection;

    if (!source || !sourceHandle || !target || !targetHandle) {
      return false;
    }

    // === CRITICAL: Validate handle directions ===
    // Ensure we're connecting SOURCE (output) → TARGET (input)
    const sourceHandleType = getHandleDataType(source, sourceHandle, "source");
    const targetHandleType = getHandleDataType(target, targetHandle, "target");

    // Block connections if source handle isn't actually a source or target handle isn't actually a target
    if (!sourceHandleType) {
      console.warn(
        `[UltimateFlowConnectionPrevention] BLOCKED: Source handle "${sourceHandle}" is not a valid output handle`
      );

      // Only show toast if not recently shown
      if (shouldShowDirectionToast("input-handle-error")) {
        toast.error("🚫 Cannot connect from input handles", {
          description:
            "Start your connection from an output handle (○ on the right side of nodes)",
          duration: 5000,
        });
      }
      return false;
    }

    if (!targetHandleType) {
      console.warn(
        `[UltimateFlowConnectionPrevention] BLOCKED: Target handle "${targetHandle}" is not a valid input handle`
      );

      // Only show toast if not recently shown
      if (shouldShowDirectionToast("output-handle-error")) {
        toast.error("🚫 Cannot connect to output handles", {
          description:
            "End your connection at an input handle (○ on the left side of nodes)",
          duration: 5000,
        });
      }
      return false;
    }

    // === Type compatibility check ===
    const isCompatible = isTypeCompatible(sourceHandleType, targetHandleType);

    if (!isCompatible) {
      console.info(
        `[UltimateFlowConnectionPrevention] Blocked connection: ${sourceHandleType} → ${targetHandleType}`
      );
      showOriginalStyledToast(sourceHandleType, targetHandleType);
    }

    return isCompatible;
  }, []);

  return {
    isValidConnection,
  };
}

// ===== EXPORTS =====

export {
  getCompatibleTypes,
  isTypeCompatible,
  ULTIMATE_COMPATIBILITY_RULES,
  ULTIMATE_TYPE_MAP,
};

export default UltimateTypesafeHandle;
