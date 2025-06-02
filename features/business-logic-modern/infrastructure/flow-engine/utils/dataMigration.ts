/**
 * DATA MIGRATION UTILS - Legacy data compatibility and migration
 *
 * • Migrates old edge data to match new handle IDs
 * • Provides backward compatibility for legacy flows
 * • Handles data format updates and schema changes
 * • Ensures smooth transitions between handle system versions
 * • Validates and repairs edge connection references
 *
 * Keywords: migration, compatibility, edge-data, handle-ids, legacy-support
 */

import type { Edge, Node } from "@xyflow/react";

// ============================================================================
// HANDLE ID MIGRATIONS
// ============================================================================

/**
 * LEGACY HANDLE ID MAPPINGS
 * Maps old handle IDs to new handle IDs for each node type
 */
const HANDLE_ID_MIGRATIONS: Record<string, Record<string, string>> = {
  createText: {
    // Old createText had handles: "b" (trigger), "s" (output)
    // New createText has handles: "trigger", "output"
    b: "trigger",
    s: "output",
  },
  viewOutput: {
    // Old viewOutput had handle: "input"
    // New viewOutput has handle: "input" (no change needed)
  },
};

/**
 * MIGRATE EDGE DATA
 * Updates old edge data to work with new handle system
 */
export function migrateEdgeData(edges: Edge[], nodes: Node[]): Edge[] {
  console.log("🔄 [DataMigration] Starting edge migration...");

  const migratedEdges = edges.map((edge) => {
    const sourceNode = nodes.find((n) => n.id === edge.source);
    const targetNode = nodes.find((n) => n.id === edge.target);

    if (!sourceNode || !targetNode) {
      console.warn(`⚠️ [DataMigration] Missing nodes for edge ${edge.id}`);
      return edge;
    }

    let updatedEdge = { ...edge };
    let hasChanges = false;

    // Migrate source handle ID
    if (edge.sourceHandle && sourceNode.type) {
      const sourceMigrations = HANDLE_ID_MIGRATIONS[sourceNode.type];
      if (sourceMigrations && sourceMigrations[edge.sourceHandle]) {
        console.log(
          `🔄 [DataMigration] Migrating source handle: ${edge.sourceHandle} → ${sourceMigrations[edge.sourceHandle]} (${sourceNode.type})`
        );
        updatedEdge.sourceHandle = sourceMigrations[edge.sourceHandle];
        hasChanges = true;
      }
    }

    // Migrate target handle ID
    if (edge.targetHandle && targetNode.type) {
      const targetMigrations = HANDLE_ID_MIGRATIONS[targetNode.type];
      if (targetMigrations && targetMigrations[edge.targetHandle]) {
        console.log(
          `🔄 [DataMigration] Migrating target handle: ${edge.targetHandle} → ${targetMigrations[edge.targetHandle]} (${targetNode.type})`
        );
        updatedEdge.targetHandle = targetMigrations[edge.targetHandle];
        hasChanges = true;
      }
    }

    if (hasChanges) {
      console.log(`✅ [DataMigration] Migrated edge ${edge.id}:`, {
        before: {
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle,
        },
        after: {
          sourceHandle: updatedEdge.sourceHandle,
          targetHandle: updatedEdge.targetHandle,
        },
      });
    }

    return updatedEdge;
  });

  const migrationCount = migratedEdges.filter(
    (edge, index) =>
      edge.sourceHandle !== edges[index].sourceHandle ||
      edge.targetHandle !== edges[index].targetHandle
  ).length;

  console.log(`🎯 [DataMigration] Completed: ${migrationCount} edges migrated`);

  return migratedEdges;
}

/**
 * CHECK IF MIGRATION IS NEEDED
 * Quickly check if any edges need migration
 */
export function needsMigration(edges: Edge[], nodes: Node[]): boolean {
  return edges.some((edge) => {
    const sourceNode = nodes.find((n) => n.id === edge.source);
    const targetNode = nodes.find((n) => n.id === edge.target);

    if (!sourceNode || !targetNode) return false;

    // Check if source handle needs migration
    if (edge.sourceHandle && sourceNode.type) {
      const sourceMigrations = HANDLE_ID_MIGRATIONS[sourceNode.type];
      if (sourceMigrations && sourceMigrations[edge.sourceHandle]) {
        return true;
      }
    }

    // Check if target handle needs migration
    if (edge.targetHandle && targetNode.type) {
      const targetMigrations = HANDLE_ID_MIGRATIONS[targetNode.type];
      if (targetMigrations && targetMigrations[edge.targetHandle]) {
        return true;
      }
    }

    return false;
  });
}
