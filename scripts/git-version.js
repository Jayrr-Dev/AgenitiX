// Git-integrated versioning system

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execSync } = require("child_process");

/**
 * GIT-INTEGRATED VERSION DETECTOR
 *
 * Enhanced version system that integrates with git history
 */
class GitVersionDetector {
	constructor() {
		this.versionFile = "features/business-logic-modern/infrastructure/versioning/version.ts";
		this.cacheFile = ".version-cache.json";
		this.trackPattern = [
			"app/**/*.{ts,tsx}",
			"components/**/*.{ts,tsx}",
			"features/**/*.{ts,tsx}",
			"lib/**/*.{ts,tsx}",
			"hooks/**/*.{ts,tsx}",
			"types/**/*.{ts,tsx}",
			"convex/**/*.{ts,tsx}",
			"scripts/**/*.{js,ts}",
			"middleware.ts",
			"next.config.ts",
			"tailwind.config.ts",
			"tsconfig.json",
			"package.json",
		];
	}

	// GET GIT INFORMATION
	getGitInfo() {
		try {
			const commitHash = this.execGitCommand("git rev-parse HEAD").trim();
			const commitShort = this.execGitCommand("git rev-parse --short HEAD").trim();
			const commitMessage = this.execGitCommand("git log -1 --pretty=%B").trim();
			const branch = this.execGitCommand("git rev-parse --abbrev-ref HEAD").trim();
			const commitDate = this.execGitCommand("git log -1 --pretty=%ci").trim();
			const author = this.execGitCommand("git log -1 --pretty=%an").trim();

			return {
				hash: commitHash,
				shortHash: commitShort,
				message: commitMessage,
				branch,
				date: commitDate,
				author,
				available: true,
			};
		} catch (error) {
			console.warn("⚠️ Git not available:", error.message);
			return {
				hash: "unknown",
				shortHash: "unknown",
				message: "Git not available",
				branch: "unknown",
				date: new Date().toISOString(),
				author: "unknown",
				available: false,
			};
		}
	}

	execGitCommand(command) {
		return execSync(command, { encoding: "utf8", cwd: process.cwd() });
	}

	// ENHANCED VERSION DETECTION WITH GIT
	async detectChanges() {
		try {
			console.log("🔍 Scanning for changes with git integration...");

			const gitInfo = this.getGitInfo();
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

			// Load previous state
			let previousHashes = new Map();
			let currentVersion = "1.0.0";
			let lastGitHash = null;

			if (fs.existsSync(this.cacheFile)) {
				try {
					const cache = JSON.parse(fs.readFileSync(this.cacheFile, "utf8"));
					previousHashes = new Map(cache.hashes || []);
					currentVersion = cache.version || "1.0.0";
					lastGitHash = cache.gitInfo?.hash;
				} catch (error) {
					console.warn("⚠️ Could not load version cache");
				}
			}

			// Check if git commit changed (even if files didn't)
			const gitChanged = gitInfo.available && lastGitHash && lastGitHash !== gitInfo.hash;

			// Find changed files
			const changedFiles = [];
			for (const [file, hash] of currentHashes) {
				const prevHash = previousHashes.get(file);
				if (!prevHash || prevHash !== hash) {
					changedFiles.push(file);
				}
			}

			// No changes detected
			if (changedFiles.length === 0 && !gitChanged) {
				console.log("📦 No file changes or git changes detected");
				return null;
			}

			// Determine bump type
			let bumpType = "patch";
			if (changedFiles.length > 0) {
				for (const file of changedFiles) {
					if (
						file.includes("types/nodeData.ts") ||
						file.includes("factory/NodeFactory.tsx") ||
						file.includes("node-registry/nodeRegistry.ts")
					) {
						bumpType = "major";
						break;
					} else if (file.includes("node-domain/") || file.includes("infrastructure/")) {
						bumpType = "minor";
					}
				}
			} else if (gitChanged) {
				// Git changed but no tracked files changed
				bumpType = "patch";
				console.log("🔄 Git commit detected, triggering patch version bump");
			}

			// Bump version
			const newVersion = this.bumpVersion(currentVersion, bumpType);

			// Enhanced cache with git information
			const cache = {
				version: newVersion,
				timestamp: Date.now(),
				hashes: Array.from(currentHashes.entries()),
				gitInfo: gitInfo,
				changes: {
					files: changedFiles,
					bumpType,
					reason: changedFiles.length > 0 ? "file_changes" : "git_commit",
				},
			};

			fs.writeFileSync(this.cacheFile, JSON.stringify(cache, null, 2));
			this.updateVersionConstants(newVersion, gitInfo);

			return {
				version: newVersion,
				bumpType,
				changedFiles,
				timestamp: Date.now(),
				gitInfo,
			};
		} catch (error) {
			console.error("❌ Version detection failed:", error.message);
			return null;
		}
	}

	// ENHANCED VERSION CONSTANTS WITH GIT INFO
	updateVersionConstants(version, gitInfo) {
		const parsed = this.parseVersion(version);
		
		const versionContent = `// AUTO-GENERATED - DO NOT EDIT MANUALLY
export const VERSION = {
  major: ${parsed.major},
  minor: ${parsed.minor},
  patch: ${parsed.patch},
  full: "${version}",
  generated: "${new Date().toISOString()}",
  git: {
    hash: "${gitInfo.hash}",
    shortHash: "${gitInfo.shortHash}",
    branch: "${gitInfo.branch}",
    author: "${gitInfo.author}",
    date: "${gitInfo.date}",
    available: ${gitInfo.available}
  }
} as const;
`;

		// Ensure directory exists
		const versionDir = path.dirname(this.versionFile);
			if (!fs.existsSync(versionDir)) {
				fs.mkdirSync(versionDir, { recursive: true });
			}

		fs.writeFileSync(this.versionFile, versionContent);
			console.log(`✅ Updated version constants to ${version}`);

		// Auto-sync package.json version
		try {
			const packageJsonPath = path.join(process.cwd(), 'package.json');
			if (fs.existsSync(packageJsonPath)) {
				const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
				packageJson.version = version;
				fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
				console.log(`📦 Updated package.json version to ${version}`);
			}
		} catch (error) {
			console.warn(`⚠️ Could not update package.json: ${error.message}`);
		}

		if (gitInfo.available) {
			console.log(`📝 Git info: ${gitInfo.shortHash} on ${gitInfo.branch} by ${gitInfo.author}`);
		}
	}

	// UTILITY METHODS (same as before)
	findFiles(patterns, extensions = [".ts", ".tsx", ".js", ".json"]) {
		const files = [];

		try {
			// Simple approach: just scan the main directories
			const dirs = ["app", "components", "features", "lib", "hooks", "types", "convex", "scripts"];
			
			for (const dir of dirs) {
				if (fs.existsSync(dir)) {
					this.scanDirectory(dir, files, extensions);
				}
			}
			
			// Add specific files
			const specificFiles = ["middleware.ts", "next.config.ts", "tailwind.config.ts", "tsconfig.json", "package.json"];
			for (const file of specificFiles) {
				if (fs.existsSync(file)) {
					files.push(file);
				}
			}
		} catch (error) {
			console.warn(`⚠️ Could not read files: ${error.message}`);
		}

		return files;
	}

