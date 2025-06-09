/**
 * CORE FACTORY SYSTEM EXPORTS
 *
 * Centralized exports for core factory functionality including style initialization,
 * unified integration, and other essential systems.
 *
 * @author Factory Core Team
 * @since v3.0.0
 */

// Style Initialization System
export {
  areStylesInjected,
  ENTERPRISE_STYLES,
  getStyleMetrics,
  initializeEnterpriseStyles,
  initializeEnterpriseStylesLegacy,
  removeEnterpriseStyles,
  resetStyleSentinel,
  validateInjectedStyles,
} from "./StyleInitializer";

export type { StyleInitializerOptions, StyleMetrics } from "./StyleInitializer";

// Unified Integration (already exists)
export {
  createIntegratedFactory,
  createUnifiedFactory,
} from "./UnifiedIntegration";

export type { UnifiedNodeFactory } from "./UnifiedIntegration";
