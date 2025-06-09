/**
 * CONNECTION PREVENTION SYSTEM - Makes mistype connections impossible
 *
 * • Proactive validation before connections are created
 * • Visual feedback for compatible/incompatible handles
 * • Real-time compatibility checking during drag operations
 * • Integration with React Flow's connection lifecycle
 * • Enhanced UX with tooltips and visual indicators
 *
 * Keywords: connection-prevention, type-safety, visual-feedback, drag-validation,
 * real-time-checking, UX-enhancement, React-Flow-integration
 */

import { Connection, Node, OnConnectStart, useReactFlow } from "@xyflow/react";
import { useCallback, useState } from "react";
import superjson from "superjson";
import { getHandleConfig } from "./handleConfig";

// ===== TYPES =====

interface ConnectionState {
  isDragging: boolean;
  sourceNode: string | null;
  sourceHandle: string | null;
  sourceType: string | null;
  compatibleTargets: Set<string>;
  incompatibleTargets: Map<string, string>; // handle -> reason
}

interface CompatibilityInfo {
  isCompatible: boolean;
  reason: string;
  confidence: "high" | "medium" | "low";
  suggestedTypes?: string[];
}

// ===== SUPERJSON UTILITIES =====

/**
 * Serialize connection state for persistence or debugging
 */
function serializeConnectionState(state: ConnectionState): string {
  return superjson.stringify(state);
}

/**
 * Deserialize connection state from stored data
 */
function deserializeConnectionState(serialized: string): ConnectionState {
  return superjson.parse(serialized);
}

/**
 * Create a deep copy of connection state using superjson serialization
 */
function cloneConnectionState(state: ConnectionState): ConnectionState {
  return superjson.parse(superjson.stringify(state));
}

// ===== ENHANCED COMPATIBILITY CHECKING =====

/**
 * Check if two handles can be connected with detailed reasoning
 */
function checkHandleCompatibility(
  sourceType: string,
  targetType: string,
  sourceNode?: Node,
  targetNode?: Node
): CompatibilityInfo {
  const config = getHandleConfig();

  // Universal compatibility: 'x' (any) accepts anything
  if (sourceType === "x" || targetType === "x") {
    return {
      isCompatible: true,
      reason: `Universal compatibility (${sourceType === "x" ? "source" : "target"} accepts any type)`,
      confidence: "high",
    };
  }

  // Exact type match
  if (sourceType === targetType) {
    return {
      isCompatible: true,
      reason: `Exact type match (${sourceType})`,
      confidence: "high",
    };
  }

  // Enhanced compatibility rules (only if enabled)
  if (config.experimental.enhancedCompatibilityRules) {
    // String and JSON compatibility
    if (
      (sourceType === "s" && targetType === "j") ||
      (sourceType === "j" && targetType === "s")
    ) {
      return {
        isCompatible: true,
        reason: `String-JSON compatibility (${sourceType} → ${targetType})`,
        confidence: "medium",
      };
    }

    // Number and Float compatibility
    if (
      (sourceType === "n" && targetType === "f") ||
      (sourceType === "f" && targetType === "n")
    ) {
      return {
        isCompatible: true,
        reason: `Number-Float compatibility (${sourceType} → ${targetType})`,
        confidence: "medium",
      };
    }

    // Array and JSON compatibility (lower confidence)
    if (
      (sourceType === "a" && targetType === "j") ||
      (sourceType === "j" && targetType === "a")
    ) {
      return {
        isCompatible: true,
        reason: `Array-JSON compatibility (${sourceType} → ${targetType})`,
        confidence: "low",
      };
    }
  }

  // Suggest compatible types
  const compatibleTypes = getCompatibleTypes(sourceType);

  return {
    isCompatible: false,
    reason: `Type mismatch: cannot connect ${getTypeLabel(sourceType)} to ${getTypeLabel(targetType)}`,
    confidence: "high",
    suggestedTypes: compatibleTypes,
  };
}

/**
 * Get all types compatible with the given source type
 */
function getCompatibleTypes(sourceType: string): string[] {
  const config = getHandleConfig();
  const compatible = ["x"]; // 'any' always compatible

  // Add exact match
  compatible.push(sourceType);

  // Add enhanced compatibility if enabled
  if (config.experimental.enhancedCompatibilityRules) {
    switch (sourceType) {
      case "s":
        compatible.push("j");
        break;
      case "j":
        compatible.push("s", "a");
        break;
      case "n":
        compatible.push("f");
        break;
      case "f":
        compatible.push("n");
        break;
      case "a":
        compatible.push("j");
        break;
    }
  }

  return Array.from(new Set(compatible));
}

/**
 * Get human-readable type labels
 */
function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    s: "String",
    n: "Number",
    b: "Boolean",
    j: "JSON",
    a: "Array",
    N: "BigInt",
    f: "Float",
    x: "Any",
    u: "Undefined",
    S: "Symbol",
    "∅": "Null",
  };
  return labels[type] || "Unknown";
}

