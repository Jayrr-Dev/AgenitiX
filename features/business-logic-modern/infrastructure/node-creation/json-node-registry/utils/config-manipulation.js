#!/usr/bin/env node
/**
 * JSON CONFIG MANIPULATION UTILITIES
 *
 * Provides tools for programmatically updating JSON node configurations
 * This is the main benefit of moving from YAML to JSON - easy programmatic manipulation
 */

const fs = require("fs").promises;
const path = require("path");
const { glob } = require("fast-glob");

// ============================================================================
// CONFIGURATION MANIPULATION UTILITIES
// ============================================================================

/**
 * Load a node configuration from JSON file
 */
async function loadNodeConfig(configPath) {
  try {
    const content = await fs.readFile(configPath, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    throw new Error(
      `Failed to load config from ${configPath}: ${error.message}`
    );
  }
}

/**
 * Save a node configuration to JSON file
 */
async function saveNodeConfig(configPath, config) {
  try {
    const content = JSON.stringify(config, null, 2);
    await fs.writeFile(configPath, content, "utf-8");
    return true;
  } catch (error) {
    throw new Error(`Failed to save config to ${configPath}: ${error.message}`);
  }
}

/**
 * Find all node configuration files
 */
async function findAllNodeConfigs(baseDir = "./domain") {
  const pattern = path.join(baseDir, "**/meta.json").replace(/\\/g, "/");
  return glob(pattern, { absolute: true });
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Update a property across multiple node configurations
 */
async function batchUpdateProperty(
  baseDir,
  propertyPath,
  newValue,
  filter = null
) {
  const configFiles = await findAllNodeConfigs(baseDir);
  const results = [];

  for (const configFile of configFiles) {
    try {
      const config = await loadNodeConfig(configFile);

      // Apply filter if provided
      if (filter && !filter(config)) {
        continue;
      }

      // Update the property using dot notation
      const updated = setNestedProperty(config, propertyPath, newValue);

      if (updated) {
        await saveNodeConfig(configFile, config);
        results.push({
          file: configFile,
          nodeType: config.nodeType,
          success: true,
          updated: propertyPath,
        });
      }
    } catch (error) {
      results.push({
        file: configFile,
        success: false,
        error: error.message,
      });
    }
  }

  return results;
}

/**
 * Add a new property to multiple configurations
 */
async function batchAddProperty(baseDir, propertyPath, value, filter = null) {
  return batchUpdateProperty(baseDir, propertyPath, value, filter);
}

/**
 * Remove a property from multiple configurations
 */
async function batchRemoveProperty(baseDir, propertyPath, filter = null) {
  const configFiles = await findAllNodeConfigs(baseDir);
  const results = [];

  for (const configFile of configFiles) {
    try {
      const config = await loadNodeConfig(configFile);

      // Apply filter if provided
      if (filter && !filter(config)) {
        continue;
      }

      const removed = deleteNestedProperty(config, propertyPath);

      if (removed) {
        await saveNodeConfig(configFile, config);
        results.push({
          file: configFile,
          nodeType: config.nodeType,
          success: true,
          removed: propertyPath,
        });
      }
    } catch (error) {
      results.push({
        file: configFile,
        success: false,
        error: error.message,
      });
    }
  }

  return results;
}

// ============================================================================
// SPECIFIC UPDATE OPERATIONS
// ============================================================================

/**
 * Update UI properties for nodes matching criteria
 */
async function updateUIProperties(baseDir, updates, filter = null) {
  return batchUpdateProperty(baseDir, "ui", updates, (config) => {
    if (filter) {
      return filter(config);
    }
    return true;
  });
}

/**
 * Update handle configurations
 */
async function updateHandleConfig(baseDir, handleUpdates, filter = null) {
  const configFiles = await findAllNodeConfigs(baseDir);
  const results = [];

  for (const configFile of configFiles) {
    try {
      const config = await loadNodeConfig(configFile);

      if (filter && !filter(config)) {
        continue;
      }

      if (config.handles) {
        // Update existing handles
        config.handles = config.handles.map((handle) => {
          const update = handleUpdates.find((u) => u.id === handle.id);
          return update ? { ...handle, ...update } : handle;
        });

        await saveNodeConfig(configFile, config);
        results.push({
          file: configFile,
          nodeType: config.nodeType,
          success: true,
          handlesUpdated: config.handles.length,
        });
      }
    } catch (error) {
      results.push({
        file: configFile,
        success: false,
        error: error.message,
      });
    }
  }

  return results;
}

/**
 * Add feature flags to nodes
 */
async function addFeatureFlags(baseDir, features, filter = null) {
  return batchUpdateProperty(baseDir, "features", features, (config) => {
    if (filter) {
      return filter(config);
    }
    return true;
  });
}

// ============================================================================
// HELPER UTILITIES
// ============================================================================

/**
 * Set nested property using dot notation (e.g., "ui.size.width")
 */
function setNestedProperty(obj, path, value) {
  const keys = path.split(".");
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current) || typeof current[key] !== "object") {
      current[key] = {};
    }
    current = current[key];
  }

  const lastKey = keys[keys.length - 1];
  const oldValue = current[lastKey];
  current[lastKey] = value;

  return oldValue !== value;
}

