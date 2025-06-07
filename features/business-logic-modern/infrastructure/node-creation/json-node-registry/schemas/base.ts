/**
 * BASE SCHEMAS - Foundational Zod schemas for registry validation
 *
 * • Core schemas used across all node families
 * • Handle definitions for input/output connections
 * • Base node structure that all families extend
 * • Category and folder validation schemas
 *
 * Keywords: zod-schemas, validation, base-types, handles
 */

import { Position } from "@xyflow/react";
import { z } from "zod";

// ============================================================================
// CORE PRIMITIVE SCHEMAS
// ============================================================================

/**
 * Position enum schema for handle positioning
 */
export const PositionSchema = z.nativeEnum(Position);

/**
 * Node category schema
 */
export const NodeCategorySchema = z.enum([
  "create",
  "view",
  "trigger",
  "test",
  "data",
  "media",
  "control",
  "utility",
  "testing",
]);

/**
 * Sidebar folder schema
 */
export const SidebarFolderSchema = z.enum([
  "main",
  "advanced",
  "experimental",
  "custom",
]);

/**
 * Data type schema for handles
 */
export const DataTypeSchema = z.enum([
  "text",
  "number",
  "boolean",
  "object",
  "array",
  "image",
  "file",
  "any",
]);

// ============================================================================
// HANDLE SCHEMAS
// ============================================================================

/**
 * Handle schema for node inputs/outputs
 */
export const HandleSchema = z.object({
  id: z.string().min(1, "Handle ID is required"),
  type: z.enum(["source", "target"]),
  dataType: DataTypeSchema,
  position: PositionSchema,
  isConnectable: z.boolean().optional().default(true),
  label: z.string().optional(),
  style: z.record(z.unknown()).optional(),
});

/**
 * Dynamic handle factory schema
 */
export const DynamicHandleFactorySchema = z
  .function()
  .args(z.record(z.unknown())) // node data
  .returns(z.array(HandleSchema));

// ============================================================================
// SIZE AND LAYOUT SCHEMAS
// ============================================================================

/**
 * Node size configuration schema
 */
export const NodeSizeSchema = z.object({
  collapsed: z.object({
    width: z.string().regex(/^w-\[\d+px\]$/, "Must be Tailwind width class"),
    height: z.string().regex(/^h-\[\d+px\]$/, "Must be Tailwind height class"),
  }),
  expanded: z.object({
    width: z.string().regex(/^w-\[\d+px\]$/, "Must be Tailwind width class"),
    height: z.string().optional(),
  }),
});

/**
 * Legacy dimension schema (for backward compatibility)
 */
export const LegacyDimensionsSchema = z.object({
  iconWidth: z.number().min(1),
  iconHeight: z.number().min(1),
  expandedWidth: z.number().min(1),
  expandedHeight: z.number().min(1),
});

// ============================================================================
// INSPECTOR SCHEMAS
// ============================================================================

/**
 * Inspector control type schema
 */
export const InspectorControlTypeSchema = z.enum([
  "factory",
  "legacy",
  "custom",
  "none",
]);

/**
 * Inspector configuration schema
 */
export const InspectorConfigSchema = z.object({
  type: InspectorControlTypeSchema,
  renderer: z.string().optional(), // Path to React component
  priority: z.number().optional().default(0),
  isCollapsible: z.boolean().optional().default(false),
});

// ============================================================================
// BASE NODE SCHEMA
// ============================================================================

/**
 * Base node schema that all node families extend
 */
export const BaseNodeSchema = z.object({
  // Identity
  nodeType: z.string().min(1, "Node type is required"),
  category: NodeCategorySchema,

  // Metadata
  displayName: z.string().min(1, "Display name is required"),
  description: z.string().min(1, "Description is required"),
  icon: z.string().min(1, "Icon is required"),

  // Organization
  folder: SidebarFolderSchema,
  order: z.number().optional().default(0),

  // Handles and connections
  handles: z.array(HandleSchema),
  dynamicHandles: z.string().optional(), // Path to dynamic handle factory

  // UI Configuration
  hasToggle: z.boolean().default(false),

  // Size (legacy format for compatibility)
  ...LegacyDimensionsSchema.shape,

  // Modern size configuration (optional)
  size: NodeSizeSchema.optional(),

  // Inspector
  inspector: InspectorConfigSchema.optional(),

  // Feature flags
  isEnabled: z.boolean().default(true),
  isExperimental: z.boolean().default(false),

  // Legacy compatibility
  hasControls: z.boolean().optional(),
  hasOutput: z.boolean().optional(),
  hasTargetPosition: z.boolean().optional(),
  targetPosition: PositionSchema.optional(),

  // Default data (will be refined by families)
  defaultData: z.record(z.unknown()),
});

// ============================================================================
// CATEGORY SCHEMA
// ============================================================================

/**
 * Category registration schema
 */
export const CategorySchema = z.object({
  category: NodeCategorySchema,
  displayName: z.string().min(1),
  description: z.string().min(1),
  icon: z.string().min(1),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be hex color"),
  order: z.number().default(0),
  folder: SidebarFolderSchema,
  parentCategory: NodeCategorySchema.optional(),
  isEnabled: z.boolean().default(true),
  isCollapsible: z.boolean().optional(),
  isCollapsedByDefault: z.boolean().optional(),
  maxNodes: z.number().positive().optional(),
  allowedNodeTypes: z.array(z.string()).optional(),
  restrictions: z
    .object({
      requiresAuth: z.boolean().optional(),
      isPremium: z.boolean().optional(),
      isExperimental: z.boolean().optional(),
    })
    .optional(),
});

// ============================================================================
// UTILITY SCHEMAS
// ============================================================================

/**
 * Validation result schema
 */
export const ValidationResultSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(z.string()),
  warnings: z.array(z.string()),
});

/**
 * Registry statistics schema
 */
export const RegistryStatsSchema = z.object({
  name: z.string(),
  size: z.number(),
  operations: z.object({
    gets: z.number(),
    sets: z.number(),
    deletes: z.number(),
    has: z.number(),
  }),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Handle = z.infer<typeof HandleSchema>;
export type DynamicHandleFactory = z.infer<typeof DynamicHandleFactorySchema>;
export type NodeSize = z.infer<typeof NodeSizeSchema>;
export type InspectorConfig = z.infer<typeof InspectorConfigSchema>;
export type BaseNode = z.infer<typeof BaseNodeSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type ValidationResult = z.infer<typeof ValidationResultSchema>;
export type RegistryStats = z.infer<typeof RegistryStatsSchema>;
export type NodeCategory = z.infer<typeof NodeCategorySchema>;
export type SidebarFolder = z.infer<typeof SidebarFolderSchema>;
export type DataType = z.infer<typeof DataTypeSchema>;
