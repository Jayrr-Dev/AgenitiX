/**
 * HANDLE DIAGNOSTICS - Debug and validation utilities for node handles
 *
 * • Provides diagnostic tools for handle connection debugging
 * • Validates handle configurations and type compatibility
 * • Offers connection analysis and troubleshooting helpers
 * • Includes visual debugging aids for handle system issues
 * • Supports real-time handle state monitoring and validation
 *
 * Keywords: handle-diagnostics, debug, validation, connections, troubleshooting, monitoring
 */

import type { Edge, Node } from "@xyflow/react";
import type { HandleConfig } from "../../types";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface HandleDiagnostic {
  nodeId: string;
  nodeType: string;
  handleId: string;
  handleType: "source" | "target";
  dataType: string;
  position: string;
  isConnected: boolean;
  connections: string[];
  issues: string[];
}

interface ConnectionDiagnostic {
  edgeId: string;
  sourceNode: string;
  targetNode: string;
  sourceHandle: string | null;
  targetHandle: string | null;
  isValid: boolean;
  typeMatch: boolean;
  issues: string[];
}

interface FlowDiagnostic {
  nodes: HandleDiagnostic[];
  connections: ConnectionDiagnostic[];
  globalIssues: string[];
  summary: {
    totalNodes: number;
    totalHandles: number;
    totalConnections: number;
    validConnections: number;
    invalidConnections: number;
    unconnectedHandles: number;
  };
}

// ============================================================================
// DIAGNOSTIC FUNCTIONS
// ============================================================================

/**
 * ANALYZE FLOW HANDLES
 * Comprehensive analysis of all handles in the flow
 */
export function analyzeFlowHandles(
  nodes: Node[],
  edges: Edge[]
): FlowDiagnostic {
  const handleDiagnostics: HandleDiagnostic[] = [];
  const connectionDiagnostics: ConnectionDiagnostic[] = [];
  const globalIssues: string[] = [];

  // Analyze each node's handles
  for (const node of nodes) {
    const nodeHandles = extractNodeHandles(node);

    for (const handle of nodeHandles) {
      const connections = findHandleConnections(
        node.id,
        handle.id,
        handle.type,
        edges
      );
      const issues = validateHandle(handle, node);

      handleDiagnostics.push({
        nodeId: node.id,
        nodeType: node.type || "unknown",
        handleId: handle.id,
        handleType: handle.type,
        dataType: handle.dataType,
        position: handle.position.toString(),
        isConnected: connections.length > 0,
        connections: connections.map((c) => c.id),
        issues,
      });
    }
  }

  // Analyze connections
  for (const edge of edges) {
    const diagnostic = analyzeConnection(edge, nodes);
    connectionDiagnostics.push(diagnostic);
  }

  // Check for global issues
  const duplicateHandleIds = findDuplicateHandleIds(handleDiagnostics);
  if (duplicateHandleIds.length > 0) {
    globalIssues.push(
      `Duplicate handle IDs found: ${duplicateHandleIds.join(", ")}`
    );
  }

  // Generate summary
  const summary = {
    totalNodes: nodes.length,
    totalHandles: handleDiagnostics.length,
    totalConnections: edges.length,
    validConnections: connectionDiagnostics.filter((c) => c.isValid).length,
    invalidConnections: connectionDiagnostics.filter((c) => !c.isValid).length,
    unconnectedHandles: handleDiagnostics.filter((h) => !h.isConnected).length,
  };

  return {
    nodes: handleDiagnostics,
    connections: connectionDiagnostics,
    globalIssues,
    summary,
  };
}

/**
 * EXTRACT NODE HANDLES
 * Get handle configuration from node (handles registry lookup)
 */
function extractNodeHandles(node: Node): HandleConfig[] {
  // Try to get handles from node data
  if (node.data?.handles && Array.isArray(node.data.handles)) {
    return node.data.handles;
  }

  // Fallback: infer common handle patterns by node type
  const nodeType = node.type || "unknown";

  if (nodeType.includes("createText") || nodeType.includes("CreateText")) {
    return [
      { id: "trigger", dataType: "b", position: "left" as any, type: "target" },
      { id: "output", dataType: "s", position: "right" as any, type: "source" },
    ];
  }

  if (nodeType.includes("viewOutput") || nodeType.includes("ViewOutput")) {
    return [
      { id: "input", dataType: "x", position: "left" as any, type: "target" },
    ];
  }

  // Default: assume basic input/output
  return [
    { id: "input", dataType: "x", position: "left" as any, type: "target" },
    { id: "output", dataType: "x", position: "right" as any, type: "source" },
  ];
}

/**
 * FIND HANDLE CONNECTIONS
 * Find all edges connected to a specific handle
 */
function findHandleConnections(
  nodeId: string,
  handleId: string,
  handleType: "source" | "target",
  edges: Edge[]
): Edge[] {
  return edges.filter((edge) => {
    if (handleType === "source") {
      return edge.source === nodeId && edge.sourceHandle === handleId;
    } else {
      return edge.target === nodeId && edge.targetHandle === handleId;
    }
  });
}

/**
 * VALIDATE HANDLE
 * Check handle configuration for issues
 */
function validateHandle(handle: HandleConfig, node: Node): string[] {
  const issues: string[] = [];

  if (!handle.id || handle.id.trim() === "") {
    issues.push("Handle ID is empty");
  }

  if (!handle.dataType) {
    issues.push("Handle data type is missing");
  }

  if (!["source", "target"].includes(handle.type)) {
    issues.push(`Invalid handle type: ${handle.type}`);
  }

  const validDataTypes = [
    "s",
    "n",
    "b",
    "{}",
    "a",
    "N",
    "f",
    "x",
    "u",
    "S",
    "∅",
    "V",
  ];
  if (!validDataTypes.includes(handle.dataType)) {
    issues.push(`Invalid data type: ${handle.dataType}`);
  }

  return issues;
}

/**
 * ANALYZE CONNECTION
 * Analyze a specific edge connection for validity
 */
function analyzeConnection(edge: Edge, nodes: Node[]): ConnectionDiagnostic {
  const sourceNode = nodes.find((n) => n.id === edge.source);
  const targetNode = nodes.find((n) => n.id === edge.target);

  const issues: string[] = [];
  let isValid = true;
  let typeMatch = true;

  if (!sourceNode) {
    issues.push("Source node not found");
    isValid = false;
  }

  if (!targetNode) {
    issues.push("Target node not found");
    isValid = false;
  }

  if (sourceNode && targetNode) {
    // Check handle existence
    const sourceHandles = extractNodeHandles(sourceNode);
    const targetHandles = extractNodeHandles(targetNode);

    const sourceHandle = sourceHandles.find(
      (h) => h.id === edge.sourceHandle && h.type === "source"
    );
    const targetHandle = targetHandles.find(
      (h) => h.id === edge.targetHandle && h.type === "target"
    );

    if (!sourceHandle) {
      issues.push(`Source handle "${edge.sourceHandle}" not found`);
      isValid = false;
    }

    if (!targetHandle) {
      issues.push(`Target handle "${edge.targetHandle}" not found`);
      isValid = false;
    }

    // Check type compatibility
    if (sourceHandle && targetHandle) {
      typeMatch = areTypesCompatible(
        sourceHandle.dataType,
        targetHandle.dataType
      );
      if (!typeMatch) {
        issues.push(
          `Type mismatch: ${sourceHandle.dataType} → ${targetHandle.dataType}`
        );
        isValid = false;
      }
    }
  }

  return {
    edgeId: edge.id,
    sourceNode: edge.source,
    targetNode: edge.target,
    sourceHandle: edge.sourceHandle || null,
    targetHandle: edge.targetHandle || null,
    isValid,
    typeMatch,
    issues,
  };
}

/**
 * ARE TYPES COMPATIBLE
 * Check if two data types can be connected
 */
function areTypesCompatible(sourceType: string, targetType: string): boolean {
  // Any type accepts everything
  if (sourceType === "x" || targetType === "x") return true;

  // Direct match
  if (sourceType === targetType) return true;

  // Special compatibility rules
  const compatibilityMap: Record<string, string[]> = {
    s: ["s", "x"], // String can go to string or any
    n: ["n", "f", "x"], // Number can go to number, float, or any
    f: ["n", "f", "x"], // Float can go to number, float, or any
    b: ["b", "x"], // Boolean can go to boolean or any
    "{}": ["{}", "x"], // JSON can go to JSON or any
    a: ["a", "{}", "x"], // Array can go to array, JSON, or any
  };

  const compatibleTargets = compatibilityMap[sourceType] || [];
  return compatibleTargets.includes(targetType);
}

