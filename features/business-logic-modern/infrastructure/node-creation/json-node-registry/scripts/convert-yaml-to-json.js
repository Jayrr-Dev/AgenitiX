#!/usr/bin/env node
/**
 * YAML TO JSON CONVERTER
 *
 * Converts all YAML configuration files to JSON format
 * This enables easier programmatic manipulation of node configurations
 */

const fs = require("fs").promises;
const path = require("path");
const { glob } = require("fast-glob");
const YAML = require("yaml");

// ============================================================================
// CONVERSION UTILITIES
// ============================================================================

async function convertYamlToJson(yamlPath) {
  try {
    const yamlContent = await fs.readFile(yamlPath, "utf-8");
    const parsed = YAML.parse(yamlContent);

    // Add metadata about conversion
    const jsonData = {
      _convertedFrom: path.basename(yamlPath),
      _convertedAt: new Date().toISOString(),
      ...parsed,
    };

    const jsonPath = yamlPath.replace(/\.ya?ml$/, ".json");
    await fs.writeFile(jsonPath, JSON.stringify(jsonData, null, 2));

    console.log(
      `✅ Converted: ${path.basename(yamlPath)} → ${path.basename(jsonPath)}`
    );
    return { yamlPath, jsonPath, success: true };
  } catch (error) {
    console.error(`❌ Failed to convert ${yamlPath}:`, error.message);
    return { yamlPath, success: false, error: error.message };
  }
}

async function findAllYamlFiles(baseDir) {
  const patterns = [
    path.join(baseDir, "**/*.yml").replace(/\\/g, "/"),
    path.join(baseDir, "**/*.yaml").replace(/\\/g, "/"),
  ];

  const files = [];
  for (const pattern of patterns) {
    const found = await glob(pattern, { absolute: true });
    files.push(...found);
  }

  return [...new Set(files)]; // Remove duplicates
}

// ============================================================================
// MAIN CONVERSION PROCESS
// ============================================================================

async function convertAllYamlToJson(baseDir = ".") {
  console.log("🔄 Starting YAML to JSON conversion...");
  console.log(`📁 Base directory: ${path.resolve(baseDir)}`);

  const yamlFiles = await findAllYamlFiles(baseDir);
  console.log(`📄 Found ${yamlFiles.length} YAML files`);

  const results = [];
  for (const yamlFile of yamlFiles) {
    const result = await convertYamlToJson(yamlFile);
    results.push(result);
  }

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  console.log(`\n📊 Conversion Summary:`);
  console.log(`✅ Successful: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);

  if (failed.length > 0) {
    console.log(`\n❌ Failed conversions:`);
    failed.forEach((f) => console.log(`  - ${f.yamlPath}: ${f.error}`));
  }

  // Generate conversion report
  const report = {
    timestamp: new Date().toISOString(),
    baseDirectory: path.resolve(baseDir),
    totalFiles: yamlFiles.length,
    successful: successful.length,
    failed: failed.length,
    conversions: successful.map((r) => ({
      from: path.relative(baseDir, r.yamlPath),
      to: path.relative(baseDir, r.jsonPath),
    })),
    errors: failed.map((r) => ({
      file: path.relative(baseDir, r.yamlPath),
      error: r.error,
    })),
  };

  const reportPath = path.join(baseDir, "conversion-report.json");
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(`📋 Conversion report saved: ${reportPath}`);

  return report;
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const baseDir = args[0] || ".";

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
YAML to JSON Converter

Usage:
  node convert-yaml-to-json.js [directory]

Arguments:
  directory    Base directory to search for YAML files (default: current directory)

Options:
  --help, -h   Show this help message

Examples:
  node convert-yaml-to-json.js
  node convert-yaml-to-json.js ./domain
  node convert-yaml-to-json.js ./meta
`);
    return;
  }

  try {
    await convertAllYamlToJson(baseDir);
    console.log("🎉 Conversion completed!");
  } catch (error) {
    console.error("💥 Conversion failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { convertAllYamlToJson, convertYamlToJson };
