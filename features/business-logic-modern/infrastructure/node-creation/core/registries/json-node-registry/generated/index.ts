/**
 * GENERATED REGISTRY INDEX
 *
 * Main entry point for generated registries.
 * DO NOT EDIT MANUALLY - changes will be overwritten.
 *
 * Generated at: 2025-06-07T02:52:04.456Z
 */

export {
  CATEGORY_COUNT,
  CATEGORY_KEYS,
  GENERATED_CATEGORY_REGISTRY,
} from "./categoryRegistry";
export {
  GENERATED_NODE_REGISTRY,
  NODE_COUNT,
  NODE_TYPES,
  REGISTRY_STATS,
} from "./nodeRegistry";

// Import the registries for use in utility functions
import { GENERATED_CATEGORY_REGISTRY } from "./categoryRegistry";
import { GENERATED_NODE_REGISTRY } from "./nodeRegistry";

// Re-export schemas for validation
export * from "../schemas/base";
export * from "../schemas/families";

// Registry utilities
export function getNodeByType(nodeType: string) {
  return GENERATED_NODE_REGISTRY[
    nodeType as keyof typeof GENERATED_NODE_REGISTRY
  ];
}

export function getCategoryByKey(categoryKey: string) {
  return GENERATED_CATEGORY_REGISTRY[
    categoryKey as keyof typeof GENERATED_CATEGORY_REGISTRY
  ];
}

export function getNodesByCategory(category: string) {
  return Object.values(GENERATED_NODE_REGISTRY).filter(
    (node: any) => node.category === category
  );
}
