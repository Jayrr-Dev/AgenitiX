
/**
 * GENERATED REGISTRY INDEX
 *
 * Main entry point for generated registries.
 * DO NOT EDIT MANUALLY - changes will be overwritten.
 *
 * Generated at: 2025-06-11T21:58:54.759Z
 */

import { GENERATED_NODE_REGISTRY, NODE_TYPES, NODE_COUNT, REGISTRY_STATS } from "./nodeRegistry";
import { GENERATED_CATEGORY_REGISTRY, CATEGORY_KEYS, CATEGORY_COUNT } from "./categoryRegistry";

// Re-export all registries
export { 
  GENERATED_NODE_REGISTRY, 
  NODE_TYPES, 
  NODE_COUNT, 
  REGISTRY_STATS, 
  GENERATED_CATEGORY_REGISTRY, 
  CATEGORY_KEYS, 
  CATEGORY_COUNT 
};

// Registry utilities with proper TypeScript types
export function getNodeByType(nodeType: string): any {
  return GENERATED_NODE_REGISTRY[nodeType as keyof typeof GENERATED_NODE_REGISTRY];
}

export function getCategoryByKey(categoryKey: string): any {
  return GENERATED_CATEGORY_REGISTRY[categoryKey as keyof typeof GENERATED_CATEGORY_REGISTRY];
}

export function getNodesByCategory(category: string): any[] {
  return Object.values(GENERATED_NODE_REGISTRY).filter((node: any) => node.category === category);
}
