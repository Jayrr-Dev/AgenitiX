import crypto from "crypto";
import fs from "fs";
import path from "path";
import { VERSION_CONFIG, parseCommitTitle, hasBreakingChange } from "./auto-version";

/**
 * VERSION DETECTOR - GitHub Conventional Commits Based
 *
 * Analyzes GitHub commit history to determine version bumps based on conventional commits
 */

interface GitCommit {
	hash: string;
	title: string;
	message: string;
	author: string;
	date: string;
	type?: string;
	scope?: string;
}

interface VersionInfo {
	version: string;
	hash: string;
	timestamp: number;
	newCommits: GitCommit[];
	bumpType: "major" | "minor" | "patch";
	reason: string;
	changedFiles: string[];
}

interface VersionCache {
	lastProcessedCommit: string;
	currentVersion: {
		major: number;
		minor: number;
		patch: number;
		full: string;
	};
	lastUpdate: number;
}

class ConventionalCommitVersionDetector {
	private versionFile = ".version-cache.json";
	private cache: VersionCache | null = null;

	constructor() {
		this.loadVersionCache();
	}

	/**
	 * DETECT VERSION CHANGES FROM GITHUB COMMITS
	 * Analyzes commit history since last processed commit
	 */
	async detectChanges(): Promise<VersionInfo | null> {
		try {
			// Get commits since last processed
			const newCommits = await this.getNewCommits();
			
			if (newCommits.length === 0) {
				return null; // No new commits
			}

			// Analyze commits for version bump type
			const bumpType = this.determineBumpTypeFromCommits(newCommits);
			
			if (!bumpType) {
				// Update cache even if no version bump needed
				await this.updateLastProcessedCommit(newCommits[0].hash);
				return null;
			}

			const currentVersion = this.getCurrentVersion();
			const newVersion = this.bumpVersion(currentVersion, bumpType);
			const reason = this.getBumpReason(newCommits, bumpType);

			const versionInfo: VersionInfo = {
				version: newVersion,
				hash: newCommits[0].hash,
				timestamp: Date.now(),
				newCommits,
				bumpType,
				reason,
				changedFiles: this.getChangedFilesFromCommits(newCommits),
			};

			return versionInfo;
		} catch (error) {
			console.error("Error detecting version changes:", error);
			return null;
		}
	}

	/**
	 * Get changed files from commits
	 */
	private getChangedFilesFromCommits(commits: GitCommit[]): string[] {
		try {
			const { execSync } = require("child_process");
			const changedFiles = new Set<string>();
			
			for (const commit of commits) {
				const output = execSync(`git show --name-only --format="" ${commit.hash}`, { 
					encoding: "utf8" 
				});
				
				const files = output.trim().split("\n").filter(Boolean);
				files.forEach((file: string) => changedFiles.add(file));
			}
			
			return Array.from(changedFiles);
		} catch (error) {
			console.error("Error getting changed files:", error);
			return [];
		}
	}

	/**
	 * Get new commits since last processed commit
	 */
	private async getNewCommits(): Promise<GitCommit[]> {
		const lastProcessedCommit = this.cache?.lastProcessedCommit;
		
		try {
			// Use git log to get commits
			const { execSync } = require("child_process");
			
			let gitCommand = 'git log --format="%H|%s|%b|%an|%ad" --date=iso';
			
			if (lastProcessedCommit) {
				gitCommand += ` ${lastProcessedCommit}..HEAD`;
			} else {
				// If no last commit, get last 50 commits
				gitCommand += " -50";
			}

			const output = execSync(gitCommand, { encoding: "utf8" });
			
			if (!output.trim()) {
				return [];
			}

			const commits: GitCommit[] = output
				.trim()
				.split("\n")
				.filter((line: string) => line.trim())
				.map((line: string) => {
					const [hash, title, message, author, date] = line.split("|");
					const fullMessage = `${title}\n${message}`.trim();
					
					return {
						hash,
						title: title || "",
						message: fullMessage,
						author: author || "",
						date: date || "",
					};
				})
				.reverse(); // Oldest first

			return commits;
		} catch (error) {
			console.error("Error getting git commits:", error);
			return [];
		}
	}

	/**
	 * Determine version bump type from commits
	 */
	private determineBumpTypeFromCommits(commits: GitCommit[]): "major" | "minor" | "patch" | null {
		let hasMajor = false;
		let hasMinor = false;
		let hasPatch = false;

		for (const commit of commits) {
			// Check for breaking changes first
			if (hasBreakingChange(commit.message)) {
				hasMajor = true;
				break; // Major trumps everything
			}

			// Parse commit title
			const bumpType = parseCommitTitle(commit.title);
			
			if (bumpType === "major") {
				hasMajor = true;
				break;
			} else if (bumpType === "minor") {
				hasMinor = true;
			} else if (bumpType === "patch") {
				hasPatch = true;
			}
		}

		// Return highest priority bump type
		if (hasMajor) return "major";
		if (hasMinor) return "minor";
		if (hasPatch) return "patch";
		
		return null; // No conventional commits found
	}

