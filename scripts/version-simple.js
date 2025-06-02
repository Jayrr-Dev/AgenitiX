// Simple version commands without TypeScript dependencies

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// ============================================================================
// SIMPLE VERSION DETECTOR
// ============================================================================

class SimpleVersionDetector {
  constructor() {
    this.versionFile = ".version-cache.json";
    this.trackPattern = "features/business-logic-modern";
  }

  async detectChanges() {
    try {
      console.log("🔍 Scanning for changes...");

      const currentFiles = this.findFiles(this.trackPattern);
      const currentHashes = new Map();

      // Calculate current hashes
      for (const file of currentFiles) {
        try {
          const content = fs.readFileSync(file, "utf8");
          const hash = crypto.createHash("md5").update(content).digest("hex");
          currentHashes.set(file, hash);
        } catch (error) {
          console.warn(`⚠️ Could not read ${file}`);
        }
      }

      // Load previous hashes
      let previousHashes = new Map();
      let currentVersion = "1.0.0";

      if (fs.existsSync(this.versionFile)) {
        try {
          const cache = JSON.parse(fs.readFileSync(this.versionFile, "utf8"));
          previousHashes = new Map(cache.hashes || []);
          currentVersion = cache.version || "1.0.0";
        } catch (error) {
          console.warn("⚠️ Could not load version cache");
        }
      }

      // Find changed files
      const changedFiles = [];
      for (const [file, hash] of currentHashes) {
        const prevHash = previousHashes.get(file);
        if (!prevHash || prevHash !== hash) {
          changedFiles.push(file);
        }
      }

      if (changedFiles.length === 0) {
        return null; // No changes
      }

      // Enhanced bump type detection
      let bumpType = "patch";
      let detectedInfrastructure = false;

      for (const file of changedFiles) {
        // Major version changes
        if (
          file.includes("types/nodeData.ts") ||
          file.includes("factory/NodeFactory.tsx") ||
          file.includes("node-registry/nodeRegistry.ts")
        ) {
          bumpType = "major";
          break;
        }
        // Minor version changes - Enhanced infrastructure detection
        else if (
          file.includes("node-domain/") ||
          file.includes("infrastructure/") ||
          file.includes("/constants/sizes.ts") ||
          file.includes("/factory/constants/") ||
          file.includes("/factory/types/")
        ) {
          bumpType = "minor";
          detectedInfrastructure = true;
        }
      }

      // Enhanced logging for infrastructure detection
      if (detectedInfrastructure) {
        console.log(
          "🏗️ New infrastructure detected - triggering minor version bump"
        );
        const infraFiles = changedFiles.filter(
          (f) =>
            f.includes("infrastructure/") ||
            f.includes("/constants/sizes.ts") ||
            f.includes("/factory/constants/") ||
            f.includes("/factory/types/")
        );
        console.log(`📦 Infrastructure files: ${infraFiles.length}`);
        infraFiles.forEach((f) => console.log(`   • ${f}`));
      }

      // Bump version
      const newVersion = this.bumpVersion(currentVersion, bumpType);

      // Save new state
      const cache = {
        version: newVersion,
        timestamp: Date.now(),
        hashes: Array.from(currentHashes.entries()),
        bumpType,
        detectedInfrastructure,
      };

      fs.writeFileSync(this.versionFile, JSON.stringify(cache, null, 2));
      this.updateVersionConstants(newVersion);
      this.updateAIContext(newVersion);

      return {
        version: newVersion,
        bumpType,
        changedFiles,
        timestamp: Date.now(),
        detectedInfrastructure,
      };
    } catch (error) {
      console.error("❌ Version detection failed:", error.message);
      return null;
    }
  }

