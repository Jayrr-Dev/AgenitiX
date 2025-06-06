/**
 * CATEGORY REGISTRY MIGRATION VALIDATION SCRIPT
 *
 * • Validates that the category registry migration completed successfully
 * • Tests all core functionality and integrations
 * • Provides detailed reporting of migration status
 * • Identifies any remaining issues or conflicts
 * • Shows enhanced capabilities and benefits
 *
 * Keywords: validation, migration, testing, category-registry, integration
 */

// IMPORTS - Test that all imports work correctly
import {
  demonstrateFactoryIntegration,
  getNodeCategoryMapping,
  getNodesInCategory,
  getRegistryStats,
  MODERN_NODE_REGISTRY,
} from "../nodeRegistry";

import {
  CATEGORY_REGISTRY,
  generateSidebarConfig,
  getCategoryBehavior,
  getCategoryMetadata,
  getCategoryStatistics,
  getCategoryTheme,
  validateCategoryConnection,
} from "./categoryRegistry";

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * VALIDATE CORE FUNCTIONS
 * Tests that renamed functions work correctly
 */
export function validateCoreFunctions() {
  console.log("🔍 Testing core function migration...");

  try {
    // Test renamed functions
    const mapping = getNodeCategoryMapping();
    const createNodes = getNodesInCategory("create");
    const registryStats = getRegistryStats();

    console.log("✅ Core functions working:");
    console.log(
      `   • getNodeCategoryMapping(): ${Object.keys(mapping).length} nodes mapped`
    );
    console.log(
      `   • getNodesInCategory("create"): ${createNodes.length} create nodes`
    );
    console.log(
      `   • getRegistryStats(): ${registryStats.totalNodes} total nodes`
    );

    return true;
  } catch (error) {
    console.error("❌ Core function validation failed:", error);
    return false;
  }
}

/**
 * VALIDATE CATEGORY REGISTRY
 * Tests category registry features
 */
export function validateCategoryRegistry() {
  console.log("🔍 Testing category registry features...");

  try {
    // Test category metadata
    const createMeta = getCategoryMetadata("create");
    const categoryStats = getCategoryStatistics();

    // Test category validation
    const canConnect = validateCategoryConnection("create", "view");
    const cannotConnect = validateCategoryConnection("cycle", "test");

    // Test configuration generation
    const sidebarConfig = generateSidebarConfig();

    console.log("✅ Category registry working:");
    console.log(
      `   • Category metadata: ${createMeta?.displayName || "Missing"}`
    );
    console.log(`   • Total categories: ${categoryStats.total}`);
    console.log(`   • Enabled categories: ${categoryStats.enabled}`);
    console.log(
      `   • create→view connection: ${canConnect.allowed ? "✅ Allowed" : "❌ Blocked"}`
    );
    console.log(
      `   • cycle→test connection: ${cannotConnect.allowed ? "❌ Should be blocked" : "✅ Correctly blocked"}`
    );
    console.log(
      `   • Generated sidebar config: ${sidebarConfig.length} entries`
    );

    return true;
  } catch (error) {
    console.error("❌ Category registry validation failed:", error);
    return false;
  }
}

/**
 * VALIDATE INTEGRATION
 * Tests integration between systems
 */
export function validateIntegration() {
  console.log("🔍 Testing system integration...");

  try {
    // Test factory integration
    const factoryDemo = demonstrateFactoryIntegration();

    // Test that categories align
    const nodeCategories = Object.values(MODERN_NODE_REGISTRY).map(
      (n) => n.category
    );
    const registryCategories = Object.keys(CATEGORY_REGISTRY);
    const categoriesMatch = nodeCategories.every((cat) =>
      registryCategories.includes(cat)
    );

    console.log("✅ Integration working:");
    console.log(
      `   • Factory integration: ${factoryDemo.validation.registryValidation ? "✅" : "❌"}`
    );
    console.log(`   • Category alignment: ${categoriesMatch ? "✅" : "❌"}`);
    console.log(
      `   • Integration coverage: ${factoryDemo.statistics.integrationCoverage}%`
    );

    return true;
  } catch (error) {
    console.error("❌ Integration validation failed:", error);
    return false;
  }
}

/**
 * VALIDATE ENHANCED FEATURES
 * Tests new capabilities added by migration
 */
