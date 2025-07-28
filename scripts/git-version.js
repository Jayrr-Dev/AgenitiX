// Git-integrated versioning system

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { execSync } = require("node:child_process");

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
			const gitInfo = this.getGitInfo();
			const currentFiles = this.findFiles(this.trackPattern);
			const currentHashes = new Map();

			// Calculate current hashes
			for (const file of currentFiles) {
				try {
					const content = fs.readFileSync(file, "utf8");
					const hash = crypto.createHash("md5").update(content).digest("hex");
					currentHashes.set(file, hash);
				} catch (_error) {
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
				} catch (_error) {
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
					}
					if (file.includes("node-domain/") || file.includes("infrastructure/")) {
						bumpType = "minor";
					}
				}
			} else if (gitChanged) {
				// Git changed but no tracked files changed
				bumpType = "patch";
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

		// Auto-sync package.json version
		try {
			const packageJsonPath = path.join(process.cwd(), "package.json");
			if (fs.existsSync(packageJsonPath)) {
				const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
				packageJson.version = version;
				fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
			}
		} catch (error) {
			console.warn(`⚠️ Could not update package.json: ${error.message}`);
		}

		if (gitInfo.available) {
		}
	}

	// UTILITY METHODS (same as before)
	findFiles(_patterns, extensions = [".ts", ".tsx", ".js", ".json"]) {
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
			const specificFiles = [
				"middleware.ts",
				"next.config.ts",
				"tailwind.config.ts",
				"tsconfig.json",
				"package.json",
			];
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
		} catch (_error) {
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
		const [versionPart, preReleasePart] = version.split("-");
		const [major, minor, patch] = versionPart.split(".").map(Number);

		return {
			major,
			minor,
			patch,
			preRelease: preReleasePart || null,
			full: version,
		};
	}

	// Bump pre-release version
	bumpPreRelease(current, preReleaseType = "alpha") {
		const parsed = this.parseVersion(current);

		if (parsed.preRelease) {
			// Extract pre-release type and number
			const [type, number] = parsed.preRelease.split(".");
			const num = Number.parseInt(number) || 0;

			if (type === preReleaseType) {
				// Bump the same pre-release type
				return `${parsed.major}.${parsed.minor}.${parsed.patch}-${preReleaseType}.${num + 1}`;
			}
			// Switch to new pre-release type
			return `${parsed.major}.${parsed.minor}.${parsed.patch}-${preReleaseType}.1`;
		}
		// Start new pre-release
		return `${parsed.major}.${parsed.minor}.${parsed.patch}-${preReleaseType}.1`;
	}

	getCurrentVersion() {
		try {
			if (fs.existsSync(this.cacheFile)) {
				const cache = JSON.parse(fs.readFileSync(this.cacheFile, "utf8"));
				return cache.version || "1.0.0";
			}
		} catch (_error) {
			console.warn("⚠️ Could not get current version");
		}
		return "1.0.0";
	}

	// ENHANCED STATUS WITH GIT INFO
	showStatus() {
		const _version = this.getCurrentVersion();

		try {
			const cache = JSON.parse(fs.readFileSync(this.cacheFile, "utf8"));

			if (cache.gitInfo?.available) {
			}

			if (cache.changes) {
			}
		} catch {}
	}

	// MANUAL VERSION BUMPING
	async manualBump(bumpType) {
		try {
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
				} catch (_error) {
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
				} catch (_error) {
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
				} catch (_error) {
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
				} catch (_error) {
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

		case "check": {
			const changes = await detector.detectChanges();

			if (changes) {
				if (changes.gitInfo?.available) {
				}
			} else {
			}
			break;
		}

		case "major": {
			const majorChanges = await detector.manualBump("major");
			if (majorChanges) {
			}
			break;
		}

		case "minor": {
			const minorChanges = await detector.manualBump("minor");
			if (minorChanges) {
			}
			break;
		}

		case "patch": {
			const patchChanges = await detector.manualBump("patch");
			if (patchChanges) {
			}
			break;
		}

		case "alpha": {
			const alphaChanges = await detector.manualPreReleaseBump("alpha");
			if (alphaChanges) {
			}
			break;
		}

		case "beta": {
			const betaChanges = await detector.manualPreReleaseBump("beta");
			if (betaChanges) {
			}
			break;
		}

		case "rc": {
			const rcChanges = await detector.manualPreReleaseBump("rc");
			if (rcChanges) {
			}
			break;
		}

		case "release": {
			const releaseChanges = await detector.convertToRelease();
			if (releaseChanges) {
			}
			break;
		}

		case "reset": {
			const resetChanges = await detector.resetToAlpha();
			if (resetChanges) {
			}
			break;
		}

		default:
	}
}

// Handle command line arguments
const command = process.argv[2] || "help";
handleCommand(command).catch((error) => {
	console.error("❌ Command failed:", error.message);
	process.exit(1);
});
