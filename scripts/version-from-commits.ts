#!/usr/bin/env npx ts-node
/**
 * VERSION FROM COMMITS - Analyze GitHub commits for semantic versioning
 *
 * • Reads commit history since last processed commit
 * • Parses conventional commits to determine version bumps
 * • Updates version.ts file with new version
 * • Can be run manually or in CI/CD pipeline
 */

import { versionDetector } from "../features/business-logic-modern/infrastructure/versioning/version-detector";

async function main() {
	try {
		const versionInfo = await versionDetector.detectChanges();

		if (!versionInfo) {
			return;
		}

		if (versionInfo.newCommits.length > 0) {
			versionInfo.newCommits.forEach((_commit, _index) => {});
		}

		// Update version file
		await versionDetector.updateVersionFile(versionInfo);
	} catch (error) {
		console.error("❌ Error analyzing commits:", error);
		process.exit(1);
	}
}

// Run if called directly
if (require.main === module) {
	main();
}

export { main as analyzeCommitsForVersioning };
