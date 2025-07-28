import * as fs from "node:fs";
import * as path from "node:path";
import { VERSION_CONFIG } from "./auto-version";
import { versionDetector } from "./version-detector";

/**
 * VERSIONING STATUS DASHBOARD - See what's happening in real-time
 *
 * • Visual indicators of version system health
 * • Real-time file change monitoring
 * • Version history and change tracking
 * • Migration status and logs
 */

interface VersionStatus {
	currentVersion: string;
	lastChanged: Date;
	fileChanges: number;
	pendingMigrations: number;
	systemHealth: "healthy" | "warning" | "error";
	recentActivity: ActivityLog[];
}

interface ActivityLog {
	timestamp: Date;
	action: "version_bump" | "file_change" | "migration" | "error";
	details: string;
	files?: string[];
	oldVersion?: string;
	newVersion?: string;
}

class VersioningDashboard {
	private activities: ActivityLog[] = [];

	/**
	 * GET CURRENT STATUS - Everything you need to know at a glance
	 */
	getCurrentStatus(): VersionStatus {
		const version = this.getCurrentVersion();
		const recentChanges = this.getRecentFileChanges();

		return {
			currentVersion: version.full,
			lastChanged: new Date(version.generated),
			fileChanges: recentChanges.length,
			pendingMigrations: this.getPendingMigrations().length,
			systemHealth: this.calculateHealth(),
			recentActivity: this.activities.slice(-10), // Last 10 activities
		};
	}

	/**
	 * PRETTY PRINT STATUS - Beautiful console output
	 */
	printStatus(): void {
		const status = this.getCurrentStatus();

		if (status.recentActivity.length > 0) {
			status.recentActivity.forEach((activity) => {
				const _emoji = this.getActivityEmoji(activity.action);
				const _time = activity.timestamp.toLocaleTimeString();
			});
		}
	}

	/**
	 * WATCH FOR CHANGES - Real-time monitoring
	 */
	startRealTimeMonitoring(): void {
		// Watch for file changes
		try {
			const chokidar = require("chokidar");
			chokidar
				.watch(VERSION_CONFIG.trackFiles, { ignoreInitial: true })
				.on("change", (path: string) => {
					this.logActivity("file_change", `File modified: ${path}`, [path]);
					this.checkForVersionUpdate();
				})
				.on("add", (path: string) => {
					this.logActivity("file_change", `File added: ${path}`, [path]);
					this.checkForVersionUpdate();
				})
				.on("error", (error: Error) => {
					console.error("❌ File watcher error:", error);
					this.logActivity("error", `File watcher error: ${error.message}`);
				});

			// Periodic status updates
			setInterval(() => {
				this.printStatus();
			}, 30000); // Every 30 seconds
		} catch (error) {
			console.error("❌ Could not start file watching:", error);
		}
	}

	private async checkForVersionUpdate(): Promise<void> {
		try {
			const changes = await versionDetector.detectChanges();

			if (changes) {
				this.logActivity(
					"version_bump",
					`Version bumped to ${changes.version} (${changes.bumpType})`,
					changes.changedFiles,
					undefined,
					changes.version
				);
				changes.changedFiles.forEach((_file) => {});
			}
		} catch (error) {
			console.error("❌ Version update check failed:", error);
			this.logActivity("error", `Version check error: ${error}`);
		}
	}

	private logActivity(
		action: ActivityLog["action"],
		details: string,
		files?: string[],
		oldVersion?: string,
		newVersion?: string
	): void {
		this.activities.push({
			timestamp: new Date(),
			action,
			details,
			files,
			oldVersion,
			newVersion,
		});

		// Keep only last 100 activities
		if (this.activities.length > 100) {
			this.activities = this.activities.slice(-100);
		}
	}

	private getHealthEmoji(health: string): string {
		switch (health) {
			case "healthy":
				return "💚";
			case "warning":
				return "⚠️";
			case "error":
				return "❌";
			default:
				return "❓";
		}
	}

	private getActivityEmoji(action: string): string {
		switch (action) {
			case "version_bump":
				return "🚀";
			case "file_change":
				return "📝";
			case "migration":
				return "🔄";
			case "error":
				return "❌";
			default:
				return "📋";
		}
	}

	private calculateHealth(): "healthy" | "warning" | "error" {
		const recentErrors = this.activities
			.filter((a) => a.action === "error")
			.filter((a) => Date.now() - a.timestamp.getTime() < 3600000); // Last hour

		if (recentErrors.length > 5) {
			return "error";
		}
		if (recentErrors.length > 0) {
			return "warning";
		}
		return "healthy";
	}

	private getCurrentVersion(): any {
		try {
			// Try to load the version file directly
			const versionPath = path.join(
				process.cwd(),
				"features/business-logic-modern/infrastructure/versioning/version.ts"
			);

			if (fs.existsSync(versionPath)) {
				const content = fs.readFileSync(versionPath, "utf8");

				// Parse version from TypeScript file
				const versionMatch = content.match(/full: "([^"]+)"/);
				const generatedMatch = content.match(/generated: "([^"]+)"/);

				return {
					full: versionMatch ? versionMatch[1] : "1.0.0",
					generated: generatedMatch ? generatedMatch[1] : new Date().toISOString(),
				};
			}

			// Fallback: try to load from cache
			const cachePath = path.join(process.cwd(), ".version-cache.json");
			if (fs.existsSync(cachePath)) {
				const cache = JSON.parse(fs.readFileSync(cachePath, "utf8"));
				return {
					full: cache.version || "1.0.0",
					generated: new Date(cache.timestamp || Date.now()).toISOString(),
				};
			}
		} catch (error) {
			console.warn("⚠️ Could not load version info:", (error as Error).message);
		}

		// Default fallback
		return {
			full: "1.0.0",
			generated: new Date().toISOString(),
		};
	}

	private getRecentFileChanges(): string[] {
		return this.activities
			.filter((a) => a.action === "file_change")
			.filter((a) => Date.now() - a.timestamp.getTime() < 3600000) // Last hour
			.flatMap((a) => a.files || []);
	}

	private getPendingMigrations(): string[] {
		// Check for migrations that need to run
		return [];
	}
}

export const dashboard = new VersioningDashboard();