	/**
	 * Generate human-readable reason for version bump
	 */
	private getBumpReason(commits: GitCommit[], bumpType: "major" | "minor" | "patch"): string {
		const conventionalCommits = commits.filter(c => parseCommitTitle(c.title));
		const breakingChanges = commits.filter(c => hasBreakingChange(c.message));

		if (bumpType === "major") {
			if (breakingChanges.length > 0) {
				return `Breaking changes detected in ${breakingChanges.length} commit(s)`;
			}
			return "Major version bump from commit type";
		}

		if (bumpType === "minor") {
			// Only count commits that actually triggered the minor bump
			const minorCommits = conventionalCommits.filter(c => {
				const commitType = parseCommitTitle(c.title);
				return commitType === "minor";
			});
			return `${minorCommits.length} new feature(s) added`;
		}

		if (bumpType === "patch") {
			// Only count commits that actually triggered the patch bump
			const patchCommits = conventionalCommits.filter(c => {
				const commitType = parseCommitTitle(c.title);
				return commitType === "patch";
			});
			return `${patchCommits.length} bug fix(es) and improvements`;
		}

		return `Version bump from ${conventionalCommits.length} conventional commit(s)`;
	}

	/**
	 * Load version cache from file
	 */
	private loadVersionCache(): void {
		try {
			if (fs.existsSync(this.versionFile)) {
				const data = fs.readFileSync(this.versionFile, "utf8");
				this.cache = JSON.parse(data);
			} else {
				// Initialize with current version and set current commit as last processed
				const { execSync } = require("child_process");
				const latestCommit = execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
				
				console.log("🔄 Initializing new cache with commit:", latestCommit.substring(0, 7));
				
				this.cache = {
					lastProcessedCommit: latestCommit, // Start from current commit
					currentVersion: {
						major: 0,
						minor: 0,
						patch: 0,
						full: "0.0.0-alpha.2",
					},
					lastUpdate: Date.now(),
				};
				
				// Save the cache immediately
				this.saveVersionCache();
				console.log("✅ Cache initialized and saved");
			}
		} catch (error) {
			console.error("Error loading version cache:", error);
			this.cache = {
				lastProcessedCommit: "",
				currentVersion: {
					major: 0,
					minor: 0,
					patch: 0,
					full: "0.0.0-alpha.2",
				},
				lastUpdate: Date.now(),
			};
		}
	}

	/**
	 * Save version cache to file
	 */
	private saveVersionCache(): void {
		try {
			fs.writeFileSync(this.versionFile, JSON.stringify(this.cache, null, 2));
		} catch (error) {
			console.error("Error saving version cache:", error);
		}
	}

	/**
	 * Get current version
	 */
	private getCurrentVersion(): { major: number; minor: number; patch: number } {
		return this.cache?.currentVersion || { major: 0, minor: 0, patch: 0 };
	}

	/**
	 * Bump version based on type
	 */
	private bumpVersion(
		current: { major: number; minor: number; patch: number },
		type: "major" | "minor" | "patch"
	): string {
		let { major, minor, patch } = current;

		switch (type) {
			case "major":
				major++;
				minor = 0;
				patch = 0;
				break;
			case "minor":
				minor++;
				patch = 0;
				break;
			case "patch":
				patch++;
				break;
		}

		const version = `${major}.${minor}.${patch}`;
		
		// Update cache
		if (this.cache) {
			this.cache.currentVersion = { major, minor, patch, full: version };
			this.cache.lastUpdate = Date.now();
		}

		return version;
	}

	/**
	 * Update last processed commit
	 */
	private async updateLastProcessedCommit(commitHash: string): Promise<void> {
		if (this.cache) {
			this.cache.lastProcessedCommit = commitHash;
			this.saveVersionCache();
		}
	}

	/**
	 * Update version file with new version info
	 */
	async updateVersionFile(versionInfo: VersionInfo): Promise<void> {
		try {
			// Update cache
			if (this.cache) {
				this.cache.lastProcessedCommit = versionInfo.hash;
				this.saveVersionCache();
			}

			// Get git info
			const gitInfo = await this.getGitInfo();

			// Update version.ts file
			const versionContent = `// AUTO-GENERATED - DO NOT EDIT MANUALLY
export const VERSION = {
	major: ${this.getCurrentVersion().major},
	minor: ${this.getCurrentVersion().minor},
	patch: ${this.getCurrentVersion().patch},
	full: "${versionInfo.version}",
	generated: "${new Date().toISOString()}",
	git: ${JSON.stringify(gitInfo, null, 2)},
	changelog: {
		bumpType: "${versionInfo.bumpType}",
		reason: "${versionInfo.reason}",
		commits: ${versionInfo.newCommits.length},
	},
} as const;
`;

			const versionFilePath = path.join(__dirname, "version.ts");
			fs.writeFileSync(versionFilePath, versionContent);

			// Update package.json version
			const packageJsonPath = path.join(process.cwd(), "package.json");
			if (fs.existsSync(packageJsonPath)) {
				const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
				packageJson.version = versionInfo.version;
				fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
				console.log(`📦 package.json version synced to ${versionInfo.version}`);
			}

			console.log(`✅ Version updated to ${versionInfo.version} (${versionInfo.bumpType})`);
			console.log(`📝 Reason: ${versionInfo.reason}`);
		} catch (error) {
			console.error("Error updating version file:", error);
		}
	}

	/**
	 * Get current git information
	 */
	private async getGitInfo(): Promise<any> {
		try {
			const { execSync } = require("child_process");
			
			const hash = execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
			const shortHash = hash.substring(0, 7);
			const branch = execSync("git rev-parse --abbrev-ref HEAD", { encoding: "utf8" }).trim();
			const author = execSync("git log -1 --format=%an", { encoding: "utf8" }).trim();
			const date = execSync("git log -1 --format=%cd", { encoding: "utf8" }).trim();

			return {
				hash,
				shortHash,
				branch,
				author,
				date,
				available: true,
			};
		} catch (error) {
			return {
				hash: "unknown",
				shortHash: "unknown",
				branch: "unknown",
				author: "unknown", 
				date: "unknown",
				available: false,
			};
		}
	}
}

export const versionDetector = new ConventionalCommitVersionDetector();
