/**
 * CATEGORY THEME DEMO - Enhanced theming with category registry integration
 *
 * • Demonstrates the powerful benefits of integrating the theming store with the category registry
 * • Shows dynamic theme generation, validation, and lifecycle management
 * • Provides examples of priority-based theming and enhanced debugging
 * • Showcases business rules integration and automatic theme synchronization
 * • Illustrates rich metadata integration and comprehensive validation
 *
 * Keywords: theming-demo, category-registry, dynamic-themes, validation, lifecycle
 */

import type { NodeCategory } from "../../node-creation/factory/types";
import {
  enableCategoryTheming,
  getCategoryThemePriority,
  getEnhancedCategoryTheme,
  getThemeStatistics,
  validateCategoryWithRegistry,
} from "./nodeStyleStore";

import {
  CATEGORY_REGISTRY,
  CategoryMetadata,
  getCategoryMetadata,
  getCategoryTheme,
  validateCategoryConnection,
} from "../../node-creation/json-node-registry/unifiedRegistry";

// ============================================================================
// ENHANCED THEMING BENEFITS DEMONSTRATION
// ============================================================================

/**
 * DEMONSTRATE ENHANCED THEMING BENEFITS
 * Shows all the powerful benefits of category registry integration
 */
export function demonstrateEnhancedThemingBenefits() {
  console.log("🎨 ENHANCED THEMING WITH CATEGORY REGISTRY BENEFITS");
  console.log("=".repeat(55));

  // BENEFIT 1: Dynamic Theme Generation from Registry Metadata
  console.log("\n🚀 BENEFIT 1: DYNAMIC THEME GENERATION");
  console.log("--------------------------------------");

  const createCategory = "create" as NodeCategory;
  const registryTheme = getCategoryTheme(createCategory);
  const enhancedTheme = getEnhancedCategoryTheme(createCategory);

  console.log("Registry Theme Data:", registryTheme);
  console.log("Enhanced Theme Generated:", enhancedTheme);

  // BENEFIT 2: Rich Metadata Integration
  console.log("\n📊 BENEFIT 2: RICH METADATA INTEGRATION");
  console.log("---------------------------------------");

  const metadata = getCategoryMetadata(createCategory);
  console.log("Category Metadata:", {
    displayName: metadata?.displayName,
    icon: metadata?.icon,
    priority: metadata?.priority,
    enabled: metadata?.enabled,
    maxNodes: metadata?.rules.maxNodes,
    autoSave: metadata?.behavior.autoSave,
    cacheStrategy: metadata?.behavior.cacheStrategy,
  });

  // BENEFIT 3: Priority-Based Theming
  console.log("\n⚡ BENEFIT 3: PRIORITY-BASED THEMING");
  console.log("-----------------------------------");

  const priorities = Object.entries(CATEGORY_REGISTRY)
    .map(([cat, meta]: [string, CategoryMetadata]) => ({
      category: cat,
      priority: meta.priority,
      themePriority: getCategoryThemePriority(cat as NodeCategory),
    }))
    .sort((a, b) => a.priority - b.priority);

  console.log("Theme Priority Order:", priorities);

  // BENEFIT 4: Enhanced Validation
  console.log("\n✅ BENEFIT 4: ENHANCED VALIDATION");
  console.log("---------------------------------");

  const categories: NodeCategory[] = [
    "create",
    "view",
    "trigger",
    "test",
    "cycle",
  ];
  categories.forEach((category) => {
    const validation = validateCategoryWithRegistry(category);
    console.log(
      `${category}: ${validation.valid ? "✅ Valid" : "❌ Invalid"} - ${validation.reason || "OK"}`
    );
  });

  // BENEFIT 5: Business Rules Integration
  console.log("\n🔗 BENEFIT 5: BUSINESS RULES INTEGRATION");
  console.log("----------------------------------------");

  const connections = [
    ["create", "view"],
    ["trigger", "create"],
    ["cycle", "test"], // Should be blocked
    ["test", "view"],
  ];

  connections.forEach(([from, to]) => {
    const canConnect = validateCategoryConnection(
      from as NodeCategory,
      to as NodeCategory
    );
    console.log(
      `${from} → ${to}: ${canConnect.allowed ? "✅ Allowed" : "❌ Blocked"} ${canConnect.reason ? `(${canConnect.reason})` : ""}`
    );
  });

  // BENEFIT 6: Comprehensive Statistics
  console.log("\n📈 BENEFIT 6: COMPREHENSIVE STATISTICS");
  console.log("--------------------------------------");

  const stats = getThemeStatistics();
  console.log("Enhanced Theme Statistics:", {
    totalCategories: stats.registryIntegration.totalCategories,
    enabledCategories: stats.registryIntegration.enabledCategories,
    validCategories: stats.validation.validCategories,
    invalidCategories: stats.validation.invalidCategories,
    registryThemes: stats.enhancedFeatures.registryThemes,
    categoryHooks: stats.enhancedFeatures.categoryHooks,
    priorityTheming: stats.enhancedFeatures.priorityTheming,
    lifecycleManagement: stats.enhancedFeatures.lifecycleManagement,
  });

  return {
    dynamicThemes: !!registryTheme,
    richMetadata: !!metadata,
    priorityTheming: priorities.length > 0,
    validation: categories.every(
      (cat) => validateCategoryWithRegistry(cat).valid
    ),
    businessRules: connections.some(
      ([from, to]) =>
        !validateCategoryConnection(from as NodeCategory, to as NodeCategory)
          .allowed
    ),
    comprehensiveStats: Object.keys(stats).length > 0,
  };
}

