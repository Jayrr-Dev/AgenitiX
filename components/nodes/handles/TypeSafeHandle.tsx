/**
 * TYPESAFE HANDLE SYSTEM - A comprehensive, type-safe handle for React Flow.
 * Features:
 * • Extensive type system with over 25 supported types.
 * • Full support for union types (e.g., "string|number").
 * • Automatic validation and prevention of incompatible connections.
 * • User-friendly toast notifications for connection errors.
 * • Decoupled and reusable for any React Flow project.
 * • Uses optimized cached React Icons for perfect centering and consistency.
 * • Performance optimized with memoized icon components and caching.
 */
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { normalizeHandleId } from "@/features/business-logic-modern/infrastructure/node-core/handleOutputUtils";
import type { JsonShapeSpec } from "@/features/business-logic-modern/infrastructure/node-core/NodeSpec";
import {
  Handle,
  type HandleProps,
  type IsValidConnection,
  useStore,
  useStoreApi,
} from "@xyflow/react";
import React, { memo, useCallback, useMemo } from "react";
import type { IconType } from "react-icons";
import {
  LuBraces,
  LuBrackets,
  LuCheck,
  LuCircle,
  LuFileText,
  LuHash,
  LuMail,
  LuSend,
  LuType,
  LuWrench,
} from "react-icons/lu";
import { VscJson } from "react-icons/vsc";
import { toast } from "sonner";
import { getNodeSpecMetadata } from "@/features/business-logic-modern/infrastructure/node-registry/nodespec-registry";
import { useNodeToast as usePerNodeToast } from "@/hooks/useNodeToast";
// Auto-generated at build time (can be empty in dev before first build)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore – file is generated post-install / build

// ============================================================================
// HANDLE ICON OPTIMIZATION SYSTEM
// ============================================================================

/**
 * Handle icon component cache for memoized components, basically prevent recreation of handle icon components
 */
const HANDLE_ICON_CACHE = new Map<
  string,
  React.ComponentType<{
    width?: number;
    height?: number;
    style?: React.CSSProperties;
  }>
>();

/**
 * Handle icon lookup cache for faster icon resolution, basically O(1) lookups for handle icons
 */
const HANDLE_ICON_LOOKUP_CACHE = new Map<string, IconType>();

/**
 * Initialize handle icons cache with all handle type icons, basically pre-create components for handle icons
 */
const initializeHandleIcons = () => {
  const handleIconComponents = {
    string: LuType,
    number: LuHash,
    boolean: LuCheck,
    object: LuBraces,
    array: LuBrackets,
    any: LuCircle,
    json: VscJson,
    tools: LuWrench,
    // Email-specific data types
    emailaccount: LuMail,
    emailtemplate: LuFileText,
    composedemail: LuSend,
  };

  Object.entries(handleIconComponents).forEach(([typeName, IconComponent]) => {
    // Cache the raw icon component
    HANDLE_ICON_LOOKUP_CACHE.set(typeName, IconComponent);

    // Create and cache memoized component for handles
    const MemoizedHandleIcon = memo<{
      width?: number;
      height?: number;
      style?: React.CSSProperties;
    }>(({ width = 8, height = 8, style }) =>
      React.createElement(IconComponent as React.ComponentType<any>, {
        width,
        height,
        style,
      })
    );
    MemoizedHandleIcon.displayName = `HandleIcon_${typeName}`;
    HANDLE_ICON_CACHE.set(typeName, MemoizedHandleIcon);
  });
};

// Initialize handle icons on module load
initializeHandleIcons();

/**
 * Gets a cached handle icon component with memoization, basically prevent component recreation for handles
 */
const getCachedHandleIcon = (
  typeName: string
): React.ComponentType<{
  width?: number;
  height?: number;
  style?: React.CSSProperties;
}> | null => {
  // Check handle icon cache first
  const cachedIcon = HANDLE_ICON_CACHE.get(typeName.toLowerCase());
  if (cachedIcon) {
    return cachedIcon;
  }

  // Fallback to 'any' type icon if specific type not found
  const fallbackIcon = HANDLE_ICON_CACHE.get("any");
  return fallbackIcon || null;
};

// ============================================================================
// CONFIGURATION CONSTANTS - Easy to maintain and adjust
// ============================================================================

/**
 * Handle visual configuration
 */
const HANDLE_SIZE_PX = 14;
const HANDLE_POSITION_OFFSET = 12; // pixels to move handles further out from nodes
const HANDLE_SPACING = 16; // pixels between multiple handles on the same side

/**
 * Utility to get CSS custom property value from the DOM
 * This allows us to inject Tailwind classes from tokens.json
 */
const getInjectableClasses = (cssVar: string): string => {
  if (typeof window === "undefined") {
    return "";
  }
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(cssVar)
    .trim();
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
  base: "flex items-center justify-center rounded-sm text-[8px] uppercase select-none z-30 leading-none",

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
const TOAST_ERROR_DESCRIPTION_TEMPLATE =
  "Cannot connect type '{source}' to '{target}'.";
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
 * Unified type display configuration using optimized cached React Icons
 * Maps type names to cached icon components and semantic token references
 */
const UNIFIED_TYPE_DISPLAY: Record<
  string,
  { iconKey: string; tokenKey: string }
> = {
  string: { iconKey: "string", tokenKey: "string" },
  number: { iconKey: "number", tokenKey: "number" },
  boolean: { iconKey: "boolean", tokenKey: "boolean" },
  object: { iconKey: "object", tokenKey: "object" },
  array: { iconKey: "array", tokenKey: "array" },
  any: { iconKey: "any", tokenKey: "any" },
  json: { iconKey: "json", tokenKey: "json" },
  tools: { iconKey: "tools", tokenKey: "tools" },
  // Email-specific data types
  emailaccount: { iconKey: "emailaccount", tokenKey: "email" },
  emailtemplate: { iconKey: "emailtemplate", tokenKey: "email" },
  composedemail: { iconKey: "composedemail", tokenKey: "email" },
  // Alternative casing for email data types
  emailAccount: { iconKey: "emailaccount", tokenKey: "email" },
  emailTemplate: { iconKey: "emailtemplate", tokenKey: "email" },
  composedEmail: { iconKey: "composedemail", tokenKey: "email" },
};

/**
 * Ultimate type map - maps short codes to type information using semantic tokens
 */
const ULTIMATE_TYPE_MAP: Record<string, { tokenKey: string; label: string }> = {
  s: { tokenKey: "string", label: "Text" },
  n: { tokenKey: "number", label: "Number" },
  b: { tokenKey: "boolean", label: "On|Off" },
  j: { tokenKey: "json", label: "JSON" },
  a: { tokenKey: "array", label: "List" },
  x: { tokenKey: "any", label: "Any" },
  V: { tokenKey: "vibe", label: "Vibe" },
  t: { tokenKey: "tools", label: "Tools" },
  // Full data type names for direct mapping
  JSON: { tokenKey: "json", label: "JSON" },
  String: { tokenKey: "string", label: "Text" },
  Boolean: { tokenKey: "boolean", label: "On|Off" },
  Number: { tokenKey: "number", label: "Number" },
  Array: { tokenKey: "array", label: "List" },
  Object: { tokenKey: "object", label: "Object" },
  Tools: { tokenKey: "tools", label: "Tools" },
  // Email-specific data types
  emailAccount: { tokenKey: "email", label: "Email" },
  emailTemplate: { tokenKey: "email", label: "Template" },
  composedEmail: { tokenKey: "email", label: "Email" },
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
  // Email-specific data types
  emailAccount: "Email Account - Email service configuration and credentials",
  emailTemplate: "Email Template - Reusable email template with variables",
  composedEmail: "Composed Email - Ready-to-send email message",
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
  const startOffset = -totalSpacing / 2;
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
function getHandleBackgroundColor(
  isConnected: boolean,
  isSource: boolean
): string {
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
 * Get unified type display information (cached icon component and color)
 */
function getTypeDisplay(handleTypeName: string): {
  iconComponent: React.ComponentType<{
    width?: number;
    height?: number;
    style?: React.CSSProperties;
  }> | null;
  color: string;
} {
  const display =
    UNIFIED_TYPE_DISPLAY[handleTypeName.toLowerCase()] ||
    UNIFIED_TYPE_DISPLAY.any;
  return {
    iconComponent: getCachedHandleIcon(display.iconKey),
    color: getTypeColor(display.tokenKey),
  };
}

/**
 * Get handle type name for display
 */
function getHandleTypeName(
  tsSymbol?: string,
  dataType?: string,
  code?: string
): string {
  if (tsSymbol) {
    return tsSymbol.split(".").pop() || DEFAULT_HANDLE_TYPE;
  }
  const typeCode = parseUnionTypes(dataType || code)[0];
  return ULTIMATE_TYPE_MAP[typeCode]?.tokenKey || DEFAULT_HANDLE_TYPE;
}

/**
 * Convert technical type code to technical label for error messages
 */
function getHumanReadableType(typeCode: string): string {
  const mapping = ULTIMATE_TYPE_MAP[typeCode];
  if (mapping) {
    // Use more technical terms for error messages
    switch (mapping.tokenKey) {
      case "string":
        return "String";
      case "number":
        return "Number";
      case "boolean":
        return "Boolean";
      case "json":
        return "JSON";
      case "array":
        return "Array";
      case "object":
        return "Object";
      case "any":
        return "Any";
      case "tools":
        return "Tools";
      case "email":
        return "Email";
      default:
        return mapping.label;
    }
  }
  return typeCode;
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
  const direction = handleType === "target" ? "IN" : "OUT";

  // Handle TypeScript symbols
  if (tsSymbol) {
    const symbolName = tsSymbol.split(".").pop() || "Unknown";
    return `${direction}<br/>${symbolName}`;
  }

  // Get the primary type code
  const typeCode = parseUnionTypes(dataType || code)[0];

  // Check if it's a full data type name (like "String", "Boolean", etc.)
  const fullTypeMapping = ULTIMATE_TYPE_MAP[typeCode];
  if (fullTypeMapping) {
    return `${direction}<br/>${fullTypeMapping.label}`;
  }

  // Handle union types (multiple types separated by |)
  const allTypes = parseUnionTypes(dataType || code);
  if (allTypes.length > 1) {
    const descriptions = allTypes
      .map((type) => {
        const fullMapping = ULTIMATE_TYPE_MAP[type];
        return fullMapping ? fullMapping.label : type;
      })
      .filter(Boolean);

    if (descriptions.length > 1) {
      return `${direction}<br/>${descriptions.join("|")}`;
    }
  }

  // Fallback for unknown types
  if (!typeCode) {
    return `${direction}<br/>Unknown`;
  }

  return `${direction}<br/>${typeCode}`;
}

/**
 * Escape HTML entities for safe innerHTML usage
 */
function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/**
 * Summarize a value for tooltip display
 * [Summarize values for concise tooltip], basically shorten values per type
 */
function summarizeValueForTooltip(value: unknown): string {
  if (value === null || value === undefined) return "empty";

  // [Explanation], basically show item count and a tiny preview for arrays
  if (Array.isArray(value)) {
    const length = value.length;
    if (length === 0) return "0 items";

    // Build a compact preview of up to 2 primitive items
    const previewItems = (value as unknown[]).slice(0, 2).map((v) => {
      const vt = typeof v;
      if (vt === "string") return `"${String(v).slice(0, 20)}"`;
      if (vt === "number" || vt === "boolean") return String(v);
      return vt === "object" ? "{…}" : String(v);
    });
    const hasPreview = previewItems.length > 0 && previewItems.some(Boolean);
    return hasPreview
      ? `${length} items [${previewItems.join(", ")}${length > 2 ? ", …" : ""}]`
      : `${length} items`;
  }

  const typeOf = typeof value;
  if (typeOf === "string") return `${(value as string).length} chars`;
  if (typeOf === "boolean") return (value as boolean) ? "true" : "false";
  if (typeOf === "number") return String(value as number);
  if (typeOf === "object")
    return `${Object.keys(value as Record<string, unknown>).length} fields`;
  try {
    return String(value);
  } catch {
    return "unknown";
  }
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

/**
 * SUCCESS TOAST COPY FOR INPUT CONNECTIONS
 * [Explanation], basically unique success messages for each input type when a new connection is made
 */
const INPUT_SUCCESS_MESSAGES: Record<string, { title: string; description?: string }> = {
  string: { title: "Text connected", description: "Input is now connected" },
  number: { title: "Number connected", description: "Input is now connected" },
  boolean: { title: "Toggle connected", description: "Input is now connected" },
  json: { title: "JSON connected", description: "Input is now connected" },
  array: { title: "List connected", description: "Input is now connected" },
  object: { title: "Object connected", description: "Input is now connected" },
  tools: { title: "Tools connected", description: "Input is now connected" },
  email: { title: "Email connected", description: "Input is now connected" },
  // Email domain specifics
  emailaccount: { title: "Account connected", description: "Email account input is set" },
  emailtemplate: { title: "Template connected", description: "Email template input is set" },
  composedemail: { title: "Email connected", description: "Composed email input is set" },
  any: { title: "Input connected", description: "Input is now connected" },
};

/**
 * Resolve a friendly message key from handle metadata
 * [Explanation], basically map various type encodings to domain-friendly keys
 */
function resolveMessageKey(handleTypeName: string, dataType?: string, code?: string): keyof typeof INPUT_SUCCESS_MESSAGES {
  const lcName = (handleTypeName || '').toLowerCase();
  const firstUnion = (val?: string) => (val ? val.split('|')[0].toLowerCase() : '');
  const primary = firstUnion(dataType) || firstUnion(code) || lcName;

  // Email domain prioritization
  if (lcName.includes('emailaccount') || primary === 'emailaccount') return 'emailaccount';
  if (lcName.includes('emailtemplate') || primary === 'emailtemplate') return 'emailtemplate';
  if (lcName.includes('composedemail') || primary === 'composedemail') return 'composedemail';
  if (lcName.includes('email') || primary === 'email') return 'email';

  // One-letter codes → verbose keys
  const codeMap: Record<string, keyof typeof INPUT_SUCCESS_MESSAGES> = {
    s: 'string', n: 'number', b: 'boolean', j: 'json', a: 'array', x: 'any'
  };
  if (primary in codeMap) return codeMap[primary];

  // Full names
  const known: Array<keyof typeof INPUT_SUCCESS_MESSAGES> = ['string','number','boolean','json','array','object','tools'];
  if ((known as string[]).includes(primary)) return primary as keyof typeof INPUT_SUCCESS_MESSAGES;

  // Fallback using display map
  const tokenKey = UNIFIED_TYPE_DISPLAY[lcName]?.tokenKey;
  if (tokenKey && INPUT_SUCCESS_MESSAGES[tokenKey as keyof typeof INPUT_SUCCESS_MESSAGES]) {
    return tokenKey as keyof typeof INPUT_SUCCESS_MESSAGES;
  }
  return 'any';
}

function isJson(value: unknown): boolean {
  if (value === null) return true;
  const t = typeof value;
  return t === "object" || t === "string" || t === "number" || t === "boolean";
}

function conformsToShape(value: unknown, shape?: JsonShapeSpec): boolean {
  if (!shape) return true;
  switch (shape.type) {
    case "any":
      return true;
    case "null":
      return value === null;
    case "string":
      return typeof value === "string";
    case "number":
      return typeof value === "number" && Number.isFinite(value as number);
    case "boolean":
      return typeof value === "boolean";
    case "array":
      if (!Array.isArray(value)) return false;
      return (value as unknown[]).every((v) => conformsToShape(v, shape.items));
    case "object":
      if (value === null || typeof value !== "object" || Array.isArray(value))
        return false;
      for (const [key, sub] of Object.entries(shape.properties)) {
        const has = Object.prototype.hasOwnProperty.call(
          value as Record<string, unknown>,
          key
        );
        if (!has) {
          if (sub.optional) continue;
          return false;
        }
        if (!conformsToShape((value as any)[key], sub)) return false;
      }
      return true;
    default:
      return true;
  }
}

/**
 * Format a JsonShapeSpec into a concise human-readable snippet
 * Examples:
 *  - { accountId: string, provider?: string }
 *  - Array<string>
 */
function formatShape(spec?: JsonShapeSpec, indent = 0): string {
  if (!spec) return "unknown";
  const pad = (n: number) => "  ".repeat(n);

  switch (spec.type) {
    case "any":
      return "any";
    case "null":
    case "string":
    case "number":
    case "boolean":
      return spec.type;
    case "array": {
      // Prefer Array<T> style to match ViewObject output
      return `Array<${formatShape(spec.items, indent)}>`;
    }
    case "object": {
      const entries = Object.entries(spec.properties);
      if (entries.length === 0) return "{}";
      const lines = entries.map(([key, val], idx) => {
        const optional = val.optional ? "?" : "";
        const comma = idx < entries.length - 1 ? "," : "";
        // Recurse with increased indent for nested structures
        const rendered = formatShape(val, indent + 1);
        return `${pad(indent + 1)}${key}${optional}: ${rendered}${comma}`;
      });
      return `{\n${lines.join("\n")}\n${pad(indent)}}`;
    }
    default:
      return "unknown";
  }
}

function renderExpectedShape(spec?: JsonShapeSpec): React.ReactElement {
  const pretty = formatShape(spec);
  return (
    <div
      className="relative z-[9999] w-[420px] max-w-[90vw] rounded-lg border border-border bg-popover shadow-lg"
      role="alert"
    >
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <div className="h-5 w-5 rounded-full bg-destructive/15 text-destructive flex items-center justify-center text-[10px] font-bold">
          !
        </div>
        <div className="text-sm font-semibold">JSON shape mismatch</div>
      </div>
      <div className="px-3 py-2">
        <div className="text-xs text-muted-foreground mb-1">Expected</div>
        <pre className="font-mono text-xs whitespace-pre leading-snug p-2 rounded-md border border-border bg-background/60">
          {pretty}
        </pre>
      </div>
    </div>
  );
}

/**
 * Check if a source JSON shape satisfies a target JSON shape contract.
 * This is purely shape-to-shape (spec-only) – no runtime values required.
 */
function shapeSatisfies(source: JsonShapeSpec | undefined, target: JsonShapeSpec | undefined): boolean {
  if (!target) return true; // nothing required
  if (!source) return false; // unknown source shape cannot guarantee target

  // Any satisfies everything
  if (source.type === "any" || target.type === "any") return true;

  // Exact primitive compatibility
  const primitiveTypes = new Set(["string", "number", "boolean", "null"]);
  if (primitiveTypes.has(target.type)) {
    return source.type === target.type;
  }

  // Arrays
  if (target.type === "array") {
    if (source.type !== "array") return false;
    return shapeSatisfies(source.items, target.items);
  }

  // Objects
  if (target.type === "object") {
    if (source.type !== "object") return false;
    // For every target property: if required, it must exist in source and satisfy recursively
    for (const [key, subTarget] of Object.entries(target.properties)) {
      const subSource = source.properties[key];
      const isRequired = !subTarget.optional;
      if (!subSource) {
        if (isRequired) return false;
        continue; // optional target property can be missing
      }
      if (!shapeSatisfies(subSource, subTarget)) return false;
    }
    return true;
  }

  return true;
}

export const useUltimateFlowConnectionPrevention = (options?: {
  targetJsonShape?: JsonShapeSpec;
  acceptAnyJson?: boolean;
}) => {
  const storeApi = useStoreApi();
  const isValidConnection: IsValidConnection = useCallback(
    (connection) => {
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
        if (
          !toastThrottle[key] ||
          now - toastThrottle[key] > TOAST_DEBOUNCE_MS
        ) {
          const sourceLabel = getHumanReadableType(sourceDataType);
          const targetLabel = getHumanReadableType(targetDataType);
          toast.error(TOAST_ERROR_TITLE, {
            description: TOAST_ERROR_DESCRIPTION_TEMPLATE.replace(
              "{source}",
              sourceLabel
            ).replace("{target}", targetLabel),
            duration: TOAST_DURATION,
          });
          toastThrottle[key] = now;
        }
      }

    // Optional JSON shape enforcement (resolve target shape dynamically if not provided)
    try {
      const { nodes } = storeApi.getState();
      // Compute target handle shape if not explicitly provided
      let targetJsonShape: JsonShapeSpec | undefined = options?.targetJsonShape;
      let targetAcceptAny: boolean = Boolean(options?.acceptAnyJson);
      try {
        if (!targetJsonShape || targetAcceptAny === undefined) {
          const tgtNode = nodes.find((n: any) => n.id === connection.target);
          const tgtType: string | undefined = tgtNode?.type;
          if (tgtType && connection.targetHandle) {
            const rawTgtId = connection.targetHandle.split("__")[0];
            const cleanTgtHandle = normalizeHandleId(connection.targetHandle);
            const meta = getNodeSpecMetadata(tgtType);
            const specHandle = meta?.handles?.find?.(
              (h: any) => h?.id === rawTgtId || h?.id === cleanTgtHandle
            ) as any;
            if (specHandle) {
              targetJsonShape = targetJsonShape ?? (specHandle.jsonShape as JsonShapeSpec | undefined);
              targetAcceptAny = targetAcceptAny || Boolean(specHandle.acceptAnyJson);
            }
          }
        }
      } catch {
        // Ignore metadata lookup errors; best-effort only
      }

      const wantsShape =
        Boolean(targetJsonShape) &&
        !targetAcceptAny &&
        (targetDataType?.toLowerCase().startsWith("j") ||
          targetDataType?.toLowerCase() === "json");
      const isJsonSource =
        sourceDataType?.toLowerCase().startsWith("j") ||
        sourceDataType?.toLowerCase() === "json";
      if (wantsShape && isJsonSource) {
        // SPEC-ONLY STRICT GATE: Block if source shape is unknown or incompatible
        try {
          const srcNode = nodes.find((n: any) => n.id === connection.source);
          const srcType: string | undefined = srcNode?.type;
          let sourceShape: JsonShapeSpec | undefined;
          if (srcType && connection.sourceHandle) {
            const rawSrcId = connection.sourceHandle.split("__")[0];
            const cleanSrcId = normalizeHandleId(connection.sourceHandle);
            const srcMeta = getNodeSpecMetadata(srcType);
            const srcHandle = srcMeta?.handles?.find?.(
              (h: any) => h?.id === rawSrcId || h?.id === cleanSrcId
            ) as any;
            if (srcHandle) {
              sourceShape = srcHandle.jsonShape as JsonShapeSpec | undefined;
              const srcAcceptAny = Boolean(srcHandle.acceptAnyJson);
              if (srcAcceptAny) {
                // Unknown/any shape → cannot guarantee target contract
                const key = `json-shape-spec:any->target:${targetDataType}`;
                const now = Date.now();
                if (!toastThrottle[key] || now - toastThrottle[key] > TOAST_DEBOUNCE_MS) {
              toast.custom(() => renderExpectedShape(targetJsonShape), {
                duration: TOAST_DURATION,
              });
                  toastThrottle[key] = now;
                }
                return false;
              }
            }
          }

          if (!shapeSatisfies(sourceShape, targetJsonShape)) {
            const key = `json-shape-spec:${sourceDataType}->${targetDataType}`;
            const now = Date.now();
            if (!toastThrottle[key] || now - toastThrottle[key] > TOAST_DEBOUNCE_MS) {
              toast.custom(() => renderExpectedShape(targetJsonShape), {
                duration: TOAST_DURATION,
              });
              toastThrottle[key] = now;
            }
            return false;
          }
        } catch {
          // If spec lookup fails, block in strict mode
          const key = `json-shape-spec-unknown:${sourceDataType}->${targetDataType}`;
          const now = Date.now();
          if (!toastThrottle[key] || now - toastThrottle[key] > TOAST_DEBOUNCE_MS) {
            toast.custom(() => renderExpectedShape(targetJsonShape), {
              duration: TOAST_DURATION,
            });
            toastThrottle[key] = now;
          }
          return false;
        }

        const src = nodes.find((n: any) => n.id === connection.source);
        const output = (src?.data?.output ?? {}) as Record<string, unknown>;
        const cleanSrcHandle = sourceHandle
          ? normalizeHandleId(sourceHandle)
          : "output";
        let candidate =
          output[cleanSrcHandle] ?? output.output ?? Object.values(output)[0];
        // Fallback to source data field if map not present
        if (candidate === undefined && src?.data) {
          candidate = (src.data as Record<string, unknown>)[cleanSrcHandle];
        }
        if (candidate !== undefined && isJson(candidate)) {
          const ok = conformsToShape(candidate, targetJsonShape);
          if (!ok) {
            const key = `json-shape:${sourceDataType}->${targetDataType}`;
            const now = Date.now();
            if (!toastThrottle[key] || now - toastThrottle[key] > TOAST_DEBOUNCE_MS) {
              toast.custom(() => renderExpectedShape(targetJsonShape), {
                duration: TOAST_DURATION,
              });
              toastThrottle[key] = now;
            }
            return false;
          }
        }
      }
    } catch {
      // Best effort – do not block if inspection fails
    }

      return compatible;
    },
    [storeApi, options?.targetJsonShape, options?.acceptAnyJson]
  );
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
  /** Optional custom tooltip text to append to default tooltip */
  customTooltip?: string;
  /** Optional JSON shape for target validation */
  jsonShape?: JsonShapeSpec;
  /** If true, bypass JSON shape checks */
  acceptAnyJson?: boolean;
}

const UltimateTypesafeHandle: React.FC<UltimateTypesafeHandleProps> = memo(
  ({
    // eslint-disable-line @typescript-eslint/no-explicit-any
    dataType,
    tsSymbol,
    code,
    nodeId,
    handleIndex = 0,
    totalHandlesOnSide = 1,
    customTooltip,
    jsonShape,
    acceptAnyJson,
    ...props
  }) => {
    // Memoize handle type name calculation, basically prevent recalculation on re-renders
    const handleTypeName = useMemo(
      () => getHandleTypeName(tsSymbol, dataType, code),
      [tsSymbol, dataType, code]
    );

    // Memoize type display calculation, basically prevent recalculation of icon and color
    const typeDisplay = useMemo(
      () => getTypeDisplay(handleTypeName),
      [handleTypeName]
    );

    const { isValidConnection } = useUltimateFlowConnectionPrevention({
      targetJsonShape: props.type === "target" ? jsonShape : undefined,
      acceptAnyJson: props.type === "target" ? Boolean(acceptAnyJson) : false,
    });

    // Subscribe only to edges reference; compute connection state when edges actually change
    const edgesRef = useStore((state) => state.edges);
    const isConnected = useMemo(() => {
      try {
        return edgesRef.some((edge: any) =>
          props.type === "source"
            ? edge.source === nodeId && edge.sourceHandle === props.id
            : edge.target === nodeId && edge.targetHandle === props.id
        );
      } catch {
        return false;
      }
    }, [edgesRef, nodeId, props.id, props.type]);

    const isSource = props.type === "source";
    const connectableStart = isSource; // only sources can start connections
    const connectableEnd = !isSource; // only targets can end connections

    // Memoize background color calculation, basically prevent recalculation based on connection state
    const backgroundColor = useMemo(
      () => getHandleBackgroundColor(isConnected, isSource),
      [isConnected, isSource]
    );

    // Memoize injectable classes based on handle state, basically prevent CSS class recalculation
    const { baseClasses, stateClasses } = useMemo(
      () => ({
        baseClasses: getInjectableClasses("--core-handle-classes-base"),
        stateClasses: isConnected
          ? getInjectableClasses("--core-handle-classes-connected")
          : isSource
            ? getInjectableClasses("--core-handle-classes-source")
            : getInjectableClasses("--core-handle-classes-target"),
      }),
      [isConnected, isSource]
    );

    // Memoize font weight classes for output handles, basically make outputs bolder
    const fontWeightClasses = useMemo(
      () => (isSource ? "font-black" : "font-semibold"), // Output handles get black font weight, inputs get semibold
      [isSource]
    );

    // Avoid subscribing to the entire nodes/edges arrays which causes frequent re-renders.
    // Instead, compute dynamic tooltip data only when the tooltip opens using store API.
    const storeApi = useStoreApi();
    const [isTooltipOpen, setIsTooltipOpen] = React.useState(false);
    const [dynamicTooltipSuffix, setDynamicTooltipSuffix] =
      React.useState<string>("");
    const { showError: showNodeError, showSuccess: showNodeSuccess } = usePerNodeToast(nodeId || "");

    const baseTooltip = useMemo(() => {
      const defaultTip = getTooltipContent(
        props.type || "target",
        dataType,
        code,
        tsSymbol
      );
      // If a custom label is provided, prepend it but keep direction/type for clarity
      // [Explanation], basically show label first, then IN/OUT + type, then dynamic value
      return customTooltip ? `${customTooltip}<br/>${defaultTip}` : defaultTip;
    }, [customTooltip, props.type, dataType, code, tsSymbol]);

    React.useEffect(() => {
      if (!isTooltipOpen) {
        // Clear when closed to avoid stale info and memory churn
        setDynamicTooltipSuffix("");
        return;
      }
      try {
        const { nodes, edges } = storeApi.getState();
        const cleanId = props.id ? normalizeHandleId(props.id) : "";
        let suffix = "";
        if (props.type === "source") {
          const selfNode = nodes.find((n: any) => n.id === nodeId);
          const dataRecord = selfNode?.data as
            | Record<string, unknown>
            | undefined;
          const rawOut = (dataRecord as any)?.output as unknown;
          let value: unknown = undefined;
          if (rawOut && typeof rawOut === "object" && !Array.isArray(rawOut)) {
            const out = rawOut as Record<string, unknown>;
            value = out[cleanId] ?? out["output"] ?? Object.values(out)[0];
          } else {
            // [Explanation], basically prefer handle-specific fields (e.g., messages) over generic output
            const handleSpecific =
              dataRecord?.[cleanId] ??
              (props.id ? dataRecord?.[props.id as string] : undefined);
            value = handleSpecific !== undefined ? handleSpecific : rawOut;
          }
          const parts: string[] = [];
          if (value !== undefined) {
            parts.push(`value: ${escapeHtml(summarizeValueForTooltip(value))}`);
          }
          const outgoingCount = edges.filter(
            (e: any) => e.source === nodeId && e.sourceHandle === props.id
          ).length;
          if (outgoingCount > 0) {
            parts.push(`sending to ${outgoingCount}`);
          }
          if (parts.length > 0) suffix = `<br/>${escapeHtml(parts.join(", "))}`;
        } else if (props.type === "target") {
          const incoming = edges.filter(
            (e: any) => e.target === nodeId && e.targetHandle === props.id
          );
          if (incoming.length > 0) {
            const first = incoming[0];
            const src = nodes.find((n: any) => n.id === first.source);
            const srcData = src?.data as Record<string, unknown> | undefined;
            const rawOutput = (srcData as any)?.output as unknown;
            let value: unknown = undefined;
            if (
              rawOutput &&
              typeof rawOutput === "object" &&
              !Array.isArray(rawOutput)
            ) {
              const outObj = rawOutput as Record<string, unknown>;
              const srcHandleId = first.sourceHandle
                ? normalizeHandleId(first.sourceHandle)
                : "output";
              value = outObj[srcHandleId] ?? Object.values(outObj)[0];
            }
            if (value === undefined) {
              // [Explanation], basically fallback to source's handle-specific field or raw output
              const srcHandleId = first.sourceHandle
                ? normalizeHandleId(first.sourceHandle)
                : undefined;
              const specific = srcHandleId ? srcData?.[srcHandleId] : undefined;
              value = specific !== undefined ? specific : rawOutput;
            }
            if (value !== undefined) {
              const prefix =
                incoming.length > 1
                  ? `${incoming.length} inputs, first: `
                  : "receiving: ";
              suffix = `<br/>${escapeHtml(prefix)}${escapeHtml(summarizeValueForTooltip(value))}`;
            } else if (incoming.length > 1) {
              suffix = `<br/>${incoming.length} inputs`;
            }
          }
        }
        setDynamicTooltipSuffix(suffix);
      } catch {
        // Swallow errors; tooltip is best-effort
        setDynamicTooltipSuffix("");
      }
      // Recompute only when opened or handle identity/context changes
    }, [isTooltipOpen, nodeId, props.id, props.type, storeApi]);

    /**
     * Show success toast when a new connection is made to a target handle
     * [Explanation], basically detect increase in incoming edges and show a type-specific success message
     */
    const prevIncomingCountRef = React.useRef<number>(0);
    React.useEffect(() => {
      if (props.type !== "target") return;
      try {
        const incoming = edgesRef.filter(
          (e: any) => e.target === nodeId && e.targetHandle === props.id
        );
        const count = incoming.length;
        const prev = prevIncomingCountRef.current;
        if (count > prev) {
          const typeKey = resolveMessageKey(handleTypeName, dataType, code);
          const msg = INPUT_SUCCESS_MESSAGES[typeKey] || INPUT_SUCCESS_MESSAGES.any;
          const key = `success-connect:${nodeId}:${props.id}:${typeKey}`;
          const now = Date.now();
          if (!toastThrottle[key] || now - toastThrottle[key] > TOAST_DEBOUNCE_MS) {
            showNodeSuccess(msg.title, msg.description);
            toastThrottle[key] = now;
          }
        }
        prevIncomingCountRef.current = count;
      } catch {
        // ignore
      }
      // Depend on edges reference changes; react-flow store returns new arrays on changes
    }, [edgesRef, nodeId, props.id, props.type, handleTypeName, showNodeSuccess]);

    // Runtime shape re-validation to surface warnings when upstream output changes
    React.useEffect(() => {
      if (props.type !== "target") return;
      const shape: JsonShapeSpec | undefined = jsonShape;
      const allowAny = Boolean(acceptAnyJson);
      if (!shape || allowAny) return;

      try {
        const { nodes, edges } = storeApi.getState();
        const incoming = edges.filter(
          (e: any) => e.target === nodeId && e.targetHandle === props.id
        );
        if (incoming.length === 0) return;
        const first = incoming[0];
        const src = nodes.find((n: any) => n.id === first.source);
        const output = (src?.data?.output ?? {}) as Record<string, unknown>;
        const srcHandleId = first.sourceHandle
          ? normalizeHandleId(first.sourceHandle)
          : "output";
        let candidate = output[srcHandleId] ?? output.output ?? Object.values(output)[0];
        if (candidate === undefined && src?.data) {
          candidate = (src.data as Record<string, unknown>)[srcHandleId];
        }
        if (candidate !== undefined && isJson(candidate)) {
          const ok = conformsToShape(candidate, shape);
          if (!ok) {
            const key = `json-shape-runtime:${nodeId}:${props.id}`;
            const now = Date.now();
            if (!toastThrottle[key] || now - toastThrottle[key] > TOAST_DEBOUNCE_MS) {
              // Global toast and node-local toast for visibility
              toast.custom(() => renderExpectedShape(shape), {
                duration: TOAST_DURATION,
              });
              if (showNodeError) {
                showNodeError("JSON shape mismatch", formatShape(shape));
              }
              toastThrottle[key] = now;
            }
          }
        }
      } catch {
        // ignore
      }
    }, [storeApi, nodeId, props.id, props.type, jsonShape, acceptAnyJson]);

    const tooltipContent = useMemo(
      () => `${baseTooltip}${dynamicTooltipSuffix}`,
      [baseTooltip, dynamicTooltipSuffix]
    );

    // Memoize the icon component to prevent re-creation on re-renders, basically stable icon reference
    const MemoizedIconComponent = useMemo(
      () => typeDisplay.iconComponent,
      [typeDisplay.iconComponent]
    );

    // Memoize position offset calculation, basically prevent recalculation of positioning
    const positionOffset = useMemo(
      () => getPositionOffset(props.position, handleIndex, totalHandlesOnSide),
      [props.position, handleIndex, totalHandlesOnSide]
    );

    // Memoize complete handle styles, basically prevent style object recreation
    const handleStyles = useMemo(
      () => ({
        width: HANDLE_SIZE_PX,
        height: HANDLE_SIZE_PX,
        borderWidth: 0.5, // Set visible border width for dashed/solid styles
        boxShadow: `${UNIFIED_HANDLE_STYLES.border.shadow} ${typeDisplay.color}`,
        borderColor: typeDisplay.color,
        borderStyle: isSource ? "solid" : "dashed", // Input handles get dashed border, outputs get solid
        color: typeDisplay.color,
        backgroundColor,
        pointerEvents: "all" as const, // Ensure pointer events work for both input and output handles
        display: "flex" as const,
        alignItems: "center" as const,
        justifyContent: "center" as const,
        lineHeight: "1",
        fontWeight: isSource ? "900" : "600", // Make output handles bolder, basically thicker text for outputs
        ...positionOffset, // Apply smart positioning
        ...props.style,
      }),
      [
        typeDisplay.color,
        backgroundColor,
        positionOffset,
        props.style,
        isSource,
      ]
    );

    return (
      <Tooltip
        delayDuration={100}
        open={isTooltipOpen}
        onOpenChange={setIsTooltipOpen}
      >
        <TooltipTrigger asChild>
          <Handle
            id={props.id}
            type={props.type as HandleProps["type"]}
            position={props.position as HandleProps["position"]}
            className={`${UNIFIED_HANDLE_STYLES.base} ${baseClasses} ${stateClasses} ${fontWeightClasses}`}
            style={handleStyles}
            isValidConnection={isValidConnection}
            isConnectableStart={connectableStart}
            isConnectableEnd={connectableEnd}
          >
            {MemoizedIconComponent && (
              <MemoizedIconComponent
                width={8}
                height={8}
                style={{
                  pointerEvents: "none",
                  fontWeight: isSource ? "900" : "600", // Make output handle icons bolder too
                }}
              />
            )}
          </Handle>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs select-none">
          <div dangerouslySetInnerHTML={{ __html: tooltipContent }} />
        </TooltipContent>
      </Tooltip>
    );
  }
);

// Set display name for better debugging and dev tools
UltimateTypesafeHandle.displayName = "UltimateTypesafeHandle";

const TypeSafeHandle = UltimateTypesafeHandle;
export default TypeSafeHandle;

export { isTypeCompatible, parseUnionTypes, ULTIMATE_TYPE_MAP };
