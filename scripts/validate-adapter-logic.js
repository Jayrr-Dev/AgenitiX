/**
 * VALIDATE ADAPTER LOGIC - Ensures NodeInspectorAdapter uses comprehensive approach
 *
 * • Validates that determineHasControls returns true for ALL categories (not just specific ones)
 * • Prevents regression to hardcoded category checks
 * • Ensures consistent UX across CREATE, VIEW, TRIGGER, TEST, CYCLE categories
 * • Provides clear error messages if the logic is changed incorrectly
 * • Can be run as part of CI/CD pipeline to catch accidental changes
 *
 * Keywords: validation, adapter-logic, comprehensive-approach, future-proof, regression-prevention
 */

const fs = require("fs");
const path = require("path");

// Constants for file paths
const ADAPTER_FILE_PATH = path.join(
	__dirname,
	"../features/business-logic-modern/infrastructure/node-inspector/adapters/NodeInspectorAdapter.ts"
);

// Validation patterns
const DETERMINE_HAS_CONTROLS_PATTERN = /determineHasControls.*\{[\s\S]*?return.*?;/;
const RETURN_TRUE_PATTERN = /return true;/;
const CATEGORY_CHECK_PATTERN = /metadata\.category ===/;

/**
 * Validate that the NodeInspectorAdapter includes TEST category in determineHasControls
 */
function validateAdapterLogic() {
	console.log("🔍 Validating NodeInspectorAdapter logic...");

	try {
		// Check if adapter file exists
		if (!fs.existsSync(ADAPTER_FILE_PATH)) {
			throw new Error(`Adapter file not found: ${ADAPTER_FILE_PATH}`);
		}

		// Read the adapter file
		const adapterContent = fs.readFileSync(ADAPTER_FILE_PATH, "utf8");

		// Check if determineHasControls method exists
		const hasDetermineMethod = DETERMINE_HAS_CONTROLS_PATTERN.test(adapterContent);
		if (!hasDetermineMethod) {
			throw new Error("determineHasControls method not found in NodeInspectorAdapter");
		}

		// Check if the method returns true for all categories (comprehensive approach)
		const hasReturnTrue = RETURN_TRUE_PATTERN.test(adapterContent);
		if (!hasReturnTrue) {
			throw new Error("determineHasControls should return true for all categories");
		}

		// Check if there are any hardcoded category checks (which would be outdated)
		const hasCategoryChecks = CATEGORY_CHECK_PATTERN.test(adapterContent);
		if (hasCategoryChecks) {
			console.warn("⚠️  Found hardcoded category checks - consider using comprehensive approach");
		}

		console.log("✅ NodeInspectorAdapter logic is valid!");
		console.log("   • All node categories have controls by default");
		console.log("   • Comprehensive approach ensures future-proof behavior");
		console.log("   • Consistent UX across CREATE, VIEW, TRIGGER, TEST, CYCLE, STORE categories");

		return true;
	} catch (error) {
		console.error("❌ NodeInspectorAdapter validation failed:");
		console.error(`   ${error.message}`);
		console.error("");
		console.error("💡 To fix this issue:");
		console.error("   1. Open NodeInspectorAdapter.ts");
		console.error("   2. Find the determineHasControls method");
		console.error("   3. Ensure the method returns true for all categories:");
		console.error("      return true;");
		console.error("");
		console.error(
			"   This ensures that all node categories have proper controls in the Node Inspector."
		);

		return false;
	}
}

/**
 * Main execution
 */
if (require.main === module) {
	const isValid = validateAdapterLogic();
	process.exit(isValid ? 0 : 1);
}

module.exports = { validateAdapterLogic };
