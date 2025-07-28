/**
 * UI Documentation Regenerator
 *
 * Regenerates all UI documentation including the overview.
 * This script ensures all UI documentation is up to date.
 *
 * Usage: pnpm run regenerate:ui-docs
 */

import { generateUIOverview } from "./generate-ui-overview";

async function main() {
	console.log("🔄 Regenerating UI documentation...");

	try {
		// Generate the overview
		await generateUIOverview();

		console.log("✅ UI documentation regeneration complete!");
		console.log("📁 Check the documentation/ui/ directory for updated files.");
	} catch (error) {
		console.error("❌ Error regenerating UI documentation:", error);
		process.exit(1);
	}
}

if (require.main === module) {
	main();
}

export { main as regenerateUIDocs };