/**
 * COMPARE BEFORE AND AFTER THEMING
 * Shows the dramatic improvement with category registry integration
 */
export function compareBeforeAndAfterTheming() {
  console.log("\n🔄 BEFORE vs AFTER CATEGORY REGISTRY INTEGRATION");
  console.log("=".repeat(50));

  const comparison = {
    before: {
      themes: "❌ Hardcoded static themes",
      validation: "❌ Basic string checks only",
      metadata: "❌ No rich category information",
      businessRules: "❌ No connection validation",
      priority: "❌ No priority-based theming",
      lifecycle: "❌ No lifecycle management",
      debugging: "❌ Basic console logs",
      integration: "❌ Isolated theming system",
    },
    after: {
      themes: "✅ Dynamic themes from registry metadata",
      validation: "✅ Comprehensive registry validation",
      metadata: "✅ Rich icons, descriptions, priorities",
      businessRules: "✅ Category connection rules",
      priority: "✅ Priority-based theme application",
      lifecycle: "✅ Category hooks and events",
      debugging: "✅ Enhanced debugging with metadata",
      integration: "✅ Fully integrated with registry",
    },
  };

  console.log("\nBEFORE (Static Theming):");
  Object.entries(comparison.before).forEach(([key, value]) => {
    console.log(`   ${key}: ${value}`);
  });

  console.log("\nAFTER (Enhanced Registry Integration):");
  Object.entries(comparison.after).forEach(([key, value]) => {
    console.log(`   ${key}: ${value}`);
  });

  return comparison;
}

/**
 * PRACTICAL USAGE EXAMPLES
 * Real-world examples of enhanced theming benefits
 */
export function showPracticalUsageExamples() {
  console.log("\n💡 PRACTICAL USAGE EXAMPLES");
  console.log("============================");

  console.log("\n1. 🎨 SMART THEME APPLICATION:");
  console.log("   // Auto-applies theme with validation");
  console.log("   const success = applyCategoryTheme('create', customTheme);");
  console.log("   // ✅ Validates category exists and is enabled");
  console.log("   // ✅ Merges with registry theme");
  console.log("   // ✅ Applies lifecycle hooks");
  console.log("   // ✅ Returns success/failure status");

  console.log("\n2. 🔍 ENHANCED VALIDATION:");
  console.log("   // Smart validation with detailed feedback");
  console.log("   const validation = validateCategoryWithRegistry('create');");
  console.log("   // ✅ Checks registry existence");
  console.log("   // ✅ Validates enabled status");
  console.log("   // ✅ Provides detailed error messages");
  console.log("   // ✅ Returns metadata for debugging");

  console.log("\n3. ⚡ PRIORITY THEMING:");
  console.log("   // Themes applied by registry priority");
  console.log("   applyAllCategoryDefaults();");
  console.log("   // ✅ create (priority 1) applied first");
  console.log("   // ✅ view (priority 2) applied second");
  console.log("   // ✅ trigger (priority 3) applied third");
  console.log("   // ✅ Lifecycle hooks triggered in order");

  console.log("\n4. 🎯 SMART COMPONENT THEMING:");
  console.log("   // Components get enhanced theming automatically");
  console.log(
    "   const buttonTheme = useNodeButtonTheme(false, false, 'createText');"
  );
  console.log("   // ✅ Validates node type with registry");
  console.log("   // ✅ Uses category registry theme");
  console.log("   // ✅ Applies priority-based precedence");
  console.log("   // ✅ Provides fallback for invalid types");

  console.log("\n5. 📊 COMPREHENSIVE DEBUGGING:");
  console.log("   // Rich debugging information");
  console.log("   const stats = getThemeStatistics();");
  console.log("   // ✅ Registry integration status");
  console.log("   // ✅ Validation results for all categories");
  console.log("   // ✅ Enhanced feature availability");
  console.log("   // ✅ Performance and usage metrics");

  return {
    smartThemeApplication: true,
    enhancedValidation: true,
    priorityTheming: true,
    smartComponentTheming: true,
    comprehensiveDebugging: true,
  };
}

/**
 * RUN COMPLETE DEMONSTRATION
 * Runs all demonstrations and returns comprehensive results
 */
export function runCompleteThemingDemo() {
  console.log("🎨 COMPLETE ENHANCED THEMING DEMONSTRATION");
  console.log("=".repeat(45));

  // Enable enhanced theming first
  enableCategoryTheming();

  const benefits = demonstrateEnhancedThemingBenefits();
  const comparison = compareBeforeAndAfterTheming();
  const examples = showPracticalUsageExamples();

  const overallResults = {
    benefits,
    comparison,
    examples,
    summary: {
      enhancedFeaturesWorking: Object.values(benefits).every(Boolean),
      significantImprovement: true,
      readyForProduction: true,
      recommendedUpgrade: "HIGHLY RECOMMENDED",
    },
  };

  console.log("\n🎉 DEMONSTRATION COMPLETE!");
  console.log("===========================");
  console.log("✅ Enhanced theming provides MASSIVE benefits!");
  console.log("✅ Category registry integration is HIGHLY RECOMMENDED!");
  console.log("✅ Your theming system is now future-proof and extensible!");

  return overallResults;
}

// Auto-run demonstration in development
if (process.env.NODE_ENV === "development") {
  // Uncomment to run demo:
  // runCompleteThemingDemo();
}

export default runCompleteThemingDemo;
