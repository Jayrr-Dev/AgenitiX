/**
 * INSPECTOR STATE HOOK V2U - Enhanced state management with V2U integration
 *
 * 🎯 V2U UPGRADE: Enhanced inspector state management with V2U system integration
 * • Backwards compatible with existing useInspectorState functionality
 * • Integration with V2U state monitoring and debugging
 * • Enhanced input synchronization with V2U metadata tracking
 * • Performance optimized state management
 * • Automatic V2U feature detection and activation
 * • Debug mode and advanced configuration support
 *
 * Keywords: v2u-inspector-state, backwards-compatible, enhanced, monitoring
 */

import { useEffect, useState } from "react";
import { useV2UState } from "../../depreciated/useV2UState";
import type { AgenNode } from "../../flow-engine/types/nodeData";
import { DEFAULT_VALUES } from "../constants";

// ============================================================================
// ENHANCED INSPECTOR STATE HOOK
// ============================================================================

/**
 * Enhanced Inspector State Hook with V2U Integration
 * Maintains backwards compatibility while adding V2U features
 */
export function useInspectorState(node: AgenNode | null) {
  // V2U State Integration
  const v2uHook = useV2UState(node);

  // Original Inspector State
  const [inspectorState, setInspectorState] = useState({
    durationInput: "",
    countInput: "",
    multiplierInput: "",
    delayInput: "",
    // V2U Enhanced state
    v2uTabIndex: 0,
    v2uDebugExpanded: false,
    v2uMetricsExpanded: false,
  });

  // Editing References (Enhanced)
  const [editingRefs, setEditingRefs] = useState({
    isEditingCount: false,
    isEditingMultiplier: false,
    // V2U Enhanced editing states
    isEditingV2UConfig: false,
    isEditingV2UMetadata: false,
  });

  // ============================================================================
  // INPUT SYNCHRONIZATION WITH V2U ENHANCEMENT
  // ============================================================================

  /**
   * Sync inputs with node data (Enhanced with V2U support)
   */
  useEffect(() => {
    if (!node) return;

    const nodeData = node.data as any;

    // Original synchronization
    setInspectorState((prev) => ({
      ...prev,
      durationInput: String(nodeData.duration || DEFAULT_VALUES.DURATION),
      countInput: String(nodeData.count || DEFAULT_VALUES.COUNT),
      multiplierInput: String(nodeData.multiplier || DEFAULT_VALUES.MULTIPLIER),
      delayInput: String(nodeData.delay || DEFAULT_VALUES.DELAY),
    }));

    // V2U Enhancement: Log synchronization for debugging
    if (v2uHook.isV2UNode && v2uHook.v2uState?.metadata._v2uMigrated) {
      console.log(`[V2U Inspector] Synced inputs for V2U node: ${node.id}`, {
        nodeType: node.type,
        v2uVersion: nodeData._v2uVersion,
        hasLifecycle: v2uHook.hasLifecycleHooks,
        systemHealth: v2uHook.systemHealth,
      });
    }
  }, [
    node,
    v2uHook.isV2UNode,
    v2uHook.v2uState,
    v2uHook.hasLifecycleHooks,
    v2uHook.systemHealth,
  ]);

  // ============================================================================
  // V2U ENHANCED HELPER FUNCTIONS
  // ============================================================================

  /**
   * Update inspector state with V2U awareness
   */
  const updateInspectorState = (updates: Partial<typeof inspectorState>) => {
    setInspectorState((prev) => ({ ...prev, ...updates }));

    // V2U Enhancement: Track state changes for debugging
    if (v2uHook.isV2UNode && process.env.NODE_ENV === "development") {
      console.log(`[V2U Inspector] State updated:`, updates);
    }
  };

  /**
   * Update editing references with V2U awareness
   */
  const updateEditingRefs = (updates: Partial<typeof editingRefs>) => {
    setEditingRefs((prev) => ({ ...prev, ...updates }));
  };

  /**
   * Check if any inputs are being edited
   */
  const isEditing =
    editingRefs.isEditingCount ||
    editingRefs.isEditingMultiplier ||
    editingRefs.isEditingV2UConfig ||
    editingRefs.isEditingV2UMetadata;

  /**
   * Get input validation status with V2U enhancement
   */
  const getInputValidation = () => {
    const validation = {
      duration: {
        isValid:
          !isNaN(Number(inspectorState.durationInput)) &&
          Number(inspectorState.durationInput) >= 0,
        value: Number(inspectorState.durationInput),
      },
      count: {
        isValid:
          !isNaN(Number(inspectorState.countInput)) &&
          Number(inspectorState.countInput) >= 0,
        value: Number(inspectorState.countInput),
      },
      multiplier: {
        isValid:
          !isNaN(Number(inspectorState.multiplierInput)) &&
          Number(inspectorState.multiplierInput) > 0,
        value: Number(inspectorState.multiplierInput),
      },
      delay: {
        isValid:
          !isNaN(Number(inspectorState.delayInput)) &&
          Number(inspectorState.delayInput) >= 0,
        value: Number(inspectorState.delayInput),
      },
    };

    // V2U Enhancement: Add V2U-specific validation
    if (v2uHook.isV2UNode && v2uHook.v2uState) {
      const v2uValidation = {
        hasV2UErrors:
          v2uHook.hasSecurityViolations || v2uHook.hasPerformanceIssues,
        systemHealth: v2uHook.systemHealth,
        lifecycleStatus: v2uHook.hasLifecycleHooks ? "active" : "inactive",
      };

      return { ...validation, v2u: v2uValidation };
    }

    return validation;
  };

  // ============================================================================
  // RETURN ENHANCED INTERFACE
  // ============================================================================

  return {
    // Original interface (backwards compatible)
    inspectorState,
    editingRefs,
    setInspectorState: updateInspectorState,
    setEditingRefs: updateEditingRefs,
    isEditing,
    getInputValidation,

    // V2U Enhanced interface
    ...v2uHook,

    // Combined helpers
    isV2UEnabled: v2uHook.isV2UNode,
    hasV2UData: Boolean(v2uHook.v2uState),
    combinedHealth: v2uHook.isV2UNode ? v2uHook.systemHealth : "legacy",

    // V2U specific state helpers
    v2uTabState: {
      activeTab: inspectorState.v2uTabIndex,
      setActiveTab: (index: number) =>
        updateInspectorState({ v2uTabIndex: index }),
    },

    v2uDebugState: {
      isExpanded: inspectorState.v2uDebugExpanded,
      toggle: () =>
        updateInspectorState({
          v2uDebugExpanded: !inspectorState.v2uDebugExpanded,
        }),
    },

    v2uMetricsState: {
      isExpanded: inspectorState.v2uMetricsExpanded,
      toggle: () =>
        updateInspectorState({
          v2uMetricsExpanded: !inspectorState.v2uMetricsExpanded,
        }),
    },

    // Enhanced debugging info
    debugInfo: {
      nodeId: node?.id,
      nodeType: node?.type,
      isV2UNode: v2uHook.isV2UNode,
      systemHealth: v2uHook.systemHealth,
      hasLifecycleHooks: v2uHook.hasLifecycleHooks,
      hasSecurityViolations: v2uHook.hasSecurityViolations,
      hasPerformanceIssues: v2uHook.hasPerformanceIssues,
      lastRefresh: v2uHook.lastRefresh,
      isLoading: v2uHook.isLoading,
      error: v2uHook.error,
    },
  };
}