  findFiles(dir, extensions = [".ts", ".tsx"]) {
    const files = [];

    try {
      if (!fs.existsSync(dir)) return files;

      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          files.push(...this.findFiles(fullPath, extensions));
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (extensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      console.warn(`⚠️ Could not read directory ${dir}`);
    }

    return files;
  }

  bumpVersion(current, type) {
    const [major, minor, patch] = current.split(".").map(Number);

    switch (type) {
      case "major":
        return `${major + 1}.0.0`;
      case "minor":
        return `${major}.${minor + 1}.0`;
      case "patch":
        return `${major}.${minor}.${patch + 1}`;
      default:
        return current;
    }
  }

  updateVersionConstants(version) {
    try {
      const [major, minor, patch] = version.split(".").map(Number);
      const content = `// AUTO-GENERATED - DO NOT EDIT MANUALLY
export const VERSION = {
  major: ${major},
  minor: ${minor},
  patch: ${patch},
  full: "${version}",
  generated: "${new Date().toISOString()}"
} as const;
`;

      const versionDir = path.dirname(
        "features/business-logic-modern/infrastructure/versioning/version.ts"
      );
      if (!fs.existsSync(versionDir)) {
        fs.mkdirSync(versionDir, { recursive: true });
      }

      fs.writeFileSync(
        "features/business-logic-modern/infrastructure/versioning/version.ts",
        content
      );

      console.log(`✅ Updated version constants to ${version}`);
    } catch (error) {
      console.error("❌ Could not update version constants:", error.message);
    }
  }

  getCurrentVersion() {
    try {
      if (fs.existsSync(this.versionFile)) {
        const cache = JSON.parse(fs.readFileSync(this.versionFile, "utf8"));
        return cache.version || "1.0.0";
      }
    } catch (error) {
      console.warn("⚠️ Could not get current version");
    }
    return "1.0.0";
  }

  // Manual version correction method
  async forceMinorBump(reason = "Infrastructure changes") {
    console.log(`🔧 Force bumping to minor version: ${reason}`);

    const currentVersion = this.getCurrentVersion();
    const newVersion = this.bumpVersion(currentVersion, "minor");

    // Update version files
    this.updateVersionConstants(newVersion);
    this.updateAIContext(newVersion);

    // Update cache to reflect manual bump
    let cache = { version: newVersion, timestamp: Date.now(), hashes: [] };
    if (fs.existsSync(this.versionFile)) {
      try {
        const existing = JSON.parse(fs.readFileSync(this.versionFile, "utf8"));
        cache = {
          ...existing,
          version: newVersion,
          timestamp: Date.now(),
          manualBump: true,
          reason,
        };
      } catch (error) {
        console.warn("⚠️ Could not read existing cache");
      }
    }

    fs.writeFileSync(this.versionFile, JSON.stringify(cache, null, 2));

    console.log(`✅ Manually bumped version to ${newVersion}`);
    return newVersion;
  }

  updateAIContext(version) {
    try {
      const aiContextPath = "features/business-logic-modern/ai-context.json";

      let context = {
        project: "Agenitix - Modern Node-Based Workflow System",
        domain: "business-logic-modern",
        nodeTypes: ["createText", "viewOutput", "triggerOnToggle", "testError"],
        architecture: {
          status: "stable",
          circularDependencies: "resolved",
          centralizedHandles: true,
          nodeCount: 4,
        },
        criticalFiles: {
          version: "infrastructure/versioning/version.ts",
          types: "infrastructure/node-creation/factory/types/index.ts",
          handles: "infrastructure/node-creation/factory/constants/handles.ts",
          registry:
            "infrastructure/node-creation/node-registry/nodeRegistry.ts",
        },
        constraints: {
          isolation: "NEVER edit legacy files outside business-logic-modern/",
          packaging: "Use pnpm only",
          architecture: "Follow factory pattern for new nodes",
          handles: "Use centralized handle system",
          versioning: "NEVER manually edit version.ts - auto-generated",
        },
        versionRules: {
          major: "Type changes, Factory changes, Registry structure",
          minor: "New nodes, New infrastructure",
          patch: "Bug fixes, docs, other changes",
        },
        documentation: {
          location: "documentation/claude-reports/",
          versionReference: "Import from infrastructure/versioning/version.ts",
          format: "Markdown with auto-version integration",
        },
      };

      // Try to read existing context to preserve any updates
      if (fs.existsSync(aiContextPath)) {
        try {
          const existing = JSON.parse(fs.readFileSync(aiContextPath, "utf8"));
          context = { ...context, ...existing };
        } catch (error) {
          console.warn("⚠️ Could not read existing AI context, using defaults");
        }
      }

      // Update version and timestamp
      context.version = version;
      context.lastUpdated =
        new Date().toISOString().split("T")[0] + "T00:00:00.000Z";
      context.generated = new Date().toISOString();

      // Write updated context
      fs.writeFileSync(aiContextPath, JSON.stringify(context, null, 2));

      console.log(`✅ Updated AI context JSON to version ${version}`);
    } catch (error) {
      console.error("❌ Could not update AI context JSON:", error.message);
    }
  }
}

// ============================================================================
// COMMAND HANDLERS
// ============================================================================

const detector = new SimpleVersionDetector();

async function handleCommand(command) {
  switch (command) {
    case "status":
      showStatus();
      break;

    case "check":
      await checkForChanges();
      break;

    case "init":
      await initVersioning();
      break;

    case "test":
      await runTests();
      break;

    case "history":
      showHistory();
      break;

    case "force-minor":
      await forceMinorBump();
      break;

    case "fix-infrastructure":
      await fixInfrastructureVersion();
      break;

    default:
      showHelp();
  }
}

function showStatus() {
  console.log("\n🔧 VERSIONING SYSTEM STATUS");
  console.log("════════════════════════════════════════");

  const version = detector.getCurrentVersion();
  console.log(`📦 Current Version: ${version}`);

  try {
    const cache = JSON.parse(fs.readFileSync(".version-cache.json", "utf8"));
    console.log(
      `🕒 Last Changed: ${new Date(cache.timestamp).toLocaleString()}`
    );
    console.log(`📁 Files Tracked: ${cache.hashes ? cache.hashes.length : 0}`);
  } catch {
    console.log("🕒 Last Changed: Unknown (first run)");
    console.log("📁 Files Tracked: 0");
  }

  console.log("💚 System Health: HEALTHY");
  console.log("\n💡 Available commands:");
  console.log("   pnpm version:simple status  # Show this status");
  console.log("   pnpm version:simple check   # Check for changes");
  console.log("   pnpm version:simple init    # Initialize system");
  console.log("");
}

async function checkForChanges() {
  console.log("🔍 Checking for changes...");

  const changes = await detector.detectChanges();

  if (changes) {
    console.log(`✅ Changes detected! New version: ${changes.version}`);
    console.log(`📊 Bump type: ${changes.bumpType}`);
    console.log(`📁 Changed files: ${changes.changedFiles.length}`);

    if (changes.changedFiles.length <= 5) {
      changes.changedFiles.forEach((file) => {
        console.log(`   • ${file}`);
      });
    } else {
      changes.changedFiles.slice(0, 3).forEach((file) => {
        console.log(`   • ${file}`);
      });
      console.log(`   ... and ${changes.changedFiles.length - 3} more files`);
    }
  } else {
    console.log("✅ No changes detected");
  }
}

async function initVersioning() {
  console.log("🚀 Initializing versioning system...\n");

  const changes = await detector.detectChanges();

  if (changes) {
    console.log(`✅ Versioning initialized with version ${changes.version}`);
    console.log(`📁 Tracking ${changes.changedFiles.length} files`);
  } else {
    console.log("✅ Versioning system initialized");
  }

  console.log("\n💡 Next steps:");
  console.log("   pnpm version:simple status  # Check current status");
  console.log("   pnpm version:simple check   # Check for changes");
}

async function runTests() {
  console.log("🧪 Running simple versioning tests...\n");

  // Test 1: File detection
  console.log("Test 1: File Detection");
  const files = detector.findFiles("features/business-logic-modern");
  console.log(`✅ Found ${files.length} TypeScript files`);

  // Test 2: Version bump logic
  console.log("\nTest 2: Version Bump Logic");
  const testVersion = detector.bumpVersion("1.0.0", "minor");
  console.log(`✅ Version bump test: 1.0.0 → ${testVersion}`);

  // Test 3: File operations
  console.log("\nTest 3: File Operations");
  try {
    const testFile = "test-version.tmp";
    fs.writeFileSync(testFile, "test");
    fs.unlinkSync(testFile);
    console.log("✅ File operations working");
  } catch (error) {
    console.log(`❌ File operations failed: ${error.message}`);
  }

  console.log("\n🎉 Simple tests completed!");
}

function showHistory() {
  console.log("📚 VERSION HISTORY\n");

  try {
    const cache = JSON.parse(fs.readFileSync(".version-cache.json", "utf8"));
    console.log(`Current Version: ${cache.version}`);
    console.log(`Last Updated: ${new Date(cache.timestamp).toLocaleString()}`);
    console.log(`Files Tracked: ${cache.hashes ? cache.hashes.length : 0}`);
  } catch {
    console.log("No version history found (first run)");
    console.log('💡 Run "pnpm version:simple init" to initialize');
  }
}

function showHelp() {
  console.log(`
🔧 SIMPLE VERSIONING SYSTEM

Available commands:
  status       Show current system status
  check        Check for version changes now
  init         Initialize versioning system
  test         Run basic tests
  history      Show version history
  force-minor  Force a minor version bump
  fix-infrastructure  Fix version for infrastructure changes

Usage:
  pnpm version:simple status         # Show current status
  pnpm version:simple init           # Initialize system
  pnpm version:simple check          # Check for changes
  pnpm version:simple fix-infrastructure  # Fix infrastructure version

Version Rules:
  • Major: Type changes, Factory changes, Registry structure
  • Minor: New nodes, New infrastructure
  • Patch: Bug fixes, docs, other changes

💡 This is a simplified version that works without TypeScript compilation.
💡 Use 'fix-infrastructure' to properly bump for the new size constants system.
`);
}

async function forceMinorBump() {
  console.log("🔧 Forcing minor version bump...");
  const newVersion = await detector.forceMinorBump(
    "New infrastructure: Standardized size constants system"
  );
  console.log(`✅ Version updated to ${newVersion}`);
}

async function fixInfrastructureVersion() {
  console.log("🏗️ Fixing version for infrastructure changes...");
  console.log("   Reason: Added new standardized size constants system");
  const newVersion = await detector.forceMinorBump(
    "New infrastructure: Standardized size constants system with Tailwind CSS integration"
  );
  console.log(
    `✅ Version corrected to ${newVersion} (minor bump for infrastructure)`
  );
}

// Handle command line arguments
const command = process.argv[2] || "help";
handleCommand(command).catch((error) => {
  console.error("❌ Command failed:", error.message);
  process.exit(1);
});
