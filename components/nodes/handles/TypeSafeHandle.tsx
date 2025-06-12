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
} from "@xyflow/react";
import React, { useCallback } from "react";
import { toast } from "sonner";
import Ajv from "ajv";
// Auto-generated at build time (can be empty in dev before first build)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore – file is generated post-install / build
import schemaManifest from "@/generated/handle-types.manifest.json";

// ---------------------------------------------------------------------------
// DISPLAY MAP – maps basic type names to icon text + colour
// ---------------------------------------------------------------------------
const DISPLAY_MAP: Record<string, { icon: string; color: string }> = {
  string: { icon: "A", color: "#3b82f6" },
  number: { icon: "#", color: "#f59e42" },
  boolean: { icon: "✓", color: "#10b981" },
  object: { icon: "{}", color: "#6366f1" },
  array: { icon: "[]", color: "#f472b6" },
  any: { icon: "?", color: "#6b7280" },
  json: { icon: "J", color: "#6366f1" },
};

const HANDLE_SIZE_PX = 10

const ajv = new Ajv({ allErrors: false, strict: false });

const ULTIMATE_TYPE_MAP: Record<string, any> = {
  s: { color: "#3b82f6", label: "string" },
  n: { color: "#f59e42", label: "number" },
  b: { color: "#10b981", label: "boolean" },
  j: { color: "#6366f1", label: "json" },
  a: { color: "#f472b6", label: "array" },
  x: { color: "#6b7280", label: "any" },
  V: { color: "#8b5cf6", label: "Vibe" },
};

function parseUnionTypes(typeStr?: string | null): string[] {
  if (!typeStr) return ["x"];
  return typeStr.split("|").map(t => t.trim());
}

function isTypeCompatible(sourceType: string, targetType: string): boolean {
    if (sourceType === 'x' || targetType === 'x') return true;
    const sourceTypes = parseUnionTypes(sourceType);
    const targetTypes = parseUnionTypes(targetType);
    return sourceTypes.some(s => targetTypes.includes(s));
}

// Simple debounce map to avoid toast spam
const toastThrottle: Record<string, number> = {};
const TOAST_DEBOUNCE_MS = 2000;

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
            toast.error("Incompatible connection", {
              description: `Cannot connect type '${sourceDataType}' to '${targetDataType}'.`,
              duration: 3000,
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
  ...props
}) => {
  const handleTypeName = tsSymbol
    ? tsSymbol.split(".").pop() // last segment for display
    : ULTIMATE_TYPE_MAP[parseUnionTypes(dataType || code)[0]]?.label || "any";

  const badge = DISPLAY_MAP[handleTypeName.toLowerCase()] || DISPLAY_MAP.any;

  const { isValidConnection } = useUltimateFlowConnectionPrevention();

  const isSource = props.type === 'source';
  const connectableStart = isSource; // only sources can start connections
  const connectableEnd = !isSource;  // only targets can end connections

  return (
    <Handle
      {...(props as HandleProps)}
      className="flex items-center justify-center rounded-sm text-[8px] font-bold uppercase select-none z-30 hover:text-white hover:bg-current"
      style={{
        width: HANDLE_SIZE_PX,
        height: HANDLE_SIZE_PX,
        borderWidth: 0,
        boxShadow: "0 0 0.5px 0.5px " + badge.color,
        borderColor: badge.color,
        color: badge.color,
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