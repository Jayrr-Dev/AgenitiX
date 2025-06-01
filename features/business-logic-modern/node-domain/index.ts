/**
 * NODE DOMAIN INDEX - Central exports for all modern node implementations
 *
 * • Exports all available nodes from create, trigger, test, and view domains
 * • Provides domain metadata and categorization constants
 * • Centralized import point for node registration systems
 * • Type-safe exports with proper TypeScript integration
 * • Organized by domain categories for easy discovery
 *
 * Keywords: node-exports, domains, categorization, registration, TypeScript
 */

// ============================================================================
// DOMAIN NODE EXPORTS
// ============================================================================

// CREATE DOMAIN
export { default as CreateText } from "./create/CreateText";

// TRIGGER DOMAIN
export { default as TriggerOnToggle } from "./trigger/TriggerOnToggle";

// TEST DOMAIN
export { default as TestError } from "./test/TestError";

// VIEW DOMAIN

export { default as ViewOutput } from "./view/ViewOutput";

// ============================================================================
// DOMAIN METADATA
// ============================================================================

// NODE REGISTRY MAPPINGS
export const NODE_DOMAIN_REGISTRY = {
  // Create Domain
  CreateText: "createText",

  // Trigger Domain
  TriggerOnToggle: "triggerOnToggle",

  // Test Domain
  TestError: "testError",

  // View Domain
  ViewOutputEnhanced: "viewOutputEnhanced",
  ViewOutputRefactor: "viewOutputRefactor",
} as const;

// DOMAIN CATEGORIES
export const DOMAIN_CATEGORIES = {
  CREATE: "create",
  TRIGGER: "trigger",
  TEST: "test",
  VIEW: "view",
  CYCLE: "cycle", // Reserved for future cycle nodes
} as const;

// NODES BY CATEGORY
export const NODES_BY_CATEGORY = {
  [DOMAIN_CATEGORIES.CREATE]: ["CreateText"],
  [DOMAIN_CATEGORIES.TRIGGER]: ["TriggerOnToggle"],
  [DOMAIN_CATEGORIES.TEST]: ["TestError"],
  [DOMAIN_CATEGORIES.VIEW]: ["ViewOutputEnhanced", "ViewOutputRefactor"],
  [DOMAIN_CATEGORIES.CYCLE]: [], // Empty - reserved for future development
} as const;

// TOTAL NODE COUNT
export const TOTAL_NODES = Object.values(NODES_BY_CATEGORY).flat().length;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

// Re-export common types that nodes might need
export type NodeCategory =
  (typeof DOMAIN_CATEGORIES)[keyof typeof DOMAIN_CATEGORIES];
export type NodeRegistryKey = keyof typeof NODE_DOMAIN_REGISTRY;
export type DomainNodesList = typeof NODES_BY_CATEGORY;
