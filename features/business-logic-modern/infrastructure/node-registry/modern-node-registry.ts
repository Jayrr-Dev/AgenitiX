/**
 * Modern Node Registry
 *
 * This file serves as a centralized registry for all modern (V2U) nodes.
 * It manually imports the `meta.json` file from each node's directory
 * and aggregates them into a single, easily accessible Map-like structure.
 * This replaces the legacy, script-generated `unifiedRegistry`.
 *
 * Main exports:
 * - `modernNodeRegistry`: A Map of node metadata, keyed by `nodeType`.
 * - `getNodeMetadata`: A function to retrieve metadata for a single node.
 * - `getAllNodeMetadata`: A function to get an array of all node metadata.
 * - `validateNode`: A simple validation function to check if a node type exists.
 */
import CreateTextV2UMeta from '@/features/business-logic-modern/node-domain/create/CreateTextV2U/meta.json';
import TestErrorV2UMeta from '@/features/business-logic-modern/node-domain/test/TestErrorV2U/meta.json';
import TriggerOnToggleV2UMeta from '@/features/business-logic-modern/node-domain/trigger/TriggerOnToggleV2U/meta.json';
import ViewOutputV2UMeta from '@/features/business-logic-modern/node-domain/view/ViewOutputV2U/meta.json';
import type { NodeMetadata } from './types';

const allNodesMeta: NodeMetadata[] = [
  CreateTextV2UMeta,
  TestErrorV2UMeta,
  TriggerOnToggleV2UMeta,
  ViewOutputV2UMeta,
];

// Replicating the Map structure of the old registry for compatibility.
export const modernNodeRegistry = new Map<string, NodeMetadata>();

allNodesMeta.forEach((meta) => {
  if (meta && meta.nodeType) {
    modernNodeRegistry.set(meta.nodeType, meta);
  }
});

/**
 * Retrieves the metadata for a specific node type.
 * @param nodeType - The type of the node.
 * @returns The metadata object for the node, or undefined if not found.
 */
export const getNodeMetadata = (
  nodeType: string
): NodeMetadata | undefined => {
  return modernNodeRegistry.get(nodeType);
};

/**
 * Retrieves the metadata for all registered modern nodes.
 * @returns An array of all node metadata objects.
 */
export const getAllNodeMetadata = (): NodeMetadata[] => {
  return Array.from(modernNodeRegistry.values());
};

/**
 * Validates if a node type is registered in the modern registry.
 * @param nodeType - The type of the node to validate.
 * @returns An object containing validation status, warnings, and suggestions.
 */
export const validateNode = (nodeType: string) => {
  const isValid = modernNodeRegistry.has(nodeType);
  if (!isValid) {
    const suggestions = `Did you mean one of: ${Array.from(
      modernNodeRegistry.keys()
    ).join(', ')}?`;
    return {
      isValid,
      warnings: [`Node type "${nodeType}" is not registered.`],
      suggestions: [suggestions],
    };
  }
  return { isValid, warnings: [], suggestions: [] };
}; 