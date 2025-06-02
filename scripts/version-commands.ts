import * as fs from "fs";
import { autoMigrator } from "../features/business-logic-modern/infrastructure/versioning/auto-migrate";
import { dashboard } from "../features/business-logic-modern/infrastructure/versioning/status-dashboard";
import { versionDetector } from "../features/business-logic-modern/infrastructure/versioning/version-detector";

/**
 * CLI COMMANDS - Easy ways to check system status with pnpm
 */

async function handleCommand(command: string) {
  try {
    switch (command) {
      case "status":
        dashboard.printStatus();
        break;

      case "watch":
        console.log("👀 Starting version monitoring with pnpm...");
        console.log("💡 Make changes to files and watch versions auto-update!");
        console.log("🔧 Available commands while watching:");
        console.log("   pnpm version:status  (check status)");
        console.log("   pnpm version:check   (manual check)");
        console.log("🛑 Press Ctrl+C to stop\n");
        dashboard.startRealTimeMonitoring();
        break;

      case "check":
        console.log("🔍 Checking for changes...");
        const changes = await versionDetector.detectChanges();
        if (changes) {
          console.log(`✅ Changes detected! New version: ${changes.version}`);
          console.log(`📊 Bump type: ${changes.bumpType}`);
          console.log(`📁 Changed files: ${changes.changedFiles.length}`);
          console.log(`💡 Run "pnpm version:status" to see full status`);
        } else {
          console.log("✅ No changes detected");
          console.log("💡 Current status: pnpm version:status");
        }
        break;

      case "test":
        await runVersioningTests();
        break;

      case "history":
        showVersionHistory();
        break;

      case "init":
        await initializeVersioning();
        break;

      default:
        showHelp();
    }
  } catch (error) {
    console.error("❌ Command failed:", (error as Error).message);
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
🔧 VERSIONING SYSTEM COMMANDS (pnpm)

Available commands:
  status    Show current system status
  watch     Real-time monitoring (watch files change)
  check     Check for version changes now
  test      Run versioning system tests
  history   Show version history
  init      Initialize versioning system

Usage with pnpm:
  pnpm version:status     # Show current status
  pnpm version:watch      # Start real-time monitoring
  pnpm version:check      # Check for changes now
  pnpm version:test       # Run system tests
  pnpm version:history    # Show version history
  pnpm version:init       # First-time setup

Integration with development:
  pnpm dev               # Auto-check version + start dev server
  pnpm build             # Auto-check version + build

💡 Tip: Keep "pnpm version:watch" running in a separate terminal while developing!
`);
}

async function runVersioningTests() {
  console.log("🧪 Running versioning system tests with pnpm...\n");

  // Test 1: Version detection
  console.log("Test 1: Version Detection");
  try {
    // Try to load version file
    const versionPath =
      "features/business-logic-modern/infrastructure/versioning/version.ts";

    if (fs.existsSync(versionPath)) {
      const content = fs.readFileSync(versionPath, "utf8");
      const versionMatch = content.match(/full: "([^"]+)"/);
      const version = versionMatch ? versionMatch[1] : "1.0.0";
      console.log(`✅ Current version loaded: ${version}`);

      const generatedMatch = content.match(/generated: "([^"]+)"/);
      const generated = generatedMatch
        ? generatedMatch[1]
        : new Date().toISOString();
      console.log(`   Generated: ${generated}`);
    } else {
      console.log(
        "⚠️ Version file not found - will be created on first change"
      );
    }
  } catch (error) {
    console.log(`❌ Failed to load version: ${(error as Error).message}`);
  }

  // Test 2: File monitoring
  console.log("\nTest 2: File Monitoring");
  const testFile = "./test-version-change.tmp";

  try {
    fs.writeFileSync(testFile, `// Test file created at ${new Date()}`);
    console.log("✅ Test file created successfully");

    // Check if change would be detected
    const changes = await versionDetector.detectChanges();
    if (changes) {
      console.log(
        `✅ Change detection working - would bump to ${changes.version}`
      );
    } else {
      console.log(
        "ℹ️ No version bump triggered (file not in tracked patterns)"
      );
    }

    // Clean up
    fs.unlinkSync(testFile);
    console.log("✅ Test file cleaned up");
  } catch (error) {
    console.log(`❌ File monitoring test failed: ${(error as Error).message}`);
  }

  // Test 3: Migration system
  console.log("\nTest 3: Migration System");
  try {
    const testData = { text: "test" };
    const migrated = autoMigrator.migrateData(testData, "1.0.0", "2.0.0");
    console.log("✅ Migration system working");
    console.log(
      `   Test migration added: ${Object.keys(migrated).length} properties`
    );
  } catch (error) {
    console.log(`❌ Migration test failed: ${(error as Error).message}`);
  }

  // Test 4: pnpm integration
  console.log("\nTest 4: pnpm Integration");
  try {
    const { execSync } = require("child_process");
    execSync("pnpm --version", { stdio: "pipe" });
    console.log("✅ pnpm is available and working");
  } catch (error) {
    console.log(`❌ pnpm integration test failed: ${(error as Error).message}`);
  }

  console.log("\n🎉 All tests completed!");
  console.log("💡 Try: pnpm version:watch to see real-time monitoring");
}

function showVersionHistory() {
  console.log("📚 VERSION HISTORY\n");

  try {
    const cache = JSON.parse(fs.readFileSync(".version-cache.json", "utf8"));

    console.log(`Current Version: ${cache.version}`);
    console.log(`Last Updated: ${new Date(cache.timestamp).toLocaleString()}`);
    console.log(`Files Tracked: ${cache.hashes ? cache.hashes.length : 0}`);
    console.log("\n💡 Commands:");
    console.log("   pnpm version:status    # Current status");
    console.log("   pnpm version:watch     # Monitor changes");
  } catch (error) {
    console.log("No version history found (first run)");
    console.log('💡 Run "pnpm version:init" to initialize the system');
  }
}

async function initializeVersioning() {
  console.log("🚀 Initializing versioning system...\n");

  // Create initial version
  const changes = await versionDetector.detectChanges();

  if (changes) {
    console.log(`✅ Versioning initialized with version ${changes.version}`);
  } else {
    console.log("✅ Versioning system initialized");
  }

  console.log("\n💡 Next steps:");
  console.log("   pnpm version:status    # Check current status");
  console.log("   pnpm version:watch     # Start monitoring");
  console.log(
    "   pnpm dev              # Start development with auto-versioning"
  );
}

// Handle command line arguments
const command = process.argv[2] || "help";
handleCommand(command).catch((error) => {
  console.error("❌ Command failed:", (error as Error).message);
  process.exit(1);
});