/**
 * Delete nested property using dot notation
 */
function deleteNestedProperty(obj, path) {
  const keys = path.split(".");
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current) || typeof current[key] !== "object") {
      return false; // Property doesn't exist
    }
    current = current[key];
  }

  const lastKey = keys[keys.length - 1];
  if (lastKey in current) {
    delete current[lastKey];
    return true;
  }

  return false;
}

/**
 * Generate a new node configuration template
 */
function createNodeTemplate(nodeType, category, overrides = {}) {
  const template = {
    _generatedAt: new Date().toISOString(),
    nodeType,
    category,
    displayName: nodeType.charAt(0).toUpperCase() + nodeType.slice(1),
    description: `${nodeType} node`,
    keywords: [nodeType, category],

    ui: {
      size: {
        width: 200,
        height: 100,
      },
      defaultCollapsed: false,
      icon: "box",
      color: "#666666",
    },

    data: {},

    handles: [
      {
        id: "input",
        type: "target",
        position: "left",
        dataType: "any",
      },
      {
        id: "output",
        type: "source",
        position: "right",
        dataType: "any",
      },
    ],

    component: {
      file: `${nodeType.charAt(0).toUpperCase() + nodeType.slice(1)}Component.tsx`,
    },

    features: {
      isEnabled: true,
    },

    sidebar: {
      folder: "main",
      order: 0,
    },

    ...overrides,
  };

  return template;
}

// ============================================================================
// PRESET OPERATIONS
// ============================================================================

/**
 * Common preset operations for batch updates
 */
const presets = {
  /**
   * Update all nodes to use new size format
   */
  async modernizeSizes(baseDir) {
    return batchUpdateProperty(baseDir, "ui.size", (config) => {
      const ui = config.ui || {};
      return {
        width: ui.iconWidth || 200,
        height: ui.iconHeight || 100,
      };
    });
  },

  /**
   * Add error injection support to all create category nodes
   */
  async addErrorInjection(baseDir) {
    return batchUpdateProperty(
      baseDir,
      "features.errorInjection",
      true,
      (config) => config.category === "create"
    );
  },

  /**
   * Update all nodes to have consistent handle formats
   */
  async standardizeHandles(baseDir) {
    return updateHandleConfig(baseDir, [
      { id: "input", position: "left" },
      { id: "output", position: "right" },
    ]);
  },

  /**
   * Add performance optimization flags
   */
  async addPerformanceFlags(baseDir) {
    return addFeatureFlags(baseDir, {
      performanceOptimization: true,
      memoryOptimization: true,
      renderOptimization: true,
    });
  },
};

// ============================================================================
// CLI INTERFACE
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || args.includes("--help")) {
    console.log(`
JSON Config Manipulation Utilities

Usage:
  node config-manipulation.js <command> [options]

Commands:
  batch-update <property> <value> [filter]    Update property across configs
  batch-add <property> <value> [filter]       Add property to configs
  batch-remove <property> [filter]            Remove property from configs
  preset <preset-name>                        Run preset operation
  create-template <nodeType> <category>       Create new node template

Presets:
  modernize-sizes        Update to new size format
  add-error-injection    Add error injection to create nodes
  standardize-handles    Standardize handle formats
  add-performance        Add performance optimization flags

Examples:
  node config-manipulation.js batch-update "ui.color" "#ff0000"
  node config-manipulation.js preset modernize-sizes
  node config-manipulation.js create-template "myNewNode" "create"
`);
    return;
  }

  const baseDir = process.cwd();

  try {
    switch (command) {
      case "batch-update":
        const property = args[1];
        const value = JSON.parse(args[2]);
        const results = await batchUpdateProperty(baseDir, property, value);
        console.log(`Updated ${results.filter((r) => r.success).length} files`);
        break;

      case "preset":
        const presetName = args[1];
        if (presets[presetName.replace(/-/g, "")]) {
          await presets[presetName.replace(/-/g, "")](baseDir);
          console.log(`✅ Applied preset: ${presetName}`);
        } else {
          console.error(`❌ Unknown preset: ${presetName}`);
        }
        break;

      case "create-template":
        const nodeType = args[1];
        const category = args[2];
        const template = createNodeTemplate(nodeType, category);
        console.log(JSON.stringify(template, null, 2));
        break;

      default:
        console.error(`❌ Unknown command: ${command}`);
    }
  } catch (error) {
    console.error("💥 Operation failed:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  loadNodeConfig,
  saveNodeConfig,
  findAllNodeConfigs,
  batchUpdateProperty,
  batchAddProperty,
  batchRemoveProperty,
  updateUIProperties,
  updateHandleConfig,
  addFeatureFlags,
  createNodeTemplate,
  presets,
};
