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
		this.versionFile = ".version-cache.json";
		this.trackPattern = "features/business-logic-modern";
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

			if (fs.existsSync(this.versionFile)) {
				try {
					const cache = JSON.parse(fs.readFileSync(this.versionFile, "utf8"));
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

			fs.writeFileSync(this.versionFile, JSON.stringify(cache, null, 2));
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
		try {
			const [major, minor, patch] = version.split(".").map(Number);
			const content = `// AUTO-GENERATED - DO NOT EDIT MANUALLY
export const VERSION = {
  major: ${major},
  minor: ${minor},
  patch: ${patch},
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
			if (gitInfo.available) {
				console.log(`📝 Git info: ${gitInfo.shortHash} on ${gitInfo.branch} by ${gitInfo.author}`);
			}
		} catch (error) {
			console.error("❌ Could not update version constants:", error.message);
		}
	}

	// UTILITY METHODS (same as before)
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

	// ENHANCED STATUS WITH GIT INFO
	showStatus() {
		console.log("\n🔧 GIT-INTEGRATED VERSIONING STATUS");
		console.log("════════════════════════════════════════");

		const version = this.getCurrentVersion();
		console.log(`📦 Current Version: ${version}`);

		try {
			const cache = JSON.parse(fs.readFileSync(this.versionFile, "utf8"));
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
		console.log("");
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

		default:
			console.log(`
🔧 GIT-INTEGRATED VERSIONING SYSTEM

Available commands:
  status    Show current system status with git info
  check     Check for changes and update version

Usage:
  pnpm git-version status    # Show detailed status
  pnpm git-version check     # Check for changes

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
