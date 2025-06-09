#!/usr/bin/env node

/**
 * MIGRATE NODE DOMAIN SCRIPT
 *
 * Consolidates the old /node-domain structure with the new YAML-based registry system.
 * This script performs a comprehensive migration that:
 *
 * 1. Backs up original node-domain files
 * 2. Copies component files to new domain structure
 * 3. Updates imports and paths
 * 4. Validates YAML configurations
 * 5. Generates updated registry
 * 6. Creates migration report
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Configuration
const CONFIG = {
  // Paths
  nodeDomainPath: "../../../../node-domain",
  domainPath: "../domain",
  backupPath: "../backups/node-domain-backup-" + Date.now(),

  // Migration mappings
  nodeMappings: {
    "CreateText.tsx": "create/createText/CreateTextComponent.tsx",
    "ViewOutput.tsx": "view/viewOutput/ViewOutputComponent.tsx",
    "TriggerOnToggle.tsx":
      "trigger/triggerOnToggle/TriggerOnToggleComponent.tsx",
    "TestError.tsx": "test/testError/TestErrorComponent.tsx",
  },

  // YAML configurations already created
  yamlConfigs: {
    createText: "create/createText/meta.yml",
    viewOutput: "view/viewOutput/meta.yml",
    triggerOnToggle: "trigger/triggerOnToggle/meta.yml",
    testError: "test/testError/meta.yml",
  },

  // Import replacements
  importReplacements: [
    {
      from: "@node-creation/factory/NodeFactory",
      to: "../../base/NodeFactory",
    },
    {
      from: "@factory/constants/handles",
      to: "../../utils/handleUtils",
    },
    {
      from: "@factory/hooks/useOptimizedTextInput",
      to: "../../hooks/useOptimizedTextInput",
    },
    {
      from: "infrastructure/flow-engine/hooks/useTextInputShortcuts",
      to: "../../../../../flow-engine/hooks/useTextInputShortcuts",
    },
  ],
};

/**
 * MAIN MIGRATION FUNCTION
 */
async function migrateNodeDomain() {
  console.log("🚀 Starting Node Domain Migration...\n");

  try {
    // Step 1: Validate prerequisites
    await validatePrerequisites();

    // Step 2: Create backup
    await createBackup();

    // Step 3: Copy and update components
    await migrateComponents();

    // Step 4: Validate YAML configurations
    await validateYamlConfigs();

    // Step 5: Update registry system
    await updateRegistry();

    // Step 6: Generate migration report
    await generateMigrationReport();

    console.log("✅ Migration completed successfully!\n");
    console.log("📋 Next steps:");
    console.log("1. Run: pnpm run build-registry");
    console.log("2. Test the migrated nodes");
    console.log("3. Update any remaining imports");
    console.log("4. Remove old node-domain directory when satisfied\n");
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    console.log("\n🔄 Rolling back changes...");
    await rollbackChanges();
    process.exit(1);
  }
}

/**
 * VALIDATE PREREQUISITES
 */
async function validatePrerequisites() {
  console.log("🔍 Validating prerequisites...");

  const nodeDomainPath = path.resolve(__dirname, CONFIG.nodeDomainPath);
  const domainPath = path.resolve(__dirname, CONFIG.domainPath);

  console.log(`Checking node-domain at: ${nodeDomainPath}`);
  console.log(`Checking domain at: ${domainPath}`);

  const nodeDomainExists = fs.existsSync(nodeDomainPath);
  const domainExists = fs.existsSync(domainPath);

  console.log(`Node domain exists: ${nodeDomainExists}`);
  console.log(`Domain exists: ${domainExists}`);

  if (!nodeDomainExists) {
    throw new Error(`Node domain directory not found: ${nodeDomainPath}`);
  }

  if (!domainExists) {
    throw new Error(`Domain directory not found: ${domainPath}`);
  }

  console.log("✓ Prerequisites validated");
}

/**
 * CREATE BACKUP
 */
async function createBackup() {
  console.log("💾 Creating backup...");

  const backupDir = path.resolve(__dirname, CONFIG.backupPath);
  const sourceDir = path.resolve(__dirname, CONFIG.nodeDomainPath);

  // Create backup directory
  fs.mkdirSync(backupDir, { recursive: true });

  // Copy node-domain to backup (Windows compatible)
  if (process.platform === "win32") {
    execSync(`xcopy "${sourceDir}" "${backupDir}\\node-domain\\" /E /I /H`, {
      stdio: "inherit",
    });
  } else {
    execSync(`cp -r "${sourceDir}" "${backupDir}/"`, { stdio: "inherit" });
  }

  console.log(`✓ Backup created at: ${CONFIG.backupPath}`);
}

/**
 * MIGRATE COMPONENTS
 */
