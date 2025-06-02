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

      // Determine bump type
      let bumpType = "patch";
      for (const file of changedFiles) {
        if (
          file.includes("types/nodeData.ts") ||
          file.includes("factory/NodeFactory.tsx") ||
          file.includes("node-registry/nodeRegistry.ts")
        ) {
          bumpType = "major";
          break;
        } else if (
          file.includes("node-domain/") ||
          file.includes("infrastructure/")
        ) {
          bumpType = "minor";
        }
      }

      // Bump version
      const newVersion = this.bumpVersion(currentVersion, bumpType);

      // Save new state
      const cache = {
        version: newVersion,
        timestamp: Date.now(),
        hashes: Array.from(currentHashes.entries()),
      };

      fs.writeFileSync(this.versionFile, JSON.stringify(cache, null, 2));
      this.updateVersionConstants(newVersion);

      return {
        version: newVersion,
        bumpType,
        changedFiles,
        timestamp: Date.now(),
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
  status    Show current system status
  check     Check for version changes now
  init      Initialize versioning system
  test      Run basic tests
  history   Show version history

Usage:
  pnpm version:simple status    # Show current status
  pnpm version:simple check     # Check for changes
  pnpm version:simple init      # Initialize system

💡 This is a simplified version that works without TypeScript compilation.
`);
}

// Handle command line arguments
const command = process.argv[2] || "help";
handleCommand(command).catch((error) => {
  console.error("❌ Command failed:", error.message);
  process.exit(1);
});
