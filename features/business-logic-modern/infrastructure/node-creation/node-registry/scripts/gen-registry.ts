#!/usr/bin/env node
/**
 * REGISTRY CODE GENERATOR
 *
 * • Scans domain folders for meta.yml files
 * • Validates YAML against Zod schemas
 * • Generates TypeScript registry files
 * • Handles categories, nodes, and inspector configs
 * • Creates type-safe barrel exports
 *
 * Usage: pnpm gen-registry [--watch] [--verbose]
 * Keywords: code-generation, yaml-processing, build-time
 */

import { glob } from "fast-glob";
import { promises as fs } from "fs";
import path from "path";
import YAML from "yaml";
import { z } from "zod";
import { validateNodeRegistration } from "../schemas/families";

// ============================================================================
// CONFIGURATION
// ============================================================================

interface GeneratorConfig {
  baseDir: string;
  metaDir: string;
  domainDir: string;
  outputDir: string;
  verbose: boolean;
  watch: boolean;
}

const DEFAULT_CONFIG: GeneratorConfig = {
  baseDir: process.cwd(),
  metaDir: "./meta",
  domainDir: "./domain",
  outputDir: "./generated",
  verbose: false,
  watch: false,
};

// ============================================================================
// YAML SCHEMAS FOR VALIDATION
// ============================================================================

const YamlNodeSchema = z.object({
  nodeType: z.string(),
  category: z.string(),
  displayName: z.string(),
  description: z.string(),
  icon: z.string(),
  folder: z.string(),
  order: z.number().optional().default(0),

  // Legacy dimensions
  iconWidth: z.number(),
  iconHeight: z.number(),
  expandedWidth: z.number(),
  expandedHeight: z.number(),

  // Modern size (optional)
  size: z
    .object({
      collapsed: z.object({
        width: z.string(),
        height: z.string(),
      }),
      expanded: z.object({
        width: z.string(),
        height: z.string().optional(),
      }),
    })
    .optional(),

  // UI Configuration
  hasToggle: z.boolean().default(false),
  isEnabled: z.boolean().default(true),
  isExperimental: z.boolean().default(false),

  // Handles
  handles: z.array(
    z.object({
      id: z.string(),
      type: z.enum(["source", "target"]),
      dataType: z.string(),
      position: z.string(),
      label: z.string().optional(),
      isConnectable: z.boolean().optional(),
    })
  ),

  // Dynamic handles
  dynamicHandles: z.string().optional(),

  // Inspector
  inspector: z
    .object({
      type: z.string(),
      renderer: z.string().optional(),
      priority: z.number().optional(),
      isCollapsible: z.boolean().optional(),
    })
    .optional(),

  // Default data
  defaultData: z.record(z.unknown()),

  // Component paths
  component: z.string(),
  inspectorComponent: z.string().optional(),
});

const YamlCategorySchema = z.record(
  z.object({
    displayName: z.string(),
    description: z.string(),
    icon: z.string(),
    color: z.string(),
    order: z.number(),
    folder: z.string(),
    isEnabled: z.boolean(),
    isCollapsible: z.boolean().optional(),
    isCollapsedByDefault: z.boolean().optional(),
  })
);

// ============================================================================
// FILE SYSTEM UTILITIES
// ============================================================================

async function ensureDir(dir: string): Promise<void> {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
}

async function readYamlFile<T>(
  filePath: string,
  schema: z.ZodSchema<T>
): Promise<T> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    const parsed = YAML.parse(content);
    return schema.parse(parsed);
  } catch (error) {
    throw new Error(`Failed to read/parse ${filePath}: ${error}`);
  }
}

async function writeFile(filePath: string, content: string): Promise<void> {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, "utf-8");
}

// ============================================================================
// YAML DISCOVERY AND PROCESSING
// ============================================================================

async function findNodeMetaFiles(domainDir: string): Promise<string[]> {
  const pattern = path.join(domainDir, "**/meta.yml").replace(/\\/g, "/");
  return glob(pattern, { absolute: true });
}

async function loadNodeMetadata(filePath: string): Promise<{
  nodeData: any;
  domainPath: string;
}> {
  const nodeData = await readYamlFile(filePath, YamlNodeSchema);
  const domainPath = path.dirname(filePath);
  return { nodeData, domainPath };
}

