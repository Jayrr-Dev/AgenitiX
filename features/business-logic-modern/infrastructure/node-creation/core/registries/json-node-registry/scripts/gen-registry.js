#!/usr/bin/env node
/**
 * REGISTRY CODE GENERATOR (JSON Version)
 *
 * • Scans domain folders for meta.json files
 * • Generates TypeScript registry files
 * • Handles categories, nodes, and inspector configs
 * • Creates type-safe barrel exports
 *
 * Usage: node gen-registry.js [--verbose]
 */

const fs = require("fs").promises;
const path = require("path");
const { glob } = require("fast-glob");

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG = {
  baseDir: process.cwd(),
  metaDir: path.join(__dirname, "../meta"),
  domainDir: path.join(process.cwd(), "features/business-logic-modern/node-domain"),
  outputDir: path.join(__dirname, "../generated"),
  verbose: false,
  watch: false,
  validate: true,
  environment: process.env.NODE_ENV || "development",
};

// ============================================================================
// FILE SYSTEM UTILITIES
// ============================================================================

async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
}

async function readJsonFile(filePath) {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to read/parse ${filePath}: ${error}`);
  }
}

async function writeFile(filePath, content) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, "utf-8");
}

// ============================================================================
// JSON DISCOVERY AND PROCESSING
// ============================================================================

async function findNodeMetaFiles(domainDir) {
  const pattern = path.join(domainDir, "**/meta.json").replace(/\\/g, "/");
  return glob(pattern, { absolute: true });
}

async function loadNodeMetadata(filePath) {
  const nodeData = await readJsonFile(filePath);
  const domainPath = path.dirname(filePath);
  return { nodeData, domainPath };
}

async function loadCategories(metaDir) {
  const categoriesPath = path.join(metaDir, "categories.json");
  try {
    const content = await fs.readFile(categoriesPath, "utf-8");
    const parsed = JSON.parse(content);
    return parsed.categories || {};
  } catch (error) {
    console.warn(`Could not load categories from ${categoriesPath}:`, error);
    return {};
  }
}

// ============================================================================
// CODE GENERATION
// ============================================================================

function generateNodeRegistryEntry(nodeData, domainPath) {
  // Handle new JSON structure where component info is nested
  const componentFile =
    nodeData.component?.file ||
    nodeData.component ||
    `${nodeData.nodeType}Component.tsx`;
  const inspectorFile =
    nodeData.component?.inspectorComponent || nodeData.inspectorComponent;

  const relativeComponentPath = path
    .relative(
      path.dirname(__filename),
      path.join(domainPath, componentFile)
    )
    .replace(/\\/g, "/");

  const relativeInspectorPath = inspectorFile
    ? path
        .relative(
          path.dirname(__filename),
          path.join(domainPath, inspectorFile)
        )
        .replace(/\\/g, "/")
    : null;

  // Extract values from new JSON structure
  const ui = nodeData.ui || {};
  const sidebar = nodeData.sidebar || {};
  const defaultData = {};

  // Convert data schema to default data
  if (nodeData.data) {
    for (const [key, schema] of Object.entries(nodeData.data)) {
      if (schema.default !== undefined) {
        defaultData[key] = schema.default;
      }
    }
  }

  return `
  "${nodeData.nodeType}": {
    nodeType: "${nodeData.nodeType}",
    category: "${nodeData.category}",
    displayName: "${nodeData.displayName}",
    description: "${nodeData.description}",
    icon: "${ui.icon || "box"}",
    folder: "${sidebar.folder || "main"}",
    order: ${sidebar.order || 0},

    // Legacy dimensions (derived from modern size)
    iconWidth: ${ui.size?.width || 200},
    iconHeight: ${ui.size?.height || 100},
    expandedWidth: ${ui.size?.width || 200},
    expandedHeight: ${ui.size?.height || 100},

    // Modern size
    ${ui.size ? `size: ${JSON.stringify(ui.size, null, 4)},` : ""}

    // UI Configuration
    hasToggle: ${!ui.defaultCollapsed},
    isEnabled: true,
    isExperimental: false,

    // Handles
    handles: ${JSON.stringify(nodeData.handles || [], null, 4)},

    // Default data (generated from schema)
    defaultData: ${JSON.stringify(defaultData, null, 4)},

    // Component imports
    component: () => import("${relativeComponentPath}"),
    ${relativeInspectorPath ? `inspectorComponent: () => import("${relativeInspectorPath}"),` : ""}
  }`;
}

function generateCategoryRegistryEntry(categoryKey, categoryData) {
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

async function generateRegistries(config) {
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

  const nodes = [];
  const errors = [];

  for (const filePath of metaFiles) {
    try {
      const nodeInfo = await loadNodeMetadata(filePath);
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
 * This file is auto-generated from JSON configurations.
 * DO NOT EDIT MANUALLY - changes will be overwritten.
 *
 * Generated at: ${new Date().toISOString()}
 * Source files: ${metaFiles.length} meta.json files
 */

export const GENERATED_NODE_REGISTRY = {${nodeEntries}
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
 * This file is auto-generated from JSON configurations.
 * DO NOT EDIT MANUALLY - changes will be overwritten.
 *
 * Generated at: ${new Date().toISOString()}
 */

export const GENERATED_CATEGORY_REGISTRY = {${categoryEntries}
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

  // Generate summary report
  if (config.verbose) {
    console.log("\n📋 Generation Summary:");
    console.log(`   Environment: ${config.environment}`);
    console.log(
      `   Validation: ${config.validate ? "✅ Enabled" : "❌ Disabled"}`
    );
    console.log(`   Categories: ${Object.keys(categories).join(", ")}`);
    console.log(
      `   Node Types: ${nodes.map((n) => n.nodeData.nodeType).join(", ")}`
    );

    // File sizes
    const nodeRegistrySize = Buffer.byteLength(nodeRegistryContent, "utf8");
    const categoryRegistrySize = Buffer.byteLength(
      categoryRegistryContent,
      "utf8"
    );
    console.log(`   Generated Files:`);
    console.log(
      `     nodeRegistry.ts: ${(nodeRegistrySize / 1024).toFixed(1)}KB`
    );
    console.log(
      `     categoryRegistry.ts: ${(categoryRegistrySize / 1024).toFixed(1)}KB`
    );
  }
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const config = {
    ...DEFAULT_CONFIG,
    verbose: args.includes("--verbose") || args.includes("-v"),
  };

  try {
    await generateRegistries(config);
  } catch (error) {
    console.error("❌ Generation failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { generateRegistries, DEFAULT_CONFIG };
