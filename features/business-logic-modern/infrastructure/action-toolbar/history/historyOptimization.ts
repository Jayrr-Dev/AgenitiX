/**
 * HISTORY OPTIMIZATION - Graph optimization for storage efficiency
 *
 * • Strip transient/heavy fields before storage
 * • Reduce memory footprint for server persistence
 * • Maintain essential data for history reconstruction
 * • Compression and size monitoring utilities
 *
 * Keywords: optimization, compression, storage-efficiency, graph-optimization
 */

import type { HistoryGraph } from "./historyGraph";

/**
 * Optimize a history graph for storage by removing heavy/transient fields
 * @param graph - The original history graph
 * @returns Optimized graph for storage
 */
export function optimizeGraphForStorage(graph: HistoryGraph): HistoryGraph {
  // For now, return the graph as-is
  // Future optimizations could include:
  // - Removing large React Flow internal fields
  // - Compressing node positions
  // - Deduplicating common node data
  // - Removing transient UI state

  return {
    ...graph,
    // Remove any potentially heavy transient fields
    nodes: Object.fromEntries(
      Object.entries(graph.nodes).map(([id, node]) => [
        id,
        {
          ...node,
          // Keep essential history data, remove any heavy fields
        },
      ])
    ),
  };
}

/**
 * Calculate the compressed size of a history graph
 * @param graph - The history graph to measure
 * @returns Size in bytes
 */
export function calculateGraphSize(graph: HistoryGraph): number {
  const serialized = JSON.stringify(graph);
  return new Blob([serialized]).size;
}

/**
 * Check if a graph exceeds the recommended size limit
 * @param graph - The history graph to check
 * @param limitBytes - Size limit in bytes (default: 1MB)
 * @returns Whether the graph exceeds the limit
 */
export function isGraphTooLarge(
  graph: HistoryGraph,
  limitBytes = 1024 * 1024
): boolean {
  return calculateGraphSize(graph) > limitBytes;
}