async function loadCategories(metaDir: string): Promise<Record<string, any>> {
  const categoriesPath = path.join(metaDir, "categories.yml");
  try {
    const content = await fs.readFile(categoriesPath, "utf-8");
    const parsed = YAML.parse(content);
    return YamlCategorySchema.parse(parsed.categories);
  } catch (error) {
    console.warn(`Could not load categories from ${categoriesPath}:`, error);
    return {};
  }
}

// ============================================================================
// CODE GENERATION
// ============================================================================

function generateNodeRegistryEntry(nodeData: any, domainPath: string): string {
  const relativeComponentPath = path
    .relative(
      path.join(process.cwd(), "generated"),
      path.join(domainPath, nodeData.component)
    )
    .replace(/\\/g, "/");

  const relativeInspectorPath = nodeData.inspectorComponent
    ? path
        .relative(
          path.join(process.cwd(), "generated"),
          path.join(domainPath, nodeData.inspectorComponent)
        )
        .replace(/\\/g, "/")
    : null;

  return `
  "${nodeData.nodeType}": {
    nodeType: "${nodeData.nodeType}",
    category: "${nodeData.category}",
    displayName: "${nodeData.displayName}",
    description: "${nodeData.description}",
    icon: "${nodeData.icon}",
    folder: "${nodeData.folder}",
    order: ${nodeData.order ?? 0},

    // Legacy dimensions
    iconWidth: ${nodeData.iconWidth},
    iconHeight: ${nodeData.iconHeight},
    expandedWidth: ${nodeData.expandedWidth},
    expandedHeight: ${nodeData.expandedHeight},

    // Modern size
    ${nodeData.size ? `size: ${JSON.stringify(nodeData.size, null, 4)},` : ""}

    // UI Configuration
    hasToggle: ${nodeData.hasToggle},
    isEnabled: ${nodeData.isEnabled},
    isExperimental: ${nodeData.isExperimental},

    // Handles
    handles: ${JSON.stringify(nodeData.handles, null, 4)},
    ${nodeData.dynamicHandles ? `dynamicHandles: "${nodeData.dynamicHandles}",` : ""}

    // Inspector
    ${nodeData.inspector ? `inspector: ${JSON.stringify(nodeData.inspector, null, 4)},` : ""}

    // Default data
    defaultData: ${JSON.stringify(nodeData.defaultData, null, 4)},

    // Component imports
    component: () => import("${relativeComponentPath}"),
    ${relativeInspectorPath ? `inspectorComponent: () => import("${relativeInspectorPath}"),` : ""}
  }`;
}

function generateCategoryRegistryEntry(
  categoryKey: string,
  categoryData: any
): string {
  return `
  "${categoryKey}": {
    category: "${categoryKey}",
    displayName: "${categoryData.displayName}",
    description: "${categoryData.description}",
    icon: "${categoryData.icon}",
    color: "${categoryData.color}",
    order: ${categoryData.order},
    folder: "${categoryData.folder}",
    isEnabled: ${categoryData.isEnabled},
    ${categoryData.isCollapsible !== undefined ? `isCollapsible: ${categoryData.isCollapsible},` : ""}
    ${categoryData.isCollapsedByDefault !== undefined ? `isCollapsedByDefault: ${categoryData.isCollapsedByDefault},` : ""}
  }`;
}

// ============================================================================
// MAIN GENERATION LOGIC
// ============================================================================