/**
 * FIND DUPLICATE HANDLE IDS
 * Find handles with duplicate IDs within the same node
 */
function findDuplicateHandleIds(diagnostics: HandleDiagnostic[]): string[] {
  const seen = new Map<string, Set<string>>();
  const duplicates: string[] = [];

  for (const diagnostic of diagnostics) {
    const key = `${diagnostic.nodeId}:${diagnostic.handleId}`;

    if (!seen.has(diagnostic.nodeId)) {
      seen.set(diagnostic.nodeId, new Set());
    }

    const nodeHandles = seen.get(diagnostic.nodeId)!;
    if (nodeHandles.has(diagnostic.handleId)) {
      duplicates.push(`${diagnostic.nodeId}.${diagnostic.handleId}`);
    } else {
      nodeHandles.add(diagnostic.handleId);
    }
  }

  return duplicates;
}

// ============================================================================
// CONSOLE DIAGNOSTIC FUNCTIONS
// ============================================================================

/**
 * PRINT FLOW DIAGNOSIS
 * Pretty-print diagnostic results to console
 */
export function printFlowDiagnosis(diagnostic: FlowDiagnostic): void {
  console.group("🔍 FLOW HANDLE DIAGNOSTICS");

  // Summary
  console.log("📊 Summary:");
  console.log(`   Nodes: ${diagnostic.summary.totalNodes}`);
  console.log(`   Handles: ${diagnostic.summary.totalHandles}`);
  console.log(`   Connections: ${diagnostic.summary.totalConnections}`);
  console.log(`   Valid: ${diagnostic.summary.validConnections}`);
  console.log(`   Invalid: ${diagnostic.summary.invalidConnections}`);
  console.log(`   Unconnected: ${diagnostic.summary.unconnectedHandles}`);

  // Global issues
  if (diagnostic.globalIssues.length > 0) {
    console.group("🚨 Global Issues:");
    diagnostic.globalIssues.forEach((issue) => console.log(`   ${issue}`));
    console.groupEnd();
  }

  // Handle issues
  const handlesWithIssues = diagnostic.nodes.filter((h) => h.issues.length > 0);
  if (handlesWithIssues.length > 0) {
    console.group("⚠️ Handle Issues:");
    handlesWithIssues.forEach((handle) => {
      console.log(
        `   ${handle.nodeId}.${handle.handleId}: ${handle.issues.join(", ")}`
      );
    });
    console.groupEnd();
  }

  // Connection issues
  const invalidConnections = diagnostic.connections.filter((c) => !c.isValid);
  if (invalidConnections.length > 0) {
    console.group("🔗 Connection Issues:");
    invalidConnections.forEach((conn) => {
      console.log(
        `   ${conn.sourceNode} → ${conn.targetNode}: ${conn.issues.join(", ")}`
      );
    });
    console.groupEnd();
  }

  console.groupEnd();
}

/**
 * DIAGNOSE CURRENT FLOW
 * Helper function to diagnose the current flow (for development)
 */
export function diagnoseCurrentFlow(): void {
  if (typeof window === "undefined") {
    console.warn("Flow diagnostics only available in browser");
    return;
  }

  // Try to get React Flow instance from global scope (development helper)
  const reactFlowInstance = (window as any).reactFlow;
  if (!reactFlowInstance) {
    console.warn(
      "React Flow instance not found. Run this from browser console on flow page."
    );
    return;
  }

  const nodes = reactFlowInstance.getNodes();
  const edges = reactFlowInstance.getEdges();

  const diagnostic = analyzeFlowHandles(nodes, edges);
  printFlowDiagnosis(diagnostic);
}

// ============================================================================
// EXPORTS
// ============================================================================

export type { ConnectionDiagnostic, FlowDiagnostic, HandleDiagnostic };
