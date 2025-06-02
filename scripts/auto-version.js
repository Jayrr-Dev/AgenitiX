// Auto-version script for build integration

async function autoVersion() {
  try {
    console.log("🔍 Checking for version changes...");

    // Try to dynamically import the version detector
    let versionDetector, autoMigrator;

    try {
      const versionModule = await import(
        "../features/business-logic-modern/infrastructure/versioning/version-detector.js"
      );
      const migrationModule = await import(
        "../features/business-logic-modern/infrastructure/versioning/auto-migrate.js"
      );
      versionDetector = versionModule.versionDetector;
      autoMigrator = migrationModule.autoMigrator;
    } catch (error) {
      // Fallback: try to compile TypeScript files first
      console.log("💡 TypeScript files need compilation. Checking manually...");

      const fs = require("fs");
      const path = require("path");

      // Check if any files have changed since last build
      const versionCachePath = ".version-cache.json";
      let lastVersion = "1.0.0";

      if (fs.existsSync(versionCachePath)) {
        try {
          const cache = JSON.parse(fs.readFileSync(versionCachePath, "utf8"));
          lastVersion = cache.version || "1.0.0";
        } catch (error) {
          console.warn("⚠️ Could not read version cache");
        }
      }

      console.log(`📦 Current version: ${lastVersion}`);
      console.log(
        "✅ No automatic version bump (TypeScript compilation needed)"
      );
      console.log(
        '💡 Run "pnpm version:init" to initialize the versioning system'
      );
      return;
    }

    const changes = await versionDetector.detectChanges();

    if (!changes) {
      console.log("✅ No changes detected - version unchanged");
      return;
    }

    console.log(
      `🚀 Auto-bumping version: ${changes.bumpType} (${changes.version})`
    );
    console.log(`📁 Changed files: ${changes.changedFiles.length}`);

    // Show some of the changed files
    const maxFiles = 5;
    const filesToShow = changes.changedFiles.slice(0, maxFiles);
    filesToShow.forEach((file) => {
      console.log(`   • ${file}`);
    });

    if (changes.changedFiles.length > maxFiles) {
      console.log(
        `   ... and ${changes.changedFiles.length - maxFiles} more files`
      );
    }

    // Auto-migrate if enabled
    const VERSION_CONFIG = await import(
      "../features/business-logic-modern/infrastructure/versioning/auto-version.js"
    );
    if (VERSION_CONFIG.VERSION_CONFIG.autoMigrate) {
      console.log("🔄 Running auto-migrations...");
      await autoMigrator.migrateStoredFlows(changes.version);
    }

    console.log(`✅ Version automatically updated to ${changes.version}`);
  } catch (error) {
    console.error("❌ Auto-versioning failed:", error.message);
    console.log("💡 You can continue with manual versioning or fix the issue");
    // Don't fail the build - just log the error
  }
}

// Run it
autoVersion();