async function generateRegistries(config: GeneratorConfig): Promise<void> {
  const startTime = Date.now();

  if (config.verbose) {
    console.log("🔧 Starting registry generation...");
    console.log(`📁 Base directory: ${config.baseDir}`);
    console.log(`📂 Domain directory: ${config.domainDir}`);
    console.log(`📤 Output directory: ${config.outputDir}`);
  }

  // Load categories
  const categories = await loadCategories(config.metaDir);
  if (config.verbose) {
    console.log(`📋 Loaded ${Object.keys(categories).length} categories`);
  }

  // Find and load all node meta files
  const metaFiles = await findNodeMetaFiles(config.domainDir);
  if (config.verbose) {
    console.log(`🔍 Found ${metaFiles.length} node meta files`);
  }

  const nodes: Array<{
    nodeData: any;
    domainPath: string;
  }> = [];
  const errors: string[] = [];

  for (const filePath of metaFiles) {
    try {
      const nodeInfo = await loadNodeMetadata(filePath);

      // Validate against schema
      const validation = validateNodeRegistration(nodeInfo.nodeData);
      if (!validation.success) {
        errors.push(`${filePath}: ${validation.error}`);
        continue;
      }

      nodes.push(nodeInfo);
      if (config.verbose) {
        console.log(`✅ Loaded ${nodeInfo.nodeData.nodeType} from ${filePath}`);
      }
    } catch (error) {
      errors.push(`${filePath}: ${error}`);
    }
  }

  if (errors.length > 0) {
    console.error("❌ Validation errors:");
    errors.forEach((error) => console.error(`  ${error}`));
    process.exit(1);
  }

  // Generate node registry
  const nodeEntries = nodes
    .map(({ nodeData, domainPath }) =>
      generateNodeRegistryEntry(nodeData, domainPath)
    )
    .join(",");

  const nodeRegistryContent = `
/**
 * GENERATED NODE REGISTRY
 *
 * This file is auto-generated from YAML configurations.
 * DO NOT EDIT MANUALLY - changes will be overwritten.
 *
 * Generated at: ${new Date().toISOString()}
 * Source files: ${metaFiles.length} meta.yml files
 */

import type { NodeRegistration } from "../schemas/families";

export const GENERATED_NODE_REGISTRY: Record<string, NodeRegistration> = {${nodeEntries}
};

export const NODE_TYPES = Object.keys(GENERATED_NODE_REGISTRY);
export const NODE_COUNT = NODE_TYPES.length;

// Registry statistics
export const REGISTRY_STATS = {
  generatedAt: "${new Date().toISOString()}",
  nodeCount: NODE_COUNT,
  categoryCount: ${Object.keys(categories).length},
  sourceFiles: ${metaFiles.length},
};
`;

  // Generate category registry
  const categoryEntries = Object.entries(categories)
    .map(([key, data]) => generateCategoryRegistryEntry(key, data))
    .join(",");

  const categoryRegistryContent = `
/**
 * GENERATED CATEGORY REGISTRY
 *
 * This file is auto-generated from YAML configurations.
 * DO NOT EDIT MANUALLY - changes will be overwritten.
 *
 * Generated at: ${new Date().toISOString()}
 */

import type { Category } from "../schemas/base";

export const GENERATED_CATEGORY_REGISTRY: Record<string, Category> = {${categoryEntries}
};

export const CATEGORY_KEYS = Object.keys(GENERATED_CATEGORY_REGISTRY);
export const CATEGORY_COUNT = CATEGORY_KEYS.length;
`;

  // Generate main index
  const indexContent = `
/**
 * GENERATED REGISTRY INDEX
 *
 * Main entry point for generated registries.
 * DO NOT EDIT MANUALLY - changes will be overwritten.
 *
 * Generated at: ${new Date().toISOString()}
 */

export { GENERATED_NODE_REGISTRY, NODE_TYPES, NODE_COUNT, REGISTRY_STATS } from "./nodeRegistry";
export { GENERATED_CATEGORY_REGISTRY, CATEGORY_KEYS, CATEGORY_COUNT } from "./categoryRegistry";

// Re-export schemas for validation
export * from "../schemas/base";
export * from "../schemas/families";

// Registry utilities
export function getNodeByType(nodeType: string) {
  return GENERATED_NODE_REGISTRY[nodeType];
}

export function getCategoryByKey(categoryKey: string) {
  return GENERATED_CATEGORY_REGISTRY[categoryKey];
}

export function getNodesByCategory(category: string) {
  return Object.values(GENERATED_NODE_REGISTRY).filter(node => node.category === category);
}
`;

  // Write generated files
  await writeFile(
    path.join(config.outputDir, "nodeRegistry.ts"),
    nodeRegistryContent
  );
  await writeFile(
    path.join(config.outputDir, "categoryRegistry.ts"),
    categoryRegistryContent
  );
  await writeFile(path.join(config.outputDir, "index.ts"), indexContent);

  const duration = Date.now() - startTime;
  console.log(`✨ Registry generation complete in ${duration}ms`);
  console.log(
    `📊 Generated ${nodes.length} nodes and ${Object.keys(categories).length} categories`
  );
  console.log(`📁 Output written to ${config.outputDir}`);
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const config: GeneratorConfig = {
    ...DEFAULT_CONFIG,
    verbose: args.includes("--verbose") || args.includes("-v"),
    watch: args.includes("--watch") || args.includes("-w"),
  };

  try {
    await generateRegistries(config);

    if (config.watch) {
      console.log("👀 Watching for changes... (Press Ctrl+C to stop)");
      // TODO: Implement file watching
    }
  } catch (error) {
    console.error("❌ Generation failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { DEFAULT_CONFIG, generateRegistries };
