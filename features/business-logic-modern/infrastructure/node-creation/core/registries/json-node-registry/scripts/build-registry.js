#!/usr/bin/env node
/**
 * REGISTRY BUILD INTEGRATION
 *
 * Integrates registry generation into the build pipeline
 * Handles environment-specific optimizations and validation
 */

const { generateRegistries } = require("./gen-registry.js");
const fs = require("fs").promises;
const path = require("path");

const BUILD_CONFIG = {
  development: {
    metaDir: path.join(__dirname, "../meta"),
    domainDir: path.join(process.cwd(), "features/business-logic-modern/node-domain"),
    outputDir: path.join(__dirname, "../generated"),
    verbose: true,
    validate: true,
    watch: false,
    minify: false,
    sourceMap: true,
  },

  production: {
    metaDir: path.join(__dirname, "../meta"),
    domainDir: path.join(process.cwd(), "features/business-logic-modern/node-domain"),
    outputDir: path.join(__dirname, "../generated"),
    verbose: false,
    validate: true,
    watch: false,
    minify: true,
    sourceMap: false,
  },

  test: {
    metaDir: path.join(__dirname, "../meta"),
    domainDir: path.join(process.cwd(), "features/business-logic-modern/node-domain"),
    outputDir: path.join(__dirname, "../test-generated"),
    verbose: false,
    validate: true,
    watch: false,
    minify: false,
    sourceMap: true,
  },
};

/**
 * Clean previous build artifacts
 */
async function cleanBuild(outputDir) {
  try {
    await fs.rm(outputDir, { recursive: true, force: true });
    console.log(`🧹 Cleaned ${outputDir}`);
  } catch (error) {
    // Directory might not exist
  }
}

/**
 * Validate build prerequisites
 */
async function validatePrerequisites(config) {
  const errors = [];

  // Check if source directories exist
  try {
    await fs.access(config.domainDir);
  } catch {
    errors.push(`Domain directory not found: ${config.domainDir}`);
  }

  try {
    await fs.access(config.metaDir);
  } catch {
    errors.push(`Meta directory not found: ${config.metaDir}`);
  }

  if (errors.length > 0) {
    throw new Error(`Build prerequisites failed:\n${errors.join("\n")}`);
  }
}

/**
 * Generate build manifest
 */
async function generateBuildManifest(config, stats) {
  const manifest = {
    version: "1.0.0",
    buildTime: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    config: {
      outputDir: config.outputDir,
      sourceDir: config.domainDir,
      validate: config.validate,
    },
    stats: {
      nodeCount: stats.nodeCount,
      categoryCount: stats.categoryCount,
      buildDuration: stats.buildDuration,
    },
    files: ["nodeRegistry.ts", "categoryRegistry.ts", "index.ts"],
  };

  const manifestPath = path.join(config.outputDir, "build-manifest.json");
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`📋 Generated build manifest: ${manifestPath}`);
}

/**
 * Main build function
 */
async function buildRegistry(
  environment = process.env.NODE_ENV || "development"
) {
  const startTime = Date.now();
  console.log(`🏗️  Building registry for ${environment} environment...`);

  const config = BUILD_CONFIG[environment] || BUILD_CONFIG.development;

  try {
    // Validate prerequisites
    await validatePrerequisites(config);

    // Clean previous build
    await cleanBuild(config.outputDir);

    // Generate registries
    await generateRegistries(config);

    // Build stats
    const buildDuration = Date.now() - startTime;
    const stats = {
      nodeCount: 0, // Will be populated by generator
      categoryCount: 0, // Will be populated by generator
      buildDuration,
    };

    // Generate build manifest
    await generateBuildManifest(config, stats);

    console.log(`✅ Registry build complete in ${buildDuration}ms`);
    console.log(`📦 Environment: ${environment}`);
    console.log(`📁 Output: ${config.outputDir}`);
  } catch (error) {
    console.error(`❌ Registry build failed:`, error);
    process.exit(1);
  }
}

/**
 * CLI interface
 */
async function main() {
  const args = process.argv.slice(2);
  const environment = args[0] || process.env.NODE_ENV || "development";

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
Registry Build Tool

Usage:
  node build-registry.js [environment] [options]

Environments:
  development (default)
  production
  test

Options:
  --help, -h    Show this help message

Examples:
  node build-registry.js
  node build-registry.js production
  node build-registry.js development
`);
    return;
  }

  await buildRegistry(environment);
}

if (require.main === module) {
  main();
}

module.exports = { buildRegistry, BUILD_CONFIG };
