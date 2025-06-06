/**
 * CLEANUP INVALID CONNECTIONS - Utility to remove existing invalid connections
 *
 * This component runs when the flow loads and removes any existing invalid
 * connections that may have been created before the Ultimate Typesafe Handle System.
 */

import { useReactFlow } from "@xyflow/react";
import { useEffect } from "react";
import { toast } from "sonner";
import { isTypeCompatible, ULTIMATE_TYPE_MAP } from "./UltimateTypesafeHandle";

/**
 * Get handle type from node registry
 */
function getHandleDataType(
  nodeId: string,
  handleId: string,
  handleType: "source" | "target",
  nodes: any[]
): string | null {
  try {
    const registry = require("../node-registry/nodeRegistry");
    const node = nodes.find((n: any) => n.id === nodeId);
    if (!node) return null;

    const handles = registry.getNodeHandles(node.type);
    const handle = handles.find(
      (h: any) => h.id === handleId && h.type === handleType
    );
    return handle?.dataType || null;
  } catch (error) {
    console.warn(
      "[CleanupInvalidConnections] Failed to get handle type:",
      error
    );
    return null;
  }
}

/**
 * Hook to clean up invalid connections on flow load
 */
export function useCleanupInvalidConnections() {
  const { getNodes, getEdges, setEdges } = useReactFlow();

  useEffect(() => {
    const cleanupTimer = setTimeout(() => {
      const nodes = getNodes();
      const edges = getEdges();

      if (edges.length === 0) return;

      const validEdges = edges.filter((edge: any) => {
        const sourceType = getHandleDataType(
          edge.source,
          edge.sourceHandle,
          "source",
          nodes
        );
        const targetType = getHandleDataType(
          edge.target,
          edge.targetHandle,
          "target",
          nodes
        );

        if (!sourceType || !targetType) {
          console.warn(
            `🧹 [CleanupInvalidConnections] Could not determine types for connection ${edge.id}, keeping it`
          );
          return true; // Keep if we can't determine types
        }

        const isValid = isTypeCompatible(sourceType, targetType);

        if (!isValid) {
          console.info(
            `🧹 [CleanupInvalidConnections] Removing invalid connection: ${sourceType} → ${targetType} (${edge.id})`
          );

          // Show user a notification about the cleanup
          showCleanupNotification(sourceType, targetType);
        }

        return isValid;
      });

      // Update edges if any were removed
      if (validEdges.length !== edges.length) {
        const removedCount = edges.length - validEdges.length;
        console.info(
          `🧹 [CleanupInvalidConnections] Cleaned up ${removedCount} invalid connections`
        );
        setEdges(validEdges);
      } else {
      }
    }, 1000); // Wait 1 second for everything to load

    return () => clearTimeout(cleanupTimer);
  }, []); // Run once on mount
}

/**
 * Show user notification about cleaned up connections using Sonner
 */
function showCleanupNotification(sourceType: string, targetType: string) {
  const sourceLabel = ULTIMATE_TYPE_MAP[sourceType]?.label || sourceType;
  const targetLabel = ULTIMATE_TYPE_MAP[targetType]?.label || targetType;

  // Use Sonner toast system with success styling
  toast.success(`🧹 Invalid connection removed`, {
    description: `Cleaned up ${sourceLabel} → ${targetLabel}. Your flow now uses the typesafe system!`,
    duration: 4000,
  });
}

/**
 * Component wrapper for easy integration
 */
export default function CleanupInvalidConnections() {
  useCleanupInvalidConnections();
  return null; // This component doesn't render anything
}
