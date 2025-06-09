#!/usr/bin/env node
/**
 * REGISTRY CODE GENERATOR (JSON Version)
 *
 * • Scans domain folders for meta.json files
 * • Generates TypeScript registry files
 * • Handles categories, nodes, and inspector configs
 * • Creates type-safe barrel exports
 *
 * Usage: node gen-registry-json.js [--verbose]
 */

const fs = require("fs").promises;
const path = require("path");
const { glob } = require("fast-glob");

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
// CODE GENERATION (Same as YAML version)
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
      path.join(process.cwd(), "generated"),
      path.join(domainPath, componentFile)
    )
    .replace(/\\/g, "/");

  const relativeInspectorPath = inspectorFile
    ? path
        .relative(
          path.join(process.cwd(), "generated"),
          path.join(domainPath, inspectorFile)
        )
        .replace(/\\/g, "/")
    : null;

  // Extract values from JSON structure
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

// ============================================================================
// MAIN GENERATION LOGIC
// ============================================================================

async function generateRegistries(config) {
  const startTime = Date.now();

  if (config.verbose) {
    console.log("🔧 Starting JSON registry generation...");
    console.log(`📁 Base directory: ${config.baseDir}`);
    console.log(`📂 Domain directory: ${config.domainDir}`);
    console.log(`📤 Output directory: ${config.outputDir}`);
  }

  // Load categories
  const categories = await loadCategories(config.metaDir);
  if (config.verbose) {
    console.log(`📋 Loaded ${Object.keys(categories).length} categories`);
  }

  // Find all meta.json files
  const metaFiles = await findNodeMetaFiles(config.domainDir);
  if (config.verbose) {
    console.log(`📄 Found ${metaFiles.length} meta.json files`);
  }

  // Load all node metadata
  const nodes = [];
  for (const metaFile of metaFiles) {
    try {
      const { nodeData, domainPath } = await loadNodeMetadata(metaFile);
      nodes.push({ nodeData, domainPath, metaFile });
      if (config.verbose) {
        console.log(`✅ Loaded: ${nodeData.nodeType}`);
      }
    } catch (error) {
      console.warn(`⚠️  Failed to load ${metaFile}:`, error.message);
    }
  }

  // Generate node registry
  const nodeEntries = nodes.map(({ nodeData, domainPath }) =>
    generateNodeRegistryEntry(nodeData, domainPath)
  );

  const nodeRegistryContent = `
/**
 * GENERATED NODE REGISTRY (JSON Version)
 *
 * This file is auto-generated from JSON configurations.
 * DO NOT EDIT MANUALLY - changes will be overwritten.
 *
 * Generated at: ${new Date().toISOString()}
 * Source files: ${nodes.length} meta.json files
 */

export const GENERATED_NODE_REGISTRY = {${nodeEntries.join(",")}
};

export const NODE_TYPES = Object.keys(GENERATED_NODE_REGISTRY);
export const NODE_COUNT = NODE_TYPES.length;

export const REGISTRY_STATS = {
  nodeCount: NODE_COUNT,
  generatedAt: "${new Date().toISOString()}",
  sourceFormat: "JSON"
};
`;

  // Write node registry
  const nodeRegistryPath = path.join(config.outputDir, "nodeRegistry.ts");
  await writeFile(nodeRegistryPath, nodeRegistryContent);

  if (config.verbose) {
    console.log(`✅ Generated node registry: ${nodeRegistryPath}`);
    console.log(`⏱️  Build completed in ${Date.now() - startTime}ms`);
  }
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const config = { ...DEFAULT_CONFIG };

  if (args.includes("--verbose")) {
    config.verbose = true;
  }

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
JSON Registry Generator

Usage:
  node gen-registry-json.js [options]

Options:
  --verbose     Enable verbose output
  --help, -h    Show this help

Examples:
  node gen-registry-json.js
  node gen-registry-json.js --verbose
`);
    return;
  }

  await generateRegistries(config);
}

if (require.main === module) {
  main();
}

module.exports = { generateRegistries };
