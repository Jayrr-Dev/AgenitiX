/**
 * REACT FLOW CONNECTION PREVENTION - Simple integration to prevent mistype connections
 *
 * • Integrates with React Flow to prevent invalid connections
 * • Simple validation logic without complex type handling
 * • Visual feedback for users when connections are blocked
 * • Toast notifications explaining why connections fail
 *
 * Keywords: React-Flow, connection-prevention, type-validation, user-feedback
 */

import { Connection, useReactFlow } from "@xyflow/react";
import React, { useCallback } from "react";

// ===== SIMPLE TYPE COMPATIBILITY =====

const TYPE_COMPATIBILITY_RULES: Record<string, string[]> = {
  s: ["s", "j", "x"], // String can connect to String, JSON, Any
  n: ["n", "f", "x"], // Number can connect to Number, Float, Any
  b: ["b", "x"], // Boolean can connect to Boolean, Any
  j: ["j", "s", "a", "x"], // JSON can connect to JSON, String, Array, Any
  a: ["a", "j", "x"], // Array can connect to Array, JSON, Any
  f: ["f", "n", "x"], // Float can connect to Float, Number, Any
  N: ["N", "x"], // BigInt can connect to BigInt, Any
  u: ["u", "x"], // Undefined can connect to Undefined, Any
  S: ["S", "x"], // Symbol can connect to Symbol, Any
  "∅": ["∅", "x"], // Null can connect to Null, Any
  x: ["s", "n", "b", "j", "a", "f", "N", "u", "S", "∅", "x"], // Any accepts all
};

const TYPE_LABELS: Record<string, string> = {
  s: "String",
  n: "Number",
  b: "Boolean",
  j: "JSON",
  a: "Array",
  f: "Float",
  N: "BigInt",
  u: "Undefined",
  S: "Symbol",
  "∅": "Null",
  x: "Any",
};

/**
 * Check if source type can connect to target type
 */
function isTypeCompatible(sourceType: string, targetType: string): boolean {
  const compatibleTargets = TYPE_COMPATIBILITY_RULES[sourceType] || [];
  return compatibleTargets.includes(targetType);
}

/**
 * Get handle type from node registry
 */
function getHandleDataType(
  nodeId: string,
  handleId: string,
  handleType: "source" | "target"
): string | null {
  try {
    // Get the node from React Flow
    const flowInstance = (window as any).__reactFlowInstance;
    if (!flowInstance) return null;

    const node = flowInstance.getNodes().find((n: any) => n.id === nodeId);
    if (!node) return null;

    // Try to get handles from registry
    const registry = require("../node-registry/nodeRegistry");
    const handles = registry.getNodeHandles(node.type);

    const handle = handles.find(
      (h: any) => h.id === handleId && h.type === handleType
    );
    return handle?.dataType || null;
  } catch (error) {
    console.warn(
      "[FlowConnectionPrevention] Failed to get handle type:",
      error
    );
    return null;
  }
}

/**
 * Show user feedback when connection is blocked
 */
function showBlockedConnectionToast(sourceType: string, targetType: string) {
  const sourceLabel = TYPE_LABELS[sourceType] || sourceType;
  const targetLabel = TYPE_LABELS[targetType] || targetType;
  const compatibleTypes = TYPE_COMPATIBILITY_RULES[sourceType] || [];
  const compatibleLabels = compatibleTypes
    .map((t) => TYPE_LABELS[t] || t)
    .join(", ");

  const toast = document.createElement("div");
  toast.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: #fee2e2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 16px;
      max-width: 320px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      z-index: 9999;
      font-family: system-ui, -apple-system, sans-serif;
      animation: slideIn 0.3s ease-out;
    ">
      <div style="color: #991b1b; font-weight: 600; margin-bottom: 8px;">
        🚫 Connection Blocked
      </div>
      <div style="color: #7f1d1d; font-size: 14px; margin-bottom: 8px;">
        Cannot connect <strong>${sourceLabel}</strong> to <strong>${targetLabel}</strong>
      </div>
      <div style="color: #991b1b; font-size: 12px;">
        <strong>${sourceLabel}</strong> can connect to: ${compatibleLabels}
      </div>
    </div>
  `;

  // Add animation styles
  if (!document.getElementById("connection-toast-styles")) {
    const styles = document.createElement("style");
    styles.id = "connection-toast-styles";
    styles.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(styles);
  }

  document.body.appendChild(toast);

  // Remove after 4 seconds
  setTimeout(() => {
    toast.style.animation = "slideOut 0.3s ease-in";
    setTimeout(() => document.body.removeChild(toast), 300);
  }, 4000);
}

// ===== MAIN HOOK =====

/**
 * Hook for preventing mistype connections in React Flow
 */
export function useFlowConnectionPrevention() {
  const reactFlow = useReactFlow();

  // Store React Flow instance globally for helper functions
  React.useEffect(() => {
    (window as any).__reactFlowInstance = reactFlow;
    return () => {
      delete (window as any).__reactFlowInstance;
    };
  }, [reactFlow]);

  /**
   * Validate connection before it's created
   */
  const isValidConnection = useCallback((connection: Connection): boolean => {
    const { source, sourceHandle, target, targetHandle } = connection;

    // Basic validation
    if (!source || !sourceHandle || !target || !targetHandle) {
      console.warn("[FlowConnectionPrevention] Missing connection data");
      return false;
    }

    // Get handle types
    const sourceType = getHandleDataType(source, sourceHandle, "source");
    const targetType = getHandleDataType(target, targetHandle, "target");

    // If we can't determine types, allow connection (graceful fallback)
    if (!sourceType || !targetType) {
      console.warn(
        "[FlowConnectionPrevention] Could not determine handle types, allowing connection"
      );
      return true;
    }

    // Check compatibility
    const isCompatible = isTypeCompatible(sourceType, targetType);

    // Show feedback if blocked
    if (!isCompatible) {
      console.info(
        `[FlowConnectionPrevention] Blocked: ${sourceType} → ${targetType}`
      );
      showBlockedConnectionToast(sourceType, targetType);
    }

    return isCompatible;
  }, []);

  return {
    isValidConnection,
  };
}

export default useFlowConnectionPrevention;
