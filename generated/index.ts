
/**
 * GENERATED REGISTRY INDEX
 *
 * Main entry point for generated registries.
 * DO NOT EDIT MANUALLY - changes will be overwritten.
 *
 * Generated at: 2025-06-11T21:43:28.708Z
 */

export { GENERATED_NODE_REGISTRY, NODE_TYPES, NODE_COUNT, REGISTRY_STATS } from "./nodeRegistry";
export { GENERATED_CATEGORY_REGISTRY, CATEGORY_KEYS, CATEGORY_COUNT } from "./categoryRegistry";

// Re-export schemas for validation
export * from "../schemas/base";
export * from "../schemas/families";

// Registry utilities
export function getNodeByType(nodeType) {
  return GENERATED_NODE_REGISTRY[nodeType];
}

export function getCategoryByKey(categoryKey) {
  return GENERATED_CATEGORY_REGISTRY[categoryKey];
}

export function getNodesByCategory(category) {
  return Object.values(GENERATED_NODE_REGISTRY).filter(node => node.category === category);
}
