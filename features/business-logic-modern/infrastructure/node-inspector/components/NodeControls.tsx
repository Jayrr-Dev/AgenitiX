/**
 * NODE CONTROLS COMPONENT - Dynamic control panels for node property editing
 *
 * • Renders type-specific control interfaces for different node types
 * • Provides real-time input validation and error feedback
 * • Supports trigger controls, text editing, and parameter adjustment
 * • Integrates with enhanced node registry for control configuration
 * • Updates node data with debounced input handling for performance
 *
 * Keywords: node-controls, dynamic-ui, validation, triggers, parameters, registry
 */

"use client";

import type { AgenNode } from "@/features/business-logic-modern/infrastructure/flow-engine/types/nodeData";
import type React from "react";
import {
  getNodeInspectorControls,
  hasFactoryInspectorControls,
} from "../../node-creation/core/registries/json-node-registry/unifiedRegistry";
import { TextNodeControl } from "../controls/TextNodeControl";
import {
  CyclePulseControl,
  CycleToggleControl,
  TriggerOnClickControl,
  TriggerOnPulseControl,
  TriggerOnToggleControl,
} from "../controls/TriggerControls";
import type { ErrorType } from "../types";

// V2U Enhanced Controls Import
import { autoResolveControl } from "../controls/V2UAutoControls";

// ============================================================================
// REGISTRY INTEGRATION - Import registry for type-safe control resolution
// ============================================================================

import {
  generateInspectorControlMapping,
  isValidNodeType,
  safeNodeTypeCast,
} from "../../node-creation/core/registries/json-node-registry/unifiedRegistry";

interface NodeControlsProps {
  node: AgenNode;
  updateNodeData: (id: string, patch: Record<string, unknown>) => void;
  onLogError: (
    nodeId: string,
    message: string,
    type?: ErrorType,
    source?: string
  ) => void;
  inspectorState: {
    durationInput: string;
    setDurationInput: (value: string) => void;
    countInput: string;
    setCountInput: (value: string) => void;
    multiplierInput: string;
    setMultiplierInput: (value: string) => void;
    delayInput: string;
    setDelayInput: (value: string) => void;
  };
  // V2U Enhanced props
  v2uState?: any; // V2UNodeState from types
  debugMode?: boolean;
}

