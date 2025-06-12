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

import { useNodeStyleStore } from "../stores/nodeStyleStore";

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

  try {
    // Get the store actions
    const store = useNodeStyleStore.getState();
    
    // Enable category theming
    store.enableCategoryTheming();

    // Enable debug mode if requested
    if (enableDebug) {
      store.toggleDebugMode();
    }

    if (logStatistics) {
      console.log("✅ Theme system initialized successfully");
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

  const state = useNodeStyleStore.getState();

  // Check if category theming is enabled
  if (!state.categoryTheming.enabled) {
    console.log("❌ ISSUE: Category theming is DISABLED");
    console.log(
      "   Solution: Call initializeThemeSystem() or enableCategoryTheming()"
    );
  } else {
    console.log("✅ Category theming is enabled");
  }

  // Check debug mode
  if (state.categoryTheming.debugMode) {
    console.log("🔧 Debug mode is enabled");
  } else {
    console.log("📋 Debug mode is disabled");
  }

  // Check theme overrides
  const overrideCount = Object.keys(state.categoryTheming.customOverrides).length;
  console.log(`📋 Custom theme overrides: ${overrideCount}`);

  console.log("========================================");

  return state;
}

// ============================================================================
// MANUAL THEME CONTROLS
// ============================================================================

/**
 * ENABLE THEME DEBUG MODE
 * Enables detailed theme debugging
 */
export function enableDebugMode() {
  const store = useNodeStyleStore.getState();
  if (!store.categoryTheming.debugMode) {
    store.toggleDebugMode();
  }
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
