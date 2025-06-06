#!/usr/bin/env node
/**
 * REGISTRY CODE GENERATOR (JavaScript Version)
 *
 * • Scans domain folders for meta.yml files
 * • Generates TypeScript registry files
 * • Handles categories, nodes, and inspector configs
 * • Creates type-safe barrel exports
 *
 * Usage: node gen-registry.js [--verbose]
 */

const fs = require("fs").promises;
const path = require("path");
const { glob } = require("fast-glob");
const YAML = require("yaml");

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG = {
  baseDir: process.cwd(),
  metaDir: "./meta",
  domainDir: "./domain",
  outputDir: "./generated",
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

async function readYamlFile(filePath) {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return YAML.parse(content);
  } catch (error) {
    throw new Error(`Failed to read/parse ${filePath}: ${error}`);
  }
}

async function writeFile(filePath, content) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, "utf-8");
}

// ============================================================================
// YAML DISCOVERY AND PROCESSING
// ============================================================================

async function findNodeMetaFiles(domainDir) {
  const pattern = path.join(domainDir, "**/meta.yml").replace(/\\/g, "/");
  return glob(pattern, { absolute: true });
}

async function loadNodeMetadata(filePath) {
  const nodeData = await readYamlFile(filePath);
  const domainPath = path.dirname(filePath);
  return { nodeData, domainPath };
}

async function loadCategories(metaDir) {
  const categoriesPath = path.join(metaDir, "categories.yml");
  try {
    const content = await fs.readFile(categoriesPath, "utf-8");
    const parsed = YAML.parse(content);
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
    order: ${nodeData.order || 0},

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
 * This file is auto-generated from YAML configurations.
 * DO NOT EDIT MANUALLY - changes will be overwritten.
 *
 * Generated at: ${new Date().toISOString()}
 * Source files: ${metaFiles.length} meta.yml files
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
 * This file is auto-generated from YAML configurations.
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