export const NodeControls: React.FC<NodeControlsProps> = ({
  node,
  updateNodeData,
  onLogError,
  inspectorState,
  v2uState,
  debugMode = false,
}) => {
  // ============================================================================
  // ZERO-REGISTRATION CONTROL RESOLUTION - V2U FIRST
  // ============================================================================

  // Auto-resolve control without manual registries!
  const autoResolution = autoResolveControl(node);

  if (autoResolution.ControlComponent) {
    const ControlComponent = autoResolution.ControlComponent;
    // Debug logging removed for cleaner console

    return (
      <div>
        {debugMode && (
          <div className="text-xs text-blue-600 dark:text-blue-400 mb-2 p-1 bg-blue-50 dark:bg-blue-900/20 rounded border">
            🎯 ZERO-REG: {autoResolution.method} →{" "}
            {autoResolution.isV2U ? "V2U" : "Legacy"} control for {node.type}
          </div>
        )}
        <ControlComponent node={node} updateNodeData={updateNodeData} />
      </div>
    );
  }

  // ============================================================================
  // LEGACY REGISTRY-BASED CONTROL RESOLUTION - FALLBACK
  // ============================================================================

  const getControlFromRegistry = (nodeType: string) => {
    try {
      // VALIDATE NODE TYPE FIRST
      const validNodeType = safeNodeTypeCast(nodeType);
      if (!validNodeType) {
        // Silent invalid node type handling
        return (
          <div className="text-xs text-red-500 p-2 bg-red-50 dark:bg-red-900/20 rounded border">
            <div className="font-semibold">Invalid Node Type</div>
            <div>Type '{nodeType}' not found in modern registry</div>
            <div className="mt-1 text-xs">
              Valid types: createText, viewOutput, triggerOnToggle, testError
            </div>
          </div>
        );
      }

      // Debug logging removed for cleaner console

      // GET REGISTRY MAPPING
      const registryMapping = generateInspectorControlMapping();
      const controlConfig = registryMapping[validNodeType];

      if (!controlConfig) {
        // Debug logging removed for cleaner console

        // FALLBACK STRATEGY: Use appropriate control based on node type
        switch (validNodeType) {
          case "createText":
            return (
              <div>
                <div className="text-xs text-amber-600 dark:text-amber-400 mb-2 p-1 bg-amber-50 dark:bg-amber-900/20 rounded border">
                  ⚠️ FALLBACK: V2 registry control failed for {validNodeType}
                </div>
                <TextNodeControl node={node} updateNodeData={updateNodeData} />
              </div>
            );
          case "createTextV2":
            return (
              <div>
                <div className="text-xs text-amber-600 dark:text-amber-400 mb-2 p-1 bg-amber-50 dark:bg-amber-900/20 rounded border">
                  ⚠️ FALLBACK: V2 registry control failed for {validNodeType}
                </div>
                <TextNodeControl node={node} updateNodeData={updateNodeData} />
              </div>
            );
          case "viewOutput":
            return (
              <div>
                <div className="text-xs text-amber-600 dark:text-amber-400 mb-2 p-1 bg-amber-50 dark:bg-amber-900/20 rounded border">
                  ⚠️ FALLBACK: Registry control failed for {validNodeType}
                </div>
                <div className="text-xs text-gray-500 p-2">
                  View Output nodes display data and do not require controls
                </div>
              </div>
            );
          case "triggerOnToggle":
            return (
              <div>
                <div className="text-xs text-amber-600 dark:text-amber-400 mb-2 p-1 bg-amber-50 dark:bg-amber-900/20 rounded border">
                  ⚠️ FALLBACK: Registry control failed for {validNodeType}
                </div>
                <TriggerOnToggleControl
                  node={node}
                  updateNodeData={updateNodeData}
                />
              </div>
            );
          case "testError":
            return (
              <div>
                <div className="text-xs text-amber-600 dark:text-amber-400 mb-2 p-1 bg-amber-50 dark:bg-amber-900/20 rounded border">
                  ⚠️ FALLBACK: Registry control failed for {validNodeType}
                </div>
                <TextNodeControl node={node} updateNodeData={updateNodeData} />
              </div>
            );
          default:
            // Debug logging removed for cleaner console
            return (
              <div className="text-xs text-gray-500 p-2">
                No controls available for this node type
              </div>
            );
        }
      }

      // HANDLE DIFFERENT CONTROL TYPES
      const baseProps = { node, updateNodeData };

      switch (controlConfig.type) {
        case "v2":
          if (controlConfig.v2ControlType || controlConfig.legacyControlType) {
            const controlType =
              controlConfig.v2ControlType || controlConfig.legacyControlType;
            // Debug logging removed for cleaner console

            switch (controlType) {
              case "TextNodeControl":
                return (
                  <div>
                    <div className="text-xs text-green-600 dark:text-green-400 mb-2 p-1 bg-green-50 dark:bg-green-900/20 rounded border">
                      ✅ REGISTRY: Using V2 registry control for {validNodeType}
                    </div>
                    <TextNodeControl {...baseProps} />
                  </div>
                );
              case "TriggerOnClickControl":
                return (
                  <div>
                    <div className="text-xs text-green-600 dark:text-green-400 mb-2 p-1 bg-green-50 dark:bg-green-900/20 rounded border">
                      ✅ REGISTRY: Using V2 registry control for {validNodeType}
                    </div>
                    <TriggerOnClickControl {...baseProps} />
                  </div>
                );
              case "TriggerOnToggleControl":
                return (
                  <div>
                    <div className="text-xs text-green-600 dark:text-green-400 mb-2 p-1 bg-green-50 dark:bg-green-900/20 rounded border">
                      ✅ REGISTRY: Using V2 registry control for {validNodeType}
                    </div>
                    <TriggerOnToggleControl {...baseProps} />
                  </div>
                );
              case "TriggerOnPulseControl":
                return (
                  <div>
                    <div className="text-xs text-green-600 dark:text-green-400 mb-2 p-1 bg-green-50 dark:bg-green-900/20 rounded border">
                      ✅ REGISTRY: Using V2 registry control for {validNodeType}
                    </div>
                    <TriggerOnPulseControl
                      {...baseProps}
                      durationInput={inspectorState.durationInput}
                      setDurationInput={inspectorState.setDurationInput}
                    />
                  </div>
                );
              case "CyclePulseControl":
                return (
                  <div>
                    <div className="text-xs text-green-600 dark:text-green-400 mb-2 p-1 bg-green-50 dark:bg-green-900/20 rounded border">
                      ✅ REGISTRY: Using V2 registry control for {validNodeType}
                    </div>
                    <CyclePulseControl {...baseProps} />
                  </div>
                );
              case "CycleToggleControl":
                return (
                  <div>
                    <div className="text-xs text-green-600 dark:text-green-400 mb-2 p-1 bg-green-50 dark:bg-green-900/20 rounded border">
                      ✅ REGISTRY: Using V2 registry control for {validNodeType}
                    </div>
                    <CycleToggleControl {...baseProps} />
                  </div>
                );
              default:
                // Silent unknown control type handling
                return (
                  <div className="text-xs text-orange-500">
                    Unknown control type: {controlType}
                  </div>
                );
            }
          }
          break;

        case "legacy":
          // Backward compatibility for any remaining legacy controls
          if (controlConfig.legacyControlType) {
            console.log(
              `[NodeControls] 🔄 Using legacy control: ${controlConfig.legacyControlType} for ${validNodeType}`
            );
            // Handle same as V2 for now - all controls are now part of V2 system
            const controlType = controlConfig.legacyControlType;
            switch (controlType) {
              case "TextNodeControl":
                return (
                  <div>
                    <div className="text-xs text-blue-600 dark:text-blue-400 mb-2 p-1 bg-blue-50 dark:bg-blue-900/20 rounded border">
                      🔄 LEGACY: Using legacy control for {validNodeType}
                    </div>
                    <TextNodeControl {...baseProps} />
                  </div>
                );
              default:
                return (
                  <div className="text-xs text-orange-500">
                    Unknown legacy control type: {controlType}
                  </div>
                );
            }
          }
          break;

        case "factory":
          console.log(
            `[NodeControls] 🏭 Using factory control for ${validNodeType}`
          );
          return (
            <div>
              <div className="text-xs text-blue-600 dark:text-blue-400 mb-2 p-1 bg-blue-50 dark:bg-blue-900/20 rounded border">
                🏭 FACTORY: Using factory control for {validNodeType}
              </div>
              {/* Factory controls are handled elsewhere */}
            </div>
          );

        case "none":
          console.log(
            `[NodeControls] 🚫 Node ${validNodeType} explicitly has no controls`
          );
          return (
            <div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 p-1 bg-gray-50 dark:bg-gray-900/20 rounded border">
                🚫 REGISTRY: No controls configured for {validNodeType}
              </div>
              <div className="text-xs text-gray-500">
                This node type does not require controls
              </div>
            </div>
          );

        default:
          console.warn(
            `[NodeControls] ❓ Unknown control type: ${controlConfig.type}`
          );
          return (
            <div className="text-xs text-orange-500">
              Unknown control configuration type
            </div>
          );
      }
    } catch (error) {
      // Silent error handling for cleaner console
      return (
        <div className="text-xs text-red-500 p-2 bg-red-50 dark:bg-red-900/20 rounded border">
          <div className="font-semibold">Control Resolution Error</div>
          <div>Failed to load controls for node type: {nodeType}</div>
        </div>
      );
    }

    return null;
  };

  // ============================================================================
  // MAIN CONTROL RENDERING LOGIC
  // ============================================================================

  const renderControlsForNodeType = () => {
    // Debug logging removed for cleaner console

    // PRIORITY 1: Registry-Based Control Resolution (Type-Safe)
    const registryControl = getControlFromRegistry(node.type);
    if (registryControl) {
      // Debug logging removed for cleaner console
      return registryControl;
    }

    // PRIORITY 2: Factory Controls (for nodes created via NodeFactory)
    if (hasFactoryInspectorControls(node.type)) {
      // Debug logging removed for cleaner console
      const FactoryControlsComponent = getNodeInspectorControls(node.type);
      if (FactoryControlsComponent) {
        return (
          <FactoryControlsComponent
            node={node}
            updateNodeData={updateNodeData}
            onLogError={onLogError}
            inspectorState={inspectorState}
          />
        );
      }
    }

    // PRIORITY 3: Fallback for unknown/legacy nodes
    // Debug logging removed for cleaner console

    // Check if it's a valid modern node type
    const isValidModern = isValidNodeType(node.type);
    if (!isValidModern) {
      return (
        <div className="text-xs text-amber-600 dark:text-amber-400 p-2 bg-amber-50 dark:bg-amber-900/20 rounded border">
          <div className="font-semibold">Legacy Node Type</div>
          <div>Node type '{node.type}' is not part of the modern system</div>
          <div className="mt-1 text-xs">
            Consider migrating to: createText, viewOutput, triggerOnToggle, or
            testError
          </div>
        </div>
      );
    }

    // Default fallback for valid but unconfigured nodes
    return (
      <div className="text-xs text-gray-500 italic">
        No controls configured for this node type: {node.type}
      </div>
    );
  };

  return (
    <div>
      <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
        Controls:
      </h4>
      <div className="space-y-2 overflow-y-auto flex-1">
        {renderControlsForNodeType()}
      </div>
    </div>
  );
};
