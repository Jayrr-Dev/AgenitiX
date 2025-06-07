/**
 * NODE INSPECTOR MODULE V2U - Enhanced node inspection with V2U system integration
 *
 * 🎯 V2U UPGRADE: Complete module exports with V2U system integration
 * • Original NodeInspector for backwards compatibility
 * • Enhanced NodeInspectorV2U with complete V2U feature set
 * • V2U-specific components and hooks for advanced inspection
 * • Type definitions and constants for V2U system
 * • Utility functions for enhanced debugging and monitoring
 *
 * Keywords: v2u-exports, node-inspector, enhanced, compatibility, system-integration
 */

// ============================================================================
// MAIN INSPECTOR COMPONENTS
// ============================================================================

// Original NodeInspector (backwards compatible)
export { default as NodeInspector } from "./NodeInspector";

// V2U Enhanced NodeInspector (recommended for new implementations)
export { default as NodeInspectorV2U } from "./NodeInspectorV2U";

// ============================================================================
// V2U ENHANCED COMPONENTS
// ============================================================================

// V2U Inspector Sub-components
export { V2ULifecycleInspector } from "./components/v2u/V2ULifecycleInspector";

// Original Inspector Components (still useful with V2U)
export { EdgeInspector } from "./components/EdgeInspector";
export { ErrorLog } from "./components/ErrorLog";
export { NodeControls } from "./components/NodeControls";
export { NodeHeader } from "./components/NodeHeader";
export { NodeOutput } from "./components/NodeOutput";

// ============================================================================
// V2U ENHANCED HOOKS
// ============================================================================

// Enhanced state management hooks
export { useInspectorState } from "./hooks/useInspectorState"; // V2U enhanced
export { useEnhancedInspectorState, useV2UState } from "./hooks/useV2UState";

// ============================================================================
// V2U ENHANCED UTILITIES
// ============================================================================

// Enhanced utilities with V2U support
export { JsonHighlighter } from "./utils/JsonHighlighter";

// ============================================================================
// V2U ENHANCED TYPES AND CONSTANTS
// ============================================================================

// V2U Types
export type {
  V2UEventInspectorProps,
  V2UEventState,
  V2UInspectorConfig,
  V2UInspectorTabProps,
  V2ULifecycleInspectorProps,
  V2ULifecycleState,
  V2UNodeMetadata,
  V2UNodeState,
  V2UPerformanceInspectorProps,
  V2UPerformanceState,
  V2UPluginInspectorProps,
  V2UPluginState,
  V2USecurityInspectorProps,
  V2USecurityState,
  V2USystemHooks,
} from "./types";

// Original Types (enhanced with V2U)
export type {
  BaseControlProps,
  EditingRefs,
  ErrorType,
  InspectorState,
  JsonHighlighterProps,
  NodeControlsProps,
  NodeError,
  NodeInspectorProps,
  NodeType,
  NodeTypeConfig,
} from "./types";

// V2U Enhanced Constants
export {
  V2U_EVENT_CONFIG,
  V2U_INSPECTOR_CONFIG,
  V2U_LIFECYCLE_CONFIG,
  V2U_PERFORMANCE_CONFIG,
  V2U_PLUGIN_CONFIG,
  V2U_SECURITY_CONFIG,
  V2U_UI_CONFIG,
} from "./constants";

// Original Constants (still useful)
export {
  DEFAULT_DURATIONS,
  DEFAULT_VALUES,
  ERROR_CATEGORIES,
  ERROR_SEVERITY,
  ERROR_TYPES,
  LEGACY_CONSTANTS,
  VALIDATION,
  VALIDATION_RULES,
} from "./constants";

// ============================================================================
// V2U SYSTEM INFORMATION
// ============================================================================

/**
 * V2U Inspector System Information
 * Provides information about the V2U upgrade and capabilities
 */
export const V2U_INSPECTOR_INFO = {
  version: "2.0.0",
  upgraded: true,
  features: {
    lifecycleMonitoring: true,
    securityTracking: true,
    performanceMetrics: true,
    eventSystemIntegration: true,
    pluginSupport: true,
    advancedDebugging: true,
    backwardsCompatibility: true,
  },
  components: {
    original: "NodeInspector",
    enhanced: "NodeInspectorV2U",
    lifecycle: "V2ULifecycleInspector",
    security: "V2USecurityInspector", // Coming soon
    performance: "V2UPerformanceInspector", // Coming soon
    events: "V2UEventInspector", // Coming soon
    plugins: "V2UPluginInspector", // Coming soon
  },
  hooks: {
    v2uState: "useV2UState",
    enhancedInspector: "useInspectorState", // V2U enhanced
    compatibility: "useEnhancedInspectorState", // Alias
  },
  migration: {
    fromOriginal: "Replace NodeInspector with NodeInspectorV2U",
    breakingChanges: false,
    additionalFeatures: [
      "Real-time V2U system monitoring",
      "Lifecycle hooks debugging",
      "Security violation tracking",
      "Performance metrics visualization",
      "Event history and filtering",
      "Plugin status monitoring",
      "Advanced debugging tools",
    ],
  },
} as const;

// ============================================================================
// BACKWARDS COMPATIBILITY HELPERS
// ============================================================================

/**
 * Legacy export alias for backwards compatibility
 * @deprecated Use NodeInspectorV2U for enhanced V2U features
 */
export { default as LegacyNodeInspector } from "./NodeInspector";

/**
 * Check if a node is V2U enhanced
 */
export function isV2UNode(node: any): boolean {
  if (!node || !node.data) return false;

  return (
    node.data._v2uMigrated === true ||
    node.data._v2uVersion !== undefined ||
    node.data._defineNodeConfig !== undefined
  );
}

/**
 * Get V2U system capabilities for a node
 */
export function getV2UCapabilities(node: any) {
  if (!isV2UNode(node)) {
    return {
      isV2U: false,
      capabilities: [],
      version: null,
    };
  }

  const nodeData = node.data;
  const capabilities = [];

  // Check for specific V2U capabilities
  if (nodeData._lifecycleConfig) capabilities.push("lifecycle");
  if (nodeData._securityConfig) capabilities.push("security");
  if (nodeData._performanceConfig) capabilities.push("performance");
  if (nodeData._enabledPlugins) capabilities.push("plugins");
  if (nodeData._eventConfig) capabilities.push("events");

  return {
    isV2U: true,
    capabilities,
    version: nodeData._v2uVersion || "2.0.0",
    migrationDate: nodeData._v2uMigrationDate,
  };
}

// ============================================================================
// DEFAULT EXPORT (V2U ENHANCED)
// ============================================================================

// Export V2U enhanced inspector as default for new implementations
export { default } from "./NodeInspectorV2U";
