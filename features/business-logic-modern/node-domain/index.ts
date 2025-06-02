/**
 * NODE DOMAIN INDEX - Central exports for modern node implementations
 *
 * • Exports all available nodes from create, trigger, test, and view domains
 * • Provides domain metadata and categorization constants synchronized with registry
 * • Centralized import point for node registration systems
 * • Type-safe exports with proper TypeScript integration
 * • Organized by domain categories for easy discovery and registration
 *
 * Keywords: node-exports, domains, categorization, registration, TypeScript, registry
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
// REGISTRY SYNC METADATA
// ============================================================================

// NODE REGISTRY MAPPINGS - Synchronized with MODERN_NODE_REGISTRY
export const NODE_DOMAIN_REGISTRY = {
  // Create Domain
  CreateText: "createText",

  // Trigger Domain
  TriggerOnToggle: "triggerOnToggle",

  // Test Domain
  TestError: "testError",

  // View Domain
  ViewOutput: "viewOutput",
} as const;

// DOMAIN CATEGORIES - Synchronized with NodeCategory type
export const DOMAIN_CATEGORIES = {
  CREATE: "create",
  TRIGGER: "trigger",
  TEST: "test",
  VIEW: "view",
  CYCLE: "cycle", // Reserved for future cycle nodes
} as const;

// SIDEBAR FOLDER MAPPING - Synchronized with SidebarFolder type
export const SIDEBAR_FOLDERS = {
  MAIN: "main",
  AUTOMATION: "automation",
  TESTING: "testing",
  VISUALIZATION: "visualization",
} as const;

// NODES BY CATEGORY - Updated to match actual available nodes
export const NODES_BY_CATEGORY = {
  [DOMAIN_CATEGORIES.CREATE]: ["CreateText"],
  [DOMAIN_CATEGORIES.TRIGGER]: ["TriggerOnToggle"],
  [DOMAIN_CATEGORIES.TEST]: ["TestError"],
  [DOMAIN_CATEGORIES.VIEW]: ["ViewOutput"],
  [DOMAIN_CATEGORIES.CYCLE]: [], // Empty - reserved for future development
} as const;

// NODES BY FOLDER - Maps components to their sidebar folders
export const NODES_BY_FOLDER = {
  [SIDEBAR_FOLDERS.MAIN]: ["CreateText"],
  [SIDEBAR_FOLDERS.AUTOMATION]: ["TriggerOnToggle"],
  [SIDEBAR_FOLDERS.TESTING]: ["TestError"],
  [SIDEBAR_FOLDERS.VISUALIZATION]: ["ViewOutput"],
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
export type SidebarFolderType = typeof SIDEBAR_FOLDERS;

// ============================================================================
// REGISTRY VALIDATION UTILITIES
// ============================================================================

/**
 * VALIDATE NODE EXPORT
 * Checks if a component name is exported from this domain
 */
export function isValidNodeExport(componentName: string): boolean {
  return componentName in NODE_DOMAIN_REGISTRY;
}

/**
 * GET NODE TYPE FROM COMPONENT NAME
 * Maps component name to its registered node type
 */
export function getNodeTypeFromComponent(componentName: string): string | null {
  return (
    NODE_DOMAIN_REGISTRY[componentName as keyof typeof NODE_DOMAIN_REGISTRY] ||
    null
  );
}