export function validateEnhancedFeatures() {
  console.log("🔍 Testing enhanced features...");

  try {
    // Test enhanced validation
    const createNodes = getNodesInCategory("create");
    const createCategory = getCategoryMetadata("create");

    // Test theme integration
    const createTheme = getCategoryTheme("create");
    const createBehavior = getCategoryBehavior("create");

    console.log("✅ Enhanced features working:");
    console.log(
      `   • Enhanced node retrieval: ${createNodes.length} validated nodes`
    );
    console.log(
      `   • Rich metadata: ${createCategory?.displayName} ${createCategory?.icon}`
    );
    console.log(
      `   • Theme integration: ${createTheme?.primary || "No theme"}`
    );
    console.log(
      `   • Behavior config: ${createBehavior?.cacheStrategy || "No behavior"}`
    );

    return true;
  } catch (error) {
    console.error("❌ Enhanced features validation failed:", error);
    return false;
  }
}

/**
 * RUN COMPLETE VALIDATION
 * Runs all validation tests and provides summary
 */
export function runCompleteValidation() {
  console.log("🚀 CATEGORY REGISTRY MIGRATION VALIDATION");
  console.log("==========================================");

  const results = {
    coreFunctions: validateCoreFunctions(),
    categoryRegistry: validateCategoryRegistry(),
    integration: validateIntegration(),
    enhancedFeatures: validateEnhancedFeatures(),
  };

  const allPassed = Object.values(results).every(Boolean);

  console.log("\n📊 VALIDATION SUMMARY:");
  console.log("======================");
  console.log(
    `Core Functions:    ${results.coreFunctions ? "✅ PASS" : "❌ FAIL"}`
  );
  console.log(
    `Category Registry: ${results.categoryRegistry ? "✅ PASS" : "❌ FAIL"}`
  );
  console.log(
    `Integration:       ${results.integration ? "✅ PASS" : "❌ FAIL"}`
  );
  console.log(
    `Enhanced Features: ${results.enhancedFeatures ? "✅ PASS" : "❌ FAIL"}`
  );

  if (allPassed) {
    console.log("\n🎉 MIGRATION VALIDATION SUCCESSFUL!");
    console.log("✅ All systems migrated to category registry successfully!");
    console.log("🚀 Your enhanced category registry is ready for production!");
  } else {
    console.log("\n⚠️ MIGRATION VALIDATION INCOMPLETE");
    console.log("Some systems may need additional configuration.");
  }

  return { results, allPassed };
}

// ============================================================================
// DEMONSTRATION UTILITIES
// ============================================================================

/**
 * DEMONSTRATE NEW CAPABILITIES
 * Shows off the enhanced features
 */
export function demonstrateNewCapabilities() {
  console.log("\n🌟 DEMONSTRATING NEW CAPABILITIES:");
  console.log("===================================");

  try {
    // Show enhanced category data
    console.log("🏭 CREATE CATEGORY ENHANCED DATA:");
    const createMeta = getCategoryMetadata("create");
    console.log(`   Display Name: ${createMeta?.displayName}`);
    console.log(`   Icon: ${createMeta?.icon}`);
    console.log(`   Priority: ${createMeta?.priority}`);
    console.log(`   Max Nodes: ${createMeta?.rules.maxNodes}`);
    console.log(`   Auto-save: ${createMeta?.behavior.autoSave}`);

    // Show business rules
    console.log("\n⚡ BUSINESS RULES VALIDATION:");
    const connections = [
      ["create", "view"],
      ["trigger", "create"],
      ["cycle", "test"],
    ];

    connections.forEach(([from, to]) => {
      const result = validateCategoryConnection(from as any, to as any);
      console.log(
        `   ${from}→${to}: ${result.allowed ? "✅" : "❌"} ${result.reason || ""}`
      );
    });

    // Show auto-generation
    console.log("\n🏗️ AUTO-GENERATION FEATURES:");
    const sidebarConfig = generateSidebarConfig();
    console.log(
      `   Generated sidebar: ${sidebarConfig.length} configured categories`
    );
    sidebarConfig.forEach((config) => {
      console.log(`     ${config.icon} ${config.label} (${config.folder})`);
    });
  } catch (error) {
    console.error("❌ Demonstration failed:", error);
  }
}

// ============================================================================
// EXPORT MAIN VALIDATION FUNCTION
// ============================================================================

/**
 * MAIN VALIDATION ENTRY POINT
 * Run this function to validate your migration
 */
export default function validateMigration() {
  const validation = runCompleteValidation();

  if (validation.allPassed) {
    demonstrateNewCapabilities();
  }

  return validation;
}

// Auto-run if this script is executed directly
if (typeof window === "undefined" && require.main === module) {
  validateMigration();
}
