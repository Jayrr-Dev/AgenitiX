#!/usr/bin/env node
/**
 * YAML CLEANUP SCRIPT
 *
 * Safely removes YAML files after transitioning to JSON-based system
 * Ensures JSON equivalents exist before removing YAML files
 */

const fs = require("fs").promises;
const path = require("path");
const { glob } = require("fast-glob");

// ============================================================================
// CLEANUP UTILITIES
// ============================================================================

/**
 * Find all YAML files in the project
 */
async function findAllYamlFiles(baseDir = ".") {
  const patterns = [
    path.join(baseDir, "**/*.yml").replace(/\\/g, "/"),
    path.join(baseDir, "**/*.yaml").replace(/\\/g, "/"),
  ];

  const files = [];
  for (const pattern of patterns) {
    const found = await glob(pattern, { absolute: true });
    files.push(...found);
  }

  return [...new Set(files)];
}

/**
 * Check if JSON equivalent exists for a YAML file
 */
async function hasJsonEquivalent(yamlPath) {
  const jsonPath = yamlPath.replace(/\.ya?ml$/, ".json");
  try {
    await fs.access(jsonPath);
    return { exists: true, jsonPath };
  } catch {
    return { exists: false, jsonPath };
  }
}

/**
 * Backup YAML file before deletion
 */
async function backupYamlFile(yamlPath, backupDir) {
  const fileName = path.basename(yamlPath);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFileName = `${timestamp}_${fileName}`;
  const backupPath = path.join(backupDir, backupFileName);

  await fs.mkdir(backupDir, { recursive: true });
  await fs.copyFile(yamlPath, backupPath);

  return backupPath;
}

/**
 * Safely remove YAML file
 */
async function removeYamlFile(yamlPath, options = {}) {
  const { backup = true, backupDir = "./yaml-cleanup-backup" } = options;

  let backupPath = null;
  if (backup) {
    backupPath = await backupYamlFile(yamlPath, backupDir);
  }

  await fs.unlink(yamlPath);

  return {
    removed: yamlPath,
    backup: backupPath,
  };
}

// ============================================================================
// MAIN CLEANUP PROCESS
// ============================================================================

async function cleanupYamlFiles(baseDir = ".", options = {}) {
  const {
    dryRun = false,
    backup = true,
    backupDir = "./yaml-cleanup-backup",
    requireJsonEquivalent = true,
  } = options;

  console.log(`🧹 Starting YAML cleanup${dryRun ? " (DRY RUN)" : ""}...`);
  console.log(`📁 Base directory: ${path.resolve(baseDir)}`);

  const yamlFiles = await findAllYamlFiles(baseDir);
  console.log(`📄 Found ${yamlFiles.length} YAML files`);

  const results = {
    total: yamlFiles.length,
    removed: [],
    skipped: [],
    errors: [],
  };

  for (const yamlFile of yamlFiles) {
    try {
      const relativePath = path.relative(baseDir, yamlFile);

      // Check if JSON equivalent exists (if required)
      if (requireJsonEquivalent) {
        const { exists, jsonPath } = await hasJsonEquivalent(yamlFile);

        if (!exists) {
          console.log(
            `⚠️  Skipping ${relativePath} - no JSON equivalent found`
          );
          results.skipped.push({
            file: relativePath,
            reason: "No JSON equivalent",
            expectedJsonPath: path.relative(baseDir, jsonPath),
          });
          continue;
        }

        console.log(`✅ JSON equivalent exists for ${relativePath}`);
      }

      if (!dryRun) {
        const result = await removeYamlFile(yamlFile, { backup, backupDir });
        results.removed.push({
          file: relativePath,
          backup: result.backup ? path.relative(baseDir, result.backup) : null,
        });
        console.log(
          `🗑️  Removed: ${relativePath}${result.backup ? ` (backed up)` : ""}`
        );
      } else {
        console.log(`🔍 Would remove: ${relativePath}`);
        results.removed.push({ file: relativePath, backup: null });
      }
    } catch (error) {
      const relativePath = path.relative(baseDir, yamlFile);
      console.error(`❌ Failed to process ${relativePath}:`, error.message);
      results.errors.push({
        file: relativePath,
        error: error.message,
      });
    }
  }

  // Generate cleanup report
  const report = {
    timestamp: new Date().toISOString(),
    baseDirectory: path.resolve(baseDir),
    options,
    results,
    summary: {
      totalFiles: results.total,
      removed: results.removed.length,
      skipped: results.skipped.length,
      errors: results.errors.length,
    },
  };

  if (!dryRun) {
    const reportPath = path.join(baseDir, "yaml-cleanup-report.json");
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`📋 Cleanup report saved: ${reportPath}`);
  }

  console.log(`\n📊 Cleanup Summary:`);
  console.log(`✅ Removed: ${results.removed.length}`);
  console.log(`⚠️  Skipped: ${results.skipped.length}`);
  console.log(`❌ Errors: ${results.errors.length}`);

  if (results.skipped.length > 0) {
    console.log(`\n⚠️  Skipped files:`);
    results.skipped.forEach((s) => console.log(`  - ${s.file}: ${s.reason}`));
  }

  if (results.errors.length > 0) {
    console.log(`\n❌ Errors:`);
    results.errors.forEach((e) => console.log(`  - ${e.file}: ${e.error}`));
  }

  return report;
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  const options = {
    dryRun: args.includes("--dry-run"),
    backup: !args.includes("--no-backup"),
    requireJsonEquivalent: !args.includes("--force"),
    backupDir: "./yaml-cleanup-backup",
  };

  const baseDir = args.find((arg) => !arg.startsWith("--")) || ".";

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
YAML Cleanup Script

Usage:
  node cleanup-yaml.js [directory] [options]

Arguments:
  directory    Base directory to clean (default: current directory)

Options:
  --dry-run              Show what would be removed without actually removing
  --no-backup            Don't create backup copies of YAML files
  --force                Remove YAML files even if no JSON equivalent exists
  --help, -h             Show this help message

Examples:
  node cleanup-yaml.js --dry-run
  node cleanup-yaml.js ./domain --no-backup
  node cleanup-yaml.js --force
`);
    return;
  }

  try {
    await cleanupYamlFiles(baseDir, options);

    if (!options.dryRun) {
      console.log("🎉 YAML cleanup completed!");
    } else {
      console.log(
        "🔍 Dry run completed. Use without --dry-run to actually remove files."
      );
    }
  } catch (error) {
    console.error("💥 Cleanup failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { cleanupYamlFiles, findAllYamlFiles, hasJsonEquivalent };
