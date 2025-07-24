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
	console.log("🔍 Analyzing commit history for version changes...");
	
	try {
		const versionInfo = await versionDetector.detectChanges();
		
		if (!versionInfo) {
			console.log("✅ No version changes needed - no new conventional commits found");
			return;
		}

		console.log("\n📊 Version Analysis Results:");
		console.log(`🏷️  New Version: ${versionInfo.version}`);
		console.log(`📈 Bump Type: ${versionInfo.bumpType}`);
		console.log(`📝 Reason: ${versionInfo.reason}`);
		console.log(`📦 Commits Analyzed: ${versionInfo.newCommits.length}`);
		
		if (versionInfo.newCommits.length > 0) {
			console.log("\n📋 New Commits:");
			versionInfo.newCommits.forEach((commit, index) => {
				console.log(`  ${index + 1}. ${commit.title} (${commit.hash.substring(0, 7)})`);
			});
		}

		// Update version file
		await versionDetector.updateVersionFile(versionInfo);
		
		console.log("\n🎉 Version successfully updated!");
		
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