/**
 * AUTO-MIGRATION - Handles migrations automatically based on version changes
 *
 * Detects schema changes and applies migrations without manual intervention
 */

interface MigrationRule {
	fromPattern: string; // Version pattern to migrate from
	toPattern: string; // Version pattern to migrate to
	transform: (data: any) => any; // Simple transformation function
	description: string;
}

// Define migrations declaratively - system applies them automatically
const AUTO_MIGRATIONS: MigrationRule[] = [
	{
		fromPattern: "1.*.*",
		toPattern: "2.*.*",
		description: "Add error state fields to all nodes",
		transform: (nodeData: any) => ({
			...nodeData,
			isErrorState: false,
			errorType: undefined,
			error: undefined,
		}),
	},

	{
		fromPattern: "2.0.*",
		toPattern: "2.1.*",
		description: "Add enhanced controls flag",
		transform: (nodeData: any) => ({
			...nodeData,
			hasEnhancedControls: true,
		}),
	},
];

class AutoMigrator {
	/**
	 * MIGRATE DATA - Automatically applies needed migrations
	 */
	migrateData(data: any, fromVersion: string, toVersion: string): any {
		let migrated = { ...data };

		// Find and apply all applicable migrations
		for (const migration of AUTO_MIGRATIONS) {
			if (
				this.versionMatches(fromVersion, migration.fromPattern) &&
				this.versionMatches(toVersion, migration.toPattern)
			) {
				migrated = migration.transform(migrated);
			}
		}

		return migrated;
	}

	/**
	 * MIGRATE STORED FLOWS - Automatically updates saved flows
	 */
	async migrateStoredFlows(newVersion: string): Promise<void> {
		try {
			const flows = await this.getStoredFlows();

			for (const flow of flows) {
				const oldVersion = flow.version || "1.0.0";

				if (oldVersion !== newVersion) {
					// Migrate each node in the flow
					if (flow.nodes && Array.isArray(flow.nodes)) {
						flow.nodes = flow.nodes.map((node: any) => ({
							...node,
							data: this.migrateData(node.data, oldVersion, newVersion),
						}));
					}

					flow.version = newVersion;
					await this.saveFlow(flow);
				}
			}
		} catch (error) {
			console.error("❌ Migration error:", error);
		}
	}

	private versionMatches(version: string, pattern: string): boolean {
		if (pattern.includes("*")) {
			const regex = pattern.replace(/\*/g, "\\d+");
			return new RegExp(`^${regex}$`).test(version);
		}
		return version === pattern;
	}

	private async getStoredFlows(): Promise<any[]> {
		// Implementation depends on your storage system
		// For now, return empty array (you can implement actual storage later)
		try {
			// Check if localStorage is available (browser environment)
			if (typeof localStorage !== "undefined") {
				const stored = localStorage.getItem("flows");
				return stored ? JSON.parse(stored) : [];
			}

			// Node.js environment - could check for file storage
			const fs = await import("node:fs");
			if (fs.existsSync("flows.json")) {
				const content = fs.readFileSync("flows.json", "utf8");
				return JSON.parse(content);
			}
		} catch (error) {
			console.warn("⚠️ Could not load stored flows:", error);
		}

		return [];
	}

	private async saveFlow(flow: any): Promise<void> {
		// Implementation depends on your storage system
		try {
			// Browser environment
			if (typeof localStorage !== "undefined") {
				const flows = await this.getStoredFlows();
				const index = flows.findIndex((f: any) => f.id === flow.id);
				if (index >= 0) {
					flows[index] = flow;
				} else {
					flows.push(flow);
				}
				localStorage.setItem("flows", JSON.stringify(flows));
				return;
			}

			// Node.js environment
			const fs = await import("node:fs");
			const flows = await this.getStoredFlows();
			const index = flows.findIndex((f: any) => f.id === flow.id);
			if (index >= 0) {
				flows[index] = flow;
			} else {
				flows.push(flow);
			}
			fs.writeFileSync("flows.json", JSON.stringify(flows, null, 2));
		} catch (error) {
			console.error("❌ Could not save flow:", error);
		}
	}
}

export const autoMigrator = new AutoMigrator();