// ===== CONNECTION PREVENTION HOOK =====

/**
 * Hook that provides connection prevention functionality
 */
export function useConnectionPrevention() {
  const { getNodes, getEdges } = useReactFlow();
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isDragging: false,
    sourceNode: null,
    sourceHandle: null,
    sourceType: null,
    compatibleTargets: new Set(),
    incompatibleTargets: new Map(),
  });

  /**
   * Get handle type from node registry
   */
  const getHandleType = useCallback(
    (
      nodeId: string,
      handleId: string,
      handleType: "source" | "target"
    ): string | null => {
      try {
        const nodes = getNodes();
        const node = nodes.find((n) => n.id === nodeId);
        if (!node) return null;

        // Try to get from node registry
        const registry = require("../node-registry/nodeRegistry");
        const handles = registry.getNodeHandles(node.type);

        const handle = handles.find(
          (h: any) => h.id === handleId && h.type === handleType
        );
        return handle?.dataType || null;
      } catch (error) {
        console.warn(
          "[ConnectionPrevention] Failed to get handle type:",
          error
        );
        return null;
      }
    },
    [getNodes]
  );

  /**
   * Calculate compatible targets for current drag operation
   */
  const calculateCompatibleTargets = useCallback(
    (
      sourceNodeId: string,
      sourceHandleId: string,
      sourceType?: string | null
    ): {
      compatible: Set<string>;
      incompatible: Map<string, string>;
    } => {
      const actualSourceType =
        sourceType || getHandleType(sourceNodeId, sourceHandleId, "source");
      if (!actualSourceType)
        return {
          compatible: new Set<string>(),
          incompatible: new Map<string, string>(),
        };

      const nodes = getNodes();
      const compatible = new Set<string>();
      const incompatible = new Map<string, string>();

      nodes.forEach((node) => {
        if (node.id === sourceNodeId) return; // Skip self

        // Get all target handles for this node
        try {
          const registry = require("../node-registry/nodeRegistry");
          const handles = registry.getNodeHandles(node.type);

          handles.forEach((handle: any) => {
            if (handle.type !== "target") return;

            const targetKey = `${node.id}-${handle.id}`;
            const compatibility = checkHandleCompatibility(
              actualSourceType,
              handle.dataType,
              undefined,
              node
            );

            if (compatibility.isCompatible) {
              compatible.add(targetKey);
            } else {
              incompatible.set(targetKey, compatibility.reason);
            }
          });
        } catch (error) {
          console.warn(
            "[ConnectionPrevention] Failed to check node handles:",
            error
          );
        }
      });

      return { compatible, incompatible };
    },
    [getNodes, getHandleType]
  );

  /**
   * Handle connection start (when user starts dragging)
   */
  const onConnectStart: OnConnectStart = useCallback(
    (event, { nodeId, handleId, handleType }) => {
      if (handleType !== "source" || !handleId || !nodeId) return;

      const sourceType = getHandleType(nodeId, handleId as string, "source");
      const { compatible, incompatible } = calculateCompatibleTargets(
        nodeId,
        handleId as string,
        sourceType
      );

      setConnectionState({
        isDragging: true,
        sourceNode: nodeId,
        sourceHandle: handleId,
        sourceType,
        compatibleTargets: compatible,
        incompatibleTargets: incompatible,
      });

      // Add visual classes to DOM elements
      requestAnimationFrame(() => {
        // Highlight compatible targets
        Array.from(compatible).forEach((targetKey) => {
          const [nodeId, handleId] = targetKey.split("-");
          const element = document.querySelector(
            `[data-nodeid="${nodeId}"] [data-handleid="${handleId}"]`
          );
          if (element) {
            element.classList.add("handle-compatible-target");
          }
        });

        // Dim incompatible targets
        Array.from(incompatible.entries()).forEach(([targetKey, reason]) => {
          const [nodeId, handleId] = targetKey.split("-");
          const element = document.querySelector(
            `[data-nodeid="${nodeId}"] [data-handleid="${handleId}"]`
          );
          if (element) {
            element.classList.add("handle-incompatible-target");
            element.setAttribute("data-incompatible-reason", reason);
          }
        });
      });
    },
    [getHandleType, calculateCompatibleTargets]
  );

  /**
   * Handle connection end (when user stops dragging)
   */
  const onConnectEnd = useCallback(() => {
    // Clean up visual classes
    document.querySelectorAll(".handle-compatible-target").forEach((el) => {
      el.classList.remove("handle-compatible-target");
    });

    document.querySelectorAll(".handle-incompatible-target").forEach((el) => {
      el.classList.remove("handle-incompatible-target");
      el.removeAttribute("data-incompatible-reason");
    });

    setConnectionState({
      isDragging: false,
      sourceNode: null,
      sourceHandle: null,
      sourceType: null,
      compatibleTargets: new Set(),
      incompatibleTargets: new Map(),
    });
  }, []);

  /**
   * Validate connection before it's created
   */
  const isValidConnection = useCallback(
    (connection: Connection): boolean => {
      const { source, sourceHandle, target, targetHandle } = connection;

      if (!source || !sourceHandle || !target || !targetHandle) {
        return false;
      }

      const sourceType = getHandleType(source, sourceHandle, "source");
      const targetType = getHandleType(target, targetHandle, "target");

      if (!sourceType || !targetType) {
        console.warn(
          "[ConnectionPrevention] Could not determine handle types:",
          superjson.stringify({
            source,
            sourceHandle,
            sourceType,
            target,
            targetHandle,
            targetType,
          })
        );
        return false;
      }

      const compatibility = checkHandleCompatibility(sourceType, targetType);

      if (!compatibility.isCompatible) {
        console.info(
          "[ConnectionPrevention] Connection blocked:",
          compatibility.reason
        );

        // Show user feedback
        showConnectionBlockedFeedback(compatibility);
      }

      return compatibility.isCompatible;
    },
    [getHandleType]
  );

  return {
    connectionState,
    onConnectStart,
    onConnectEnd,
    isValidConnection,
    checkHandleCompatibility,
    // Superjson utilities for external use
    serializeConnectionState,
    deserializeConnectionState,
    cloneConnectionState,
  };
}