async function migrateComponents() {
  console.log("📦 Migrating components...");

  const sourcePath = path.resolve(__dirname, CONFIG.nodeDomainPath);
  const targetPath = path.resolve(__dirname, CONFIG.domainPath);

  for (const [sourceFile, targetFile] of Object.entries(CONFIG.nodeMappings)) {
    console.log(`  • ${sourceFile} → ${targetFile}`);

    // Find source file in node-domain subdirectories
    const sourceFilePath = findFileInDirectory(sourcePath, sourceFile);
    if (!sourceFilePath) {
      console.warn(`    ⚠️  Source file not found: ${sourceFile}`);
      continue;
    }

    // Create target directory
    const targetFilePath = path.join(targetPath, targetFile);
    const targetDir = path.dirname(targetFilePath);
    fs.mkdirSync(targetDir, { recursive: true });

    // Read source file
    let content = fs.readFileSync(sourceFilePath, "utf8");

    // Update imports
    for (const replacement of CONFIG.importReplacements) {
      content = content.replace(
        new RegExp(
          replacement.from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          "g"
        ),
        replacement.to
      );
    }

    // Add migration header comment
    const migrationHeader = `/**
 * MIGRATED FROM: ${sourceFile}
 * Migration Date: ${new Date().toISOString()}
 *
 * This component was migrated from the old node-domain structure
 * to the new YAML-based registry system.
 */

`;

    content = migrationHeader + content;

    // Write to target
    fs.writeFileSync(targetFilePath, content);
    console.log(`    ✓ Migrated successfully`);
  }
}

/**
 * VALIDATE YAML CONFIGURATIONS
 */
async function validateYamlConfigs() {
  console.log("📋 Validating YAML configurations...");

  const domainPath = path.resolve(__dirname, CONFIG.domainPath);

  for (const [nodeType, yamlPath] of Object.entries(CONFIG.yamlConfigs)) {
    const fullYamlPath = path.join(domainPath, yamlPath);

    if (!fs.existsSync(fullYamlPath)) {
      throw new Error(`YAML config not found: ${yamlPath}`);
    }

    try {
      // Basic YAML syntax validation using Node.js
      const yaml = require("yaml");
      const content = fs.readFileSync(fullYamlPath, "utf8");
      const parsed = yaml.parse(content);

      // Validate required fields
      if (!parsed.nodeType || parsed.nodeType !== nodeType) {
        throw new Error(`Invalid nodeType in ${yamlPath}`);
      }

      if (!parsed.category) {
        throw new Error(`Missing category in ${yamlPath}`);
      }

      console.log(`    ✓ ${nodeType}: ${yamlPath}`);
    } catch (error) {
      throw new Error(
        `YAML validation failed for ${yamlPath}: ${error.message}`
      );
    }
  }
}

/**
 * UPDATE REGISTRY SYSTEM
 */
async function updateRegistry() {
  console.log("🏗️  Updating registry system...");

  try {
    // Run the registry build script from the correct directory
    const buildScript = path.resolve(__dirname, "build-registry.js");
    const registryDir = path.resolve(__dirname, "..");

    // Change to registry directory and run build (Windows compatible)
    if (process.platform === "win32") {
      execSync(`cd /d "${registryDir}" && node "${buildScript}"`, {
        stdio: "inherit",
      });
    } else {
      execSync(`cd "${registryDir}" && node "${buildScript}"`, {
        stdio: "inherit",
      });
    }
    console.log("    ✓ Registry updated successfully");
  } catch (error) {
    throw new Error(`Registry update failed: ${error.message}`);
  }
}

/**
 * GENERATE MIGRATION REPORT
 */
async function generateMigrationReport() {
  console.log("📊 Generating migration report...");

  const report = {
    timestamp: new Date().toISOString(),
    migratedNodes: Object.keys(CONFIG.nodeMappings),
    yamlConfigs: Object.keys(CONFIG.yamlConfigs),
    backupLocation: CONFIG.backupPath,
    status: "completed",
    nextSteps: [
      "Run: pnpm run build-registry",
      "Test migrated nodes",
      "Update remaining imports",
      "Remove old node-domain when satisfied",
    ],
  };

  const reportPath = path.resolve(__dirname, "../migration-report.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(`✓ Migration report saved: ${reportPath}`);
}

/**
 * ROLLBACK CHANGES
 */
async function rollbackChanges() {
  // Implementation for rollback if needed
  console.log(
    "⚠️  Rollback not implemented yet - check backup at:",
    CONFIG.backupPath
  );
}

/**
 * UTILITY: Find file in directory recursively
 */
function findFileInDirectory(dir, filename) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      const found = findFileInDirectory(fullPath, filename);
      if (found) return found;
    } else if (file === filename) {
      return fullPath;
    }
  }

  return null;
}

// Run migration if called directly
if (require.main === module) {
  migrateNodeDomain().catch(console.error);
}

module.exports = { migrateNodeDomain, CONFIG };
