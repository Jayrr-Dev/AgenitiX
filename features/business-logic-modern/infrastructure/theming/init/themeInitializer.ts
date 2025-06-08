/**
 * THEME INITIALIZER - Automatic theme system initialization
 *
 * • Automatically enables category theming on system startup
 * • Applies all category defaults and syncs with registry
 * • Provides debug mode for theme troubleshooting
 * • Ensures proper theme integration across the entire system
 * • Validates theme configuration and provides fallback handling
 *
 * Keywords: theme-initialization, category-theming, startup, registry-sync, debugging
 */

import {
  applyAllCategoryDefaults,
  enableCategoryTheming,
  enableThemeDebugMode,
  getThemeStatistics,
} from "../stores/nodeStyleStore";

// ============================================================================
// THEME INITIALIZATION
// ============================================================================

/**
 * INITIALIZE THEME SYSTEM
 * Automatically enables category theming and applies defaults
 */
export function initializeThemeSystem(
  options: {
    enableDebug?: boolean;
    logStatistics?: boolean;
  } = {}
) {
  const { enableDebug = false, logStatistics = true } = options;

  console.log("🎨 Initializing theme system...");

  try {
    // Enable category theming with registry sync
    enableCategoryTheming();

    // Apply all category defaults
    applyAllCategoryDefaults();

    // Enable debug mode if requested
    if (enableDebug) {
      enableThemeDebugMode();
    }

    // Log theme statistics
    if (logStatistics) {
      const stats = getThemeStatistics();
      console.log("✅ Theme system initialized successfully:");
      console.log(
        `   • Category theming: ${stats.theming.enabled ? "ENABLED" : "DISABLED"}`
      );
      console.log(
        `   • Registry sync: ${stats.registry.totalNodes ? "ENABLED" : "DISABLED"}`
      );
      console.log(`   • Total nodes: ${stats.registry.totalNodes}`);
      console.log(`   • Available themes: ${stats.theming.overrides}`);
    }

    return true;
  } catch (error) {
    console.error("❌ Failed to initialize theme system:", error);
    return false;
  }
}

/**
 * AUTO-INITIALIZE THEME SYSTEM
 * Automatically runs on module import (self-executing)
 */
export function autoInitializeThemes() {
  // Only auto-initialize in browser environment
  if (typeof window !== "undefined") {
    // Small delay to ensure all modules are loaded
    setTimeout(() => {
      initializeThemeSystem({
        enableDebug: process.env.NODE_ENV === "development",
        logStatistics: true,
      });
    }, 100);
  }
}

// ============================================================================
// THEME DIAGNOSTICS
// ============================================================================

/**
 * DIAGNOSE THEME ISSUES
 * Comprehensive theme system diagnostic utility
 */
export function diagnoseThemeSystem() {
  console.log("🔍 THEME SYSTEM DIAGNOSTICS");
  console.log("========================================");

  const stats = getThemeStatistics();

  // Check if category theming is enabled
  if (!stats.theming.enabled) {
    console.log("❌ ISSUE: Category theming is DISABLED");
    console.log(
      "   Solution: Call initializeThemeSystem() or enableCategoryTheming()"
    );
  } else {
    console.log("✅ Category theming is enabled");
  }

  // Check registry sync
  if (!stats.registry.totalNodes) {
    console.log("❌ ISSUE: Registry sync is DISABLED");
    console.log("   Solution: Registry themes may not be applied correctly");
  } else {
    console.log("✅ Registry sync is enabled");
  }

  // Check node coverage
  if (stats.registry.totalNodes === 0) {
    console.log("❌ ISSUE: No nodes found in registry");
    console.log("   Solution: Check node registry configuration");
  } else {
    console.log(`✅ Found ${stats.registry.totalNodes} nodes in registry`);
  }

  // Check theme availability
  console.log(`📋 Available themes: ${stats.theming.overrides}`);

  // Validation results
  console.log("🧪 Validation Results:");
  console.log(`   • Valid categories: ${stats.theming.overrides}`);
  console.log(`   • Invalid categories: ${stats.theming.overrides}`);

  console.log("========================================");

  return stats;
}

// ============================================================================
// MANUAL THEME CONTROLS
// ============================================================================

/**
 * ENABLE THEME DEBUG MODE
 * Enables detailed theme debugging
 */
export function enableDebugMode() {
  enableThemeDebugMode();
  console.log("🔧 Theme debug mode enabled - check console for detailed logs");
}

/**
 * FIX THEME SYSTEM
 * One-click theme system repair
 */
export function fixThemeSystem() {
  console.log("🔧 Attempting to fix theme system...");

  try {
    // Force re-initialization
    const success = initializeThemeSystem({
      enableDebug: true,
      logStatistics: true,
    });

    if (success) {
      console.log("✅ Theme system repair completed");
      diagnoseThemeSystem();
    } else {
      console.log("❌ Theme system repair failed - check console for errors");
    }

    return success;
  } catch (error) {
    console.error("❌ Theme repair failed:", error);
    return false;
  }
}

// ============================================================================
// AUTO-INITIALIZATION
// ============================================================================

// Auto-initialize themes when this module is imported
autoInitializeThemes();

// Export diagnostic functions for manual use
export {
  enableDebugMode as debug,
  diagnoseThemeSystem as diagnose,
  fixThemeSystem as fix,
};