// ===== USER FEEDBACK FUNCTIONS =====

/**
 * Show feedback when connection is blocked with spam prevention
 */
let lastToastTime = 0;
let lastToastReason = "";
const TOAST_COOLDOWN = 1000; // 1 second cooldown between toasts

function showConnectionBlockedFeedback(compatibility: CompatibilityInfo) {
  const now = Date.now();

  // Prevent spam: check if we just showed the same toast recently
  if (
    now - lastToastTime < TOAST_COOLDOWN &&
    lastToastReason === compatibility.reason
  ) {
    return;
  }

  // Check if there's already a toast visible
  const existingToast = document.querySelector(".connection-blocked-toast");
  if (existingToast) {
    // Update existing toast instead of creating a new one
    const contentElement = existingToast.querySelector(".toast-content");
    if (contentElement) {
      contentElement.innerHTML = `
        <strong>Connection Blocked</strong>
        <p>${compatibility.reason}</p>
        ${
          compatibility.suggestedTypes
            ? `<small>Compatible types: ${compatibility.suggestedTypes.map(getTypeLabel).join(", ")}</small>`
            : ""
        }
      `;
    }
    return;
  }

  // Update spam prevention tracking
  lastToastTime = now;
  lastToastReason = compatibility.reason;

  // Create temporary toast notification
  const toast = document.createElement("div");
  toast.className = "connection-blocked-toast";
  toast.innerHTML = `
    <div class="toast-content">
      <strong>Connection Blocked</strong>
      <p>${compatibility.reason}</p>
      ${
        compatibility.suggestedTypes
          ? `<small>Compatible types: ${compatibility.suggestedTypes.map(getTypeLabel).join(", ")}</small>`
          : ""
      }
    </div>
  `;

  // Style the toast
  Object.assign(toast.style, {
    position: "fixed",
    top: "20px",
    right: "20px",
    backgroundColor: "#fee2e2",
    border: "1px solid #fecaca",
    borderRadius: "8px",
    padding: "12px 16px",
    zIndex: "9999",
    maxWidth: "300px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    animation: "slideIn 0.3s ease-out",
  });

  document.body.appendChild(toast);

  // Remove after 3 seconds
  setTimeout(() => {
    if (toast.parentNode) {
      toast.style.animation = "slideOut 0.3s ease-in";
      setTimeout(() => {
        if (toast.parentNode) {
          document.body.removeChild(toast);
        }
      }, 300);
    }
  }, 3000);
}

// ===== CSS STYLES =====

/**
 * Inject necessary CSS styles
 */
export function injectConnectionPreventionStyles() {
  if (document.getElementById("connection-prevention-styles")) return;

  const styles = document.createElement("style");
  styles.id = "connection-prevention-styles";
  styles.textContent = `
    /* Compatible target highlighting */
    .handle-compatible-target {
      box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.5) !important;
      transform: scale(1.1) !important;
      transition: all 0.2s ease !important;
      z-index: 10 !important;
    }

    /* Incompatible target dimming */
    .handle-incompatible-target {
      opacity: 0.3 !important;
      filter: grayscale(70%) !important;
      cursor: not-allowed !important;
      transition: all 0.2s ease !important;
    }

    /* Hover tooltip for incompatible targets */
    .handle-incompatible-target:hover::after {
      content: attr(data-incompatible-reason);
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      background: #1f2937;
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      white-space: nowrap;
      z-index: 1000;
      margin-bottom: 5px;
    }

    .handle-incompatible-target:hover::before {
      content: '';
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      border: 5px solid transparent;
      border-top-color: #1f2937;
      margin-bottom: -5px;
      z-index: 1000;
    }

    /* Toast animations */
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
  `;

  document.head.appendChild(styles);
}

export default useConnectionPrevention;