	scanDirectory(dir, files, extensions) {
		try {
			const entries = fs.readdirSync(dir, { withFileTypes: true });

			for (const entry of entries) {
				const fullPath = path.join(dir, entry.name);

				if (entry.isDirectory()) {
					this.scanDirectory(fullPath, files, extensions);
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
	}

	bumpVersion(current, type, preRelease = null) {
		const [major, minor, patch] = current.split(".").map(Number);

		// Handle pre-release versions
		if (preRelease) {
			switch (type) {
				case "major":
					return `${major + 1}.0.0-${preRelease}.1`;
				case "minor":
					return `${major}.${minor + 1}.0-${preRelease}.1`;
				case "patch":
					return `${major}.${minor}.${patch + 1}-${preRelease}.1`;
				default:
					return current;
			}
		}

		// Handle normal versions
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

	// Parse version with pre-release support
	parseVersion(version) {
		const [versionPart, preReleasePart] = version.split('-');
		const [major, minor, patch] = versionPart.split(".").map(Number);
		
		return {
			major,
			minor,
			patch,
			preRelease: preReleasePart || null,
			full: version
		};
	}

	// Bump pre-release version
	bumpPreRelease(current, preReleaseType = 'alpha') {
		const parsed = this.parseVersion(current);
		
		if (parsed.preRelease) {
			// Extract pre-release type and number
			const [type, number] = parsed.preRelease.split('.');
			const num = parseInt(number) || 0;
			
			if (type === preReleaseType) {
				// Bump the same pre-release type
				return `${parsed.major}.${parsed.minor}.${parsed.patch}-${preReleaseType}.${num + 1}`;
			} else {
				// Switch to new pre-release type
				return `${parsed.major}.${parsed.minor}.${parsed.patch}-${preReleaseType}.1`;
			}
		} else {
			// Start new pre-release
			return `${parsed.major}.${parsed.minor}.${parsed.patch}-${preReleaseType}.1`;
		}
	}

	getCurrentVersion() {
		try {
			if (fs.existsSync(this.cacheFile)) {
				const cache = JSON.parse(fs.readFileSync(this.cacheFile, "utf8"));
				return cache.version || "1.0.0";
			}
		} catch (error) {
			console.warn("⚠️ Could not get current version");
		}
		return "1.0.0";
	}

	// ENHANCED STATUS WITH GIT INFO
	showStatus() {
		console.log("\n🔧 GIT-INTEGRATED VERSIONING STATUS");
		console.log("════════════════════════════════════════");

		const version = this.getCurrentVersion();
		console.log(`📦 Current Version: ${version}`);

		try {
			const cache = JSON.parse(fs.readFileSync(this.cacheFile, "utf8"));
			console.log(`🕒 Last Changed: ${new Date(cache.timestamp).toLocaleString()}`);
			console.log(`📁 Files Tracked: ${cache.hashes ? cache.hashes.length : 0}`);

			if (cache.gitInfo && cache.gitInfo.available) {
				console.log(`\n📝 Git Information:`);
				console.log(`   Branch: ${cache.gitInfo.branch}`);
				console.log(`   Commit: ${cache.gitInfo.shortHash}`);
				console.log(`   Author: ${cache.gitInfo.author}`);
				console.log(`   Date: ${new Date(cache.gitInfo.date).toLocaleString()}`);
			}

			if (cache.changes) {
				console.log(`\n🔄 Last Change:`);
				console.log(`   Type: ${cache.changes.bumpType}`);
				console.log(`   Reason: ${cache.changes.reason}`);
				console.log(`   Files: ${cache.changes.files.length}`);
			}
		} catch {
			console.log("🕒 Last Changed: Unknown (first run)");
		}

		console.log("\n💡 Available commands:");
		console.log("   pnpm git-version status   # Show this status");
		console.log("   pnpm git-version check    # Check for changes");
		console.log("   pnpm git-version major    # Manual major bump");
		console.log("   pnpm git-version minor    # Manual minor bump");
		console.log("   pnpm git-version patch    # Manual patch bump");
		console.log("   pnpm git-version alpha    # Manual alpha pre-release");
		console.log("   pnpm git-version beta     # Manual beta pre-release");
		console.log("   pnpm git-version rc       # Manual rc pre-release");
		console.log("   pnpm git-version release  # Convert to stable release");
		console.log("   pnpm git-version reset    # Reset to 0.0.0-alpha.1");
		console.log("");
	}

	// MANUAL VERSION BUMPING
	async manualBump(bumpType) {
		try {
			console.log(`🔧 Manually bumping ${bumpType} version...`);

			const gitInfo = this.getGitInfo();
			const currentVersion = this.getCurrentVersion();
			const newVersion = this.bumpVersion(currentVersion, bumpType);

			// Get current file hashes for cache
			const currentFiles = this.findFiles(this.trackPattern);
			const currentHashes = new Map();

			for (const file of currentFiles) {
				try {
					const content = fs.readFileSync(file, "utf8");
					const hash = crypto.createHash("md5").update(content).digest("hex");
					currentHashes.set(file, hash);
				} catch (error) {
					console.warn(`⚠️ Could not read ${file}`);
				}
			}

			// Enhanced cache with manual bump information
			const cache = {
				version: newVersion,
				timestamp: Date.now(),
				hashes: Array.from(currentHashes.entries()),
				gitInfo: gitInfo,
				changes: {
					files: [],
					bumpType,
					reason: `manual_${bumpType}_bump`,
				},
			};

			fs.writeFileSync(this.cacheFile, JSON.stringify(cache, null, 2));
			this.updateVersionConstants(newVersion, gitInfo);

			return {
				version: newVersion,
				bumpType,
				changedFiles: [],
				timestamp: Date.now(),
				gitInfo,
			};
		} catch (error) {
			console.error("❌ Manual version bump failed:", error.message);
			return null;
		}
	}

	// MANUAL PRE-RELEASE BUMPING
	async manualPreReleaseBump(preReleaseType) {
		try {
			console.log(`🔧 Manually bumping ${preReleaseType} pre-release version...`);

			const gitInfo = this.getGitInfo();
			const currentVersion = this.getCurrentVersion();
			const newVersion = this.bumpPreRelease(currentVersion, preReleaseType);

			// Get current file hashes for cache
			const currentFiles = this.findFiles(this.trackPattern);
			const currentHashes = new Map();

			for (const file of currentFiles) {
				try {
					const content = fs.readFileSync(file, "utf8");
					const hash = crypto.createHash("md5").update(content).digest("hex");
					currentHashes.set(file, hash);
				} catch (error) {
					console.warn(`⚠️ Could not read ${file}`);
				}
			}

			// Enhanced cache with manual pre-release bump information
			const cache = {
				version: newVersion,
				timestamp: Date.now(),
				hashes: Array.from(currentHashes.entries()),
				gitInfo: gitInfo,
				changes: {
					files: [],
					bumpType: "pre-release", // Explicitly indicate pre-release bump
					reason: `manual_${preReleaseType}_pre_release_bump`,
				},
			};

			fs.writeFileSync(this.cacheFile, JSON.stringify(cache, null, 2));
			this.updateVersionConstants(newVersion, gitInfo);

			return {
				version: newVersion,
				bumpType: "pre-release", // Explicitly indicate pre-release bump
				changedFiles: [],
				timestamp: Date.now(),
				gitInfo,
			};
		} catch (error) {
			console.error("❌ Manual pre-release version bump failed:", error.message);
			return null;
		}
	}

	// CONVERT PRE-RELEASE TO STABLE RELEASE
	async convertToRelease() {
		try {
			console.log("🚀 Converting pre-release to stable release...");

			const currentVersion = this.getCurrentVersion();
			const parsed = this.parseVersion(currentVersion);

			if (!parsed.preRelease) {
				console.warn("⚠️ Current version is not a pre-release. No conversion needed.");
				return null;
			}

			// Increment the patch number for a stable release
			const newVersion = `${parsed.major}.${parsed.minor}.${parsed.patch + 1}`;

			// Get current file hashes for cache
			const currentFiles = this.findFiles(this.trackPattern);
			const currentHashes = new Map();

			for (const file of currentFiles) {
				try {
					const content = fs.readFileSync(file, "utf8");
					const hash = crypto.createHash("md5").update(content).digest("hex");
					currentHashes.set(file, hash);
				} catch (error) {
					console.warn(`⚠️ Could not read ${file}`);
				}
			}

			// Enhanced cache with stable release information
			const cache = {
				version: newVersion,
				timestamp: Date.now(),
				hashes: Array.from(currentHashes.entries()),
				gitInfo: this.getGitInfo(), // Get current git info
				changes: {
					files: [],
					bumpType: "stable", // Explicitly indicate stable release
					reason: "pre_release_to_stable",
				},
			};

			fs.writeFileSync(this.cacheFile, JSON.stringify(cache, null, 2));
			this.updateVersionConstants(newVersion, this.getGitInfo()); // Update with current git info

			return {
				version: newVersion,
				bumpType: "stable", // Explicitly indicate stable release
				changedFiles: [],
				timestamp: Date.now(),
				gitInfo: this.getGitInfo(), // Return current git info
			};
		} catch (error) {
			console.error("❌ Failed to convert pre-release to stable:", error.message);
			return null;
		}
	}

	// RESET TO 0.0.0-ALPHA.1
	async resetToAlpha() {
		try {
			console.log("🔄 Resetting to 0.0.0-alpha.1 for fresh alpha development...");

			const gitInfo = this.getGitInfo();
			const newVersion = "0.0.0-alpha.1";

			// Get current file hashes for cache
			const currentFiles = this.findFiles(this.trackPattern);
			const currentHashes = new Map();

			for (const file of currentFiles) {
				try {
					const content = fs.readFileSync(file, "utf8");
					const hash = crypto.createHash("md5").update(content).digest("hex");
					currentHashes.set(file, hash);
				} catch (error) {
					console.warn(`⚠️ Could not read ${file}`);
				}
			}

			// Enhanced cache with reset information
			const cache = {
				version: newVersion,
				timestamp: Date.now(),
				hashes: Array.from(currentHashes.entries()),
				gitInfo: gitInfo,
				changes: {
					files: [],
					bumpType: "reset",
					reason: "reset_to_alpha_start",
				},
			};

			fs.writeFileSync(this.cacheFile, JSON.stringify(cache, null, 2));
			this.updateVersionConstants(newVersion, gitInfo);

			return {
				version: newVersion,
				bumpType: "reset",
				changedFiles: [],
				timestamp: Date.now(),
				gitInfo,
			};
		} catch (error) {
			console.error("❌ Reset to alpha failed:", error.message);
			return null;
		}
	}
}

// COMMAND HANDLERS
const detector = new GitVersionDetector();

async function handleCommand(command) {
	switch (command) {
		case "status":
			detector.showStatus();
			break;

		case "check":
			console.log("🔍 Checking for changes with git integration...");
			const changes = await detector.detectChanges();

			if (changes) {
				console.log(`✅ Changes detected! New version: ${changes.version}`);
				console.log(`📊 Bump type: ${changes.bumpType}`);
				console.log(`📁 Changed files: ${changes.changedFiles.length}`);

				if (changes.gitInfo && changes.gitInfo.available) {
					console.log(`📝 Git: ${changes.gitInfo.shortHash} on ${changes.gitInfo.branch}`);
				}
			} else {
				console.log("✅ No changes detected");
			}
			break;

		case "major":
			console.log("🚀 Manually bumping major version...");
			const majorChanges = await detector.manualBump("major");
			if (majorChanges) {
				console.log(`✅ Major version bumped to: ${majorChanges.version}`);
				console.log(`📝 Git: ${majorChanges.gitInfo.shortHash} on ${majorChanges.gitInfo.branch}`);
			}
			break;

		case "minor":
			console.log("📈 Manually bumping minor version...");
			const minorChanges = await detector.manualBump("minor");
			if (minorChanges) {
				console.log(`✅ Minor version bumped to: ${minorChanges.version}`);
				console.log(`📝 Git: ${minorChanges.gitInfo.shortHash} on ${minorChanges.gitInfo.branch}`);
			}
			break;

		case "patch":
			console.log("🔧 Manually bumping patch version...");
			const patchChanges = await detector.manualBump("patch");
			if (patchChanges) {
				console.log(`✅ Patch version bumped to: ${patchChanges.version}`);
				console.log(`📝 Git: ${patchChanges.gitInfo.shortHash} on ${patchChanges.gitInfo.branch}`);
			}
			break;

		case "alpha":
			console.log("🧪 Manually bumping alpha version...");
			const alphaChanges = await detector.manualPreReleaseBump("alpha");
			if (alphaChanges) {
				console.log(`✅ Alpha version bumped to: ${alphaChanges.version}`);
				console.log(`📝 Git: ${alphaChanges.gitInfo.shortHash} on ${alphaChanges.gitInfo.branch}`);
			}
			break;

		case "beta":
			console.log("🔬 Manually bumping beta version...");
			const betaChanges = await detector.manualPreReleaseBump("beta");
			if (betaChanges) {
				console.log(`✅ Beta version bumped to: ${betaChanges.version}`);
				console.log(`📝 Git: ${betaChanges.gitInfo.shortHash} on ${betaChanges.gitInfo.branch}`);
			}
			break;

		case "rc":
			console.log("🎯 Manually bumping release candidate version...");
			const rcChanges = await detector.manualPreReleaseBump("rc");
			if (rcChanges) {
				console.log(`✅ Release candidate version bumped to: ${rcChanges.version}`);
				console.log(`📝 Git: ${rcChanges.gitInfo.shortHash} on ${rcChanges.gitInfo.branch}`);
			}
			break;

		case "release":
			console.log("🚀 Converting pre-release to stable release...");
			const releaseChanges = await detector.convertToRelease();
			if (releaseChanges) {
				console.log(`✅ Released stable version: ${releaseChanges.version}`);
				console.log(`📝 Git: ${releaseChanges.gitInfo.shortHash} on ${releaseChanges.gitInfo.branch}`);
			}
			break;

		case "reset":
			console.log("🔄 Resetting version to 0.0.0-alpha.1...");
			const resetChanges = await detector.resetToAlpha();
			if (resetChanges) {
				console.log(`✅ Version reset to: ${resetChanges.version}`);
				console.log(`📝 Git: ${resetChanges.gitInfo.shortHash} on ${resetChanges.gitInfo.branch}`);
			}
			break;

		default:
			console.log(`
🔧 GIT-INTEGRATED VERSIONING SYSTEM

Available commands:
  status    Show current system status with git info
  check     Check for changes and update version automatically
  major     Manually bump major version (breaking changes)
  minor     Manually bump minor version (new features)
  patch     Manually bump patch version (bug fixes)
  alpha     Manually bump alpha pre-release version
  beta      Manually bump beta pre-release version
  rc        Manually bump release candidate pre-release version
  release   Convert current pre-release to stable release
  reset     Reset version to 0.0.0-alpha.1 for fresh alpha development

Usage:
  pnpm git-version status    # Show detailed status
  pnpm git-version check     # Check for changes automatically
  pnpm git-version major     # Manual major version bump
  pnpm git-version minor     # Manual minor version bump
  pnpm git-version patch     # Manual patch version bump
  pnpm git-version alpha     # Manual alpha pre-release bump
  pnpm git-version beta      # Manual beta pre-release bump
  pnpm git-version rc        # Manual rc pre-release bump
  pnpm git-version release   # Convert pre-release to stable
  pnpm git-version reset     # Reset to 0.0.0-alpha.1

💡 This version includes git commit information and history.
`);
	}
}

// Handle command line arguments
const command = process.argv[2] || "help";
handleCommand(command).catch((error) => {
	console.error("❌ Command failed:", error.message);
	process.exit(1);
});
