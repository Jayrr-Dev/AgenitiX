/**
 * REGISTRY MIGRATION UTILITY - Migration helpers for transitioning to TypedRegistry system
 *
 * • Provides migration functions from legacy registry to new TypedRegistry
 * • Validates data integrity during migration
 * • Supports incremental migration with fallback support
 * • Includes performance monitoring and migration statistics
 *
 * Keywords: migration, legacy-support, data-integrity, performance, transition
 */

import type { NodeType } from "../../../flow-engine/types/nodeData";
import type {
  BaseNodeData,
  NodeCategory,
  SidebarFolder,
} from "../../factory/types";
import { categoryRegistry, type CategoryRegistration } from "../category";
import { inspectorRegistry, type InspectorRegistration } from "../inspector";
import type { FactoryInspectorConfig } from "../inspectorRegistry";
import { nodeRegistry, type NodeRegistration } from "../node";
import type { EnhancedNodeRegistration } from "../nodeRegistry";

// ============================================================================
// MIGRATION CONFIGURATION
// ============================================================================

export interface MigrationConfig {
  enableValidation: boolean;
  preserveLegacyRegistry: boolean;
  logMigrationSteps: boolean;
  validateAfterMigration: boolean;
  performanceMonitoring: boolean;
}

export const DEFAULT_MIGRATION_CONFIG: MigrationConfig = {
  enableValidation: true,
  preserveLegacyRegistry: false,
  logMigrationSteps: process.env.NODE_ENV !== "production",
  validateAfterMigration: true,
  performanceMonitoring: process.env.NODE_ENV !== "production",
};

// ============================================================================
// MIGRATION STATISTICS
// ============================================================================

export interface MigrationStats {
  startTime: number;
  endTime?: number;
  duration?: number;

  // Migration counts
  nodesTotal: number;
  nodesMigrated: number;
  nodesSkipped: number;
  nodesFailed: number;

  inspectorsTotal: number;
  inspectorsMigrated: number;
  inspectorsSkipped: number;
  inspectorsFailed: number;

  categoriesTotal: number;
  categoriesMigrated: number;
  categoriesSkipped: number;
  categoriesFailed: number;

  // Errors and warnings
  errors: Array<{
    type: "node" | "inspector" | "category";
    key: string;
    error: string;
  }>;
  warnings: Array<{
    type: "node" | "inspector" | "category";
    key: string;
    warning: string;
  }>;
}

// ============================================================================
// MIGRATION FUNCTIONS
// ============================================================================

/**
 * COMPLETE REGISTRY MIGRATION
 * Migrates all registries from legacy system to new TypedRegistry system
 */
export async function migrateCompleteRegistry(
  legacyNodeRegistry: Record<NodeType, EnhancedNodeRegistration>,
  legacyInspectorRegistry: Map<string, FactoryInspectorConfig<any>>,
  legacyCategoryConfig: Record<string, any>,
  config: Partial<MigrationConfig> = {}
): Promise<{ success: boolean; stats: MigrationStats }> {
  const migrationConfig = { ...DEFAULT_MIGRATION_CONFIG, ...config };
  const stats: MigrationStats = {
    startTime: Date.now(),
    nodesTotal: Object.keys(legacyNodeRegistry).length,
    nodesMigrated: 0,
    nodesSkipped: 0,
    nodesFailed: 0,
    inspectorsTotal: legacyInspectorRegistry.size,
    inspectorsMigrated: 0,
    inspectorsSkipped: 0,
    inspectorsFailed: 0,
    categoriesTotal: Object.keys(legacyCategoryConfig).length,
    categoriesMigrated: 0,
    categoriesSkipped: 0,
    categoriesFailed: 0,
    errors: [],
    warnings: [],
  };

  if (migrationConfig.logMigrationSteps) {
    console.log("🚀 Starting complete registry migration...");
  }

  try {
    // Migrate categories first (nodes depend on them)
    await migrateCategoriesFromConfig(
      legacyCategoryConfig,
      stats,
      migrationConfig
    );

    // Migrate nodes
    await migrateNodesFromLegacyRegistry(
      legacyNodeRegistry,
      stats,
      migrationConfig
    );

    // Migrate inspector controls
    await migrateInspectorsFromLegacyRegistry(
      legacyInspectorRegistry,
      stats,
      migrationConfig
    );

    // Validate after migration if configured
    if (migrationConfig.validateAfterMigration) {
      await validateMigratedRegistries(stats);
    }

    stats.endTime = Date.now();
    stats.duration = stats.endTime - stats.startTime;

    const success = stats.errors.length === 0;

    if (migrationConfig.logMigrationSteps) {
      console.log(`✅ Migration completed in ${stats.duration}ms`, {
        success,
        nodes: `${stats.nodesMigrated}/${stats.nodesTotal}`,
        inspectors: `${stats.inspectorsMigrated}/${stats.inspectorsTotal}`,
        categories: `${stats.categoriesMigrated}/${stats.categoriesTotal}`,
        errors: stats.errors.length,
        warnings: stats.warnings.length,
      });
    }

    return { success, stats };
  } catch (error) {
    stats.endTime = Date.now();
    stats.duration = stats.endTime - stats.startTime;
    stats.errors.push({
      type: "node",
      key: "migration",
      error: `Migration failed: ${error instanceof Error ? error.message : String(error)}`,
    });

    if (migrationConfig.logMigrationSteps) {
      console.error("❌ Migration failed:", error);
    }

    return { success: false, stats };
  }
}

/**
 * MIGRATE NODES FROM LEGACY REGISTRY
 */
export async function migrateNodesFromLegacyRegistry(
  legacyRegistry: Record<NodeType, EnhancedNodeRegistration>,
  stats: MigrationStats,
  config: MigrationConfig
): Promise<void> {
  for (const [nodeType, legacyRegistration] of Object.entries(legacyRegistry)) {
    try {
      const nodeRegistration =
        convertLegacyNodeRegistration(legacyRegistration);

      if (config.enableValidation) {
        // This will throw if validation fails
        nodeRegistry.registerNode(nodeRegistration);
      } else {
        nodeRegistry.set(nodeType as NodeType, nodeRegistration);
      }

      stats.nodesMigrated++;

      if (config.logMigrationSteps) {
        console.log(`✅ Migrated node: ${nodeType}`);
      }
    } catch (error) {
      stats.nodesFailed++;
      stats.errors.push({
        type: "node",
        key: nodeType,
        error: error instanceof Error ? error.message : String(error),
      });

      if (config.logMigrationSteps) {
        console.warn(`⚠️ Failed to migrate node ${nodeType}:`, error);
      }
    }
  }
}

/**
 * MIGRATE INSPECTOR CONTROLS FROM LEGACY REGISTRY
 */
export async function migrateInspectorsFromLegacyRegistry(
  legacyRegistry: Map<string, FactoryInspectorConfig<any>>,
  stats: MigrationStats,
  config: MigrationConfig
): Promise<void> {
  for (const [nodeType, legacyConfig] of Array.from(legacyRegistry.entries())) {
    try {
      const inspectorRegistration = convertLegacyInspectorConfig(legacyConfig);

      if (config.enableValidation) {
        inspectorRegistry.registerInspectorControls(inspectorRegistration);
      } else {
        inspectorRegistry.set(nodeType as NodeType, inspectorRegistration);
      }

      stats.inspectorsMigrated++;

      if (config.logMigrationSteps) {
        console.log(`✅ Migrated inspector: ${nodeType}`);
      }
    } catch (error) {
      stats.inspectorsFailed++;
      stats.errors.push({
        type: "inspector",
        key: nodeType,
        error: error instanceof Error ? error.message : String(error),
      });

      if (config.logMigrationSteps) {
        console.warn(`⚠️ Failed to migrate inspector ${nodeType}:`, error);
      }
    }
  }
}

/**
 * MIGRATE CATEGORIES FROM CONFIGURATION
 */
export async function migrateCategoriesFromConfig(
  legacyConfig: Record<string, any>,
  stats: MigrationStats,
  config: MigrationConfig
): Promise<void> {
  for (const [categoryKey, categoryData] of Object.entries(legacyConfig)) {
    try {
      const categoryRegistration = convertLegacyCategoryConfig(
        categoryKey,
        categoryData
      );

      if (config.enableValidation) {
        categoryRegistry.registerCategory(categoryRegistration);
      } else {
        categoryRegistry.set(categoryKey as NodeCategory, categoryRegistration);
      }

      stats.categoriesMigrated++;

      if (config.logMigrationSteps) {
        console.log(`✅ Migrated category: ${categoryKey}`);
      }
    } catch (error) {
      stats.categoriesFailed++;
      stats.errors.push({
        type: "category",
        key: categoryKey,
        error: error instanceof Error ? error.message : String(error),
      });

      if (config.logMigrationSteps) {
        console.warn(`⚠️ Failed to migrate category ${categoryKey}:`, error);
      }
    }
  }
}

// ============================================================================
// CONVERSION FUNCTIONS
// ============================================================================

/**
 * Convert legacy node registration to new format
 */
function convertLegacyNodeRegistration<T extends BaseNodeData>(
  legacy: EnhancedNodeRegistration<T>
): NodeRegistration<T> {
  return {
    nodeType: legacy.nodeType,
    component: legacy.component,
    category: legacy.category,
    folder: legacy.folder,
    displayName: legacy.displayName,
    description: legacy.description,
    icon: legacy.icon,
    hasToggle: legacy.hasToggle,
    iconWidth: legacy.iconWidth,
    iconHeight: legacy.iconHeight,
    expandedWidth: legacy.expandedWidth,
    expandedHeight: legacy.expandedHeight,
    defaultData: legacy.defaultData,
    handles: legacy.handles,
    factoryConfig: legacy.factoryConfig,
    size: legacy.size,
    hasTargetPosition: legacy.hasTargetPosition,
    targetPosition: legacy.targetPosition,
    hasOutput: legacy.hasOutput,
    hasControls: legacy.hasControls,
  };
}

/**
 * Convert legacy inspector config to new format
 */
function convertLegacyInspectorConfig<T extends BaseNodeData>(
  legacy: FactoryInspectorConfig<T>
): InspectorRegistration<T> {
  return {
    nodeType: legacy.nodeType as NodeType,
    renderControls: legacy.renderControls,
    defaultData: legacy.defaultData,
    displayName: legacy.displayName,
    hasControls: legacy.hasControls,
    hasOutput: legacy.hasOutput,
    factoryConfig: legacy.factoryConfig,
    controlType: legacy.factoryConfig ? "factory" : "legacy",
  };
}

/**
 * Convert legacy category config to new format
 */
function convertLegacyCategoryConfig(
  categoryKey: string,
  categoryData: any
): CategoryRegistration {
  return {
    category: categoryKey as NodeCategory,
    displayName: categoryData.displayName || categoryKey,
    description: categoryData.description || "",
    icon: categoryData.icon || "📁",
    color: categoryData.color || "#666666",
    order: categoryData.order || 0,
    folder: (categoryData.folder || "main") as SidebarFolder,
    isEnabled: categoryData.isEnabled !== false,
    isCollapsible: categoryData.isCollapsible,
    isCollapsedByDefault: categoryData.isCollapsedByDefault,
    parentCategory: categoryData.parentCategory,
    maxNodes: categoryData.maxNodes,
    allowedNodeTypes: categoryData.allowedNodeTypes,
    restrictions: categoryData.restrictions,
  };
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate migrated registries
 */
async function validateMigratedRegistries(
  stats: MigrationStats
): Promise<void> {
  // Validate node registry
  const nodeValidation = nodeRegistry.validateRegistry();
  if (!nodeValidation.isValid) {
    for (const issue of nodeValidation.issues) {
      stats.errors.push({
        type: "node",
        key: issue.nodeType,
        error: `Validation failed: ${issue.errors.join(", ")}`,
      });
    }
  }

  // Validate inspector registry
  const inspectorValidation = inspectorRegistry.validateRegistry();
  if (!inspectorValidation.isValid) {
    for (const issue of inspectorValidation.issues) {
      stats.errors.push({
        type: "inspector",
        key: issue.nodeType,
        error: `Validation failed: ${issue.errors.join(", ")}`,
      });
    }
  }

  // Validate category registry - simplified validation for now
  const categoryStats = categoryRegistry.getRegistryStats();
  if (categoryStats.size === 0) {
    stats.warnings.push({
      type: "category",
      key: "registry",
      warning: "No categories were migrated",
    });
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get migration progress
 */
export function getMigrationProgress(stats: MigrationStats): {
  overall: number;
  nodes: number;
  inspectors: number;
  categories: number;
} {
  const nodesProgress =
    stats.nodesTotal > 0 ? (stats.nodesMigrated / stats.nodesTotal) * 100 : 100;
  const inspectorsProgress =
    stats.inspectorsTotal > 0
      ? (stats.inspectorsMigrated / stats.inspectorsTotal) * 100
      : 100;
  const categoriesProgress =
    stats.categoriesTotal > 0
      ? (stats.categoriesMigrated / stats.categoriesTotal) * 100
      : 100;

  const overall = (nodesProgress + inspectorsProgress + categoriesProgress) / 3;

  return {
    overall,
    nodes: nodesProgress,
    inspectors: inspectorsProgress,
    categories: categoriesProgress,
  };
}

/**
 * Generate migration report
 */
export function generateMigrationReport(stats: MigrationStats): string {
  const progress = getMigrationProgress(stats);
  const duration = stats.duration || 0;

  return `
REGISTRY MIGRATION REPORT
========================

Duration: ${duration}ms
Overall Progress: ${progress.overall.toFixed(1)}%

NODES:
  Total: ${stats.nodesTotal}
  Migrated: ${stats.nodesMigrated}
  Failed: ${stats.nodesFailed}
  Progress: ${progress.nodes.toFixed(1)}%

INSPECTORS:
  Total: ${stats.inspectorsTotal}
  Migrated: ${stats.inspectorsMigrated}
  Failed: ${stats.inspectorsFailed}
  Progress: ${progress.inspectors.toFixed(1)}%

CATEGORIES:
  Total: ${stats.categoriesTotal}
  Migrated: ${stats.categoriesMigrated}
  Failed: ${stats.categoriesFailed}
  Progress: ${progress.categories.toFixed(1)}%

ISSUES:
  Errors: ${stats.errors.length}
  Warnings: ${stats.warnings.length}

${stats.errors.length > 0 ? "\nERRORS:\n" + stats.errors.map((e) => `  ${e.type}:${e.key} - ${e.error}`).join("\n") : ""}
${stats.warnings.length > 0 ? "\nWARNINGS:\n" + stats.warnings.map((w) => `  ${w.type}:${w.key} - ${w.warning}`).join("\n") : ""}
  `;
}
