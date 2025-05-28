import type { AgenNode, AgenEdge } from '../types';
import { extractNodeValue, safeStringify } from '../../nodes/utils/nodeUtils';

/**
 * Computes the output string for a given node
 */
export function getNodeOutput(
  node: AgenNode,
  allNodes: AgenNode[],
  allEdges: AgenEdge[]
): string | null {
  // Use extractNodeValue for consistent value extraction
  const extractedValue = extractNodeValue(node.data);
  
  if (node.type === 'outputnode') {
    const incoming = allEdges
      .filter((e) => e.target === node.id)
      .map((e) => allNodes.find((n) => n.id === e.source))
      .filter(Boolean) as AgenNode[];

    const values = incoming.map((n) => {
      const value = extractNodeValue(n.data);
      return value !== undefined && value !== null ? value : null;
    }).filter(value => value !== null);

    return values.map(value => formatValue(value)).join(', ');
  }
  
  // For all other node types, format the extracted value
  if (extractedValue === undefined || extractedValue === null) return null;
  
  return formatValue(extractedValue);
}

/**
 * Formats a value for display in the output
 */
export function formatValue(value: unknown): string {
  if (typeof value === 'string') return value;
  
  if (typeof value === 'number') {
    if (Number.isNaN(value)) return 'NaN';
    if (!Number.isFinite(value)) return value > 0 ? 'Infinity' : '-Infinity';
    return value.toString();
  }
  
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'bigint') return value.toString() + 'n';
  
  try {
    return safeStringify(value);
  } catch {
    return String(value);
  }
}

/**
 * Gets all incoming nodes for a given node
 */
export function getIncomingNodes(
  nodeId: string,
  allNodes: AgenNode[],
  allEdges: AgenEdge[]
): AgenNode[] {
  return allEdges
    .filter((e) => e.target === nodeId)
    .map((e) => allNodes.find((n) => n.id === e.source))
    .filter(Boolean) as AgenNode[];
}

/**
 * Gets all outgoing nodes for a given node
 */
export function getOutgoingNodes(
  nodeId: string,
  allNodes: AgenNode[],
  allEdges: AgenEdge[]
): AgenNode[] {
  return allEdges
    .filter((e) => e.source === nodeId)
    .map((e) => allNodes.find((n) => n.id === e.target))
    .filter(Boolean) as AgenNode[];
} 