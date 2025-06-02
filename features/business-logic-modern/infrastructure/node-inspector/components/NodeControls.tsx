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
import {
  getNodeInspectorControls,
  hasFactoryInspectorControls,
} from "@factory/NodeFactory";
import type React from "react";
import { TextNodeControl } from "../controls/TextNodeControl";
import {
  CyclePulseControl,
  CycleToggleControl,
  TriggerOnClickControl,
  TriggerOnPulseControl,
  TriggerOnToggleControl,
} from "../controls/TriggerControls";
import type { ErrorType } from "../types";

// ============================================================================
// REGISTRY INTEGRATION - Import registry for type-safe control resolution
// ============================================================================

import {
  generateInspectorControlMapping,
  getNodeMetadata,
  isValidNodeType,
  safeNodeTypeCast,
} from "../../node-creation/node-registry/nodeRegistry";

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
}

export const NodeControls: React.FC<NodeControlsProps> = ({
  node,
  updateNodeData,
  onLogError,
  inspectorState,
}) => {
  // ============================================================================
  // REGISTRY-BASED CONTROL RESOLUTION
  // ============================================================================

  const getControlFromRegistry = (nodeType: string) => {
    try {
      // VALIDATE NODE TYPE FIRST
      const validNodeType = safeNodeTypeCast(nodeType);
      if (!validNodeType) {
        console.warn(
          `[NodeControls] ⚠️ Invalid node type: ${nodeType}. Available types:`,
          ["createText", "viewOutput", "triggerOnToggle", "testError"]
        );
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

      console.log(
        `[NodeControls] ✅ Resolving registry control for valid node type: ${validNodeType}`
      );

      // GET REGISTRY MAPPING
      const registryMapping = generateInspectorControlMapping();
      const controlConfig = registryMapping[validNodeType];

      if (!controlConfig) {
        console.log(
          `[NodeControls] 📝 No inspector control config found for ${validNodeType}, checking metadata...`
        );

        const metadata = getNodeMetadata(validNodeType);
        if (metadata?.hasControls) {
          console.log(
            "[NodeControls] 🔧 Node has controls but no config, using default TextNodeControl"
          );
          return (
            <TextNodeControl node={node} updateNodeData={updateNodeData} />
          );
        }

        console.log(
          `[NodeControls] 🚫 Node ${validNodeType} has no controls configured`
        );
        return (
          <div className="text-xs text-gray-500">
            No controls available for this node type
          </div>
        );
      }

      // HANDLE DIFFERENT CONTROL TYPES
      const baseProps = { node, updateNodeData };

      switch (controlConfig.type) {
        case "legacy":
          if (controlConfig.legacyControlType) {
            console.log(
              `[NodeControls] 🔄 Using legacy control: ${controlConfig.legacyControlType} for ${validNodeType}`
            );

            switch (controlConfig.legacyControlType) {
              case "TextNodeControl":
                return <TextNodeControl {...baseProps} />;
              case "TriggerOnClickControl":
                return <TriggerOnClickControl {...baseProps} />;
              case "TriggerOnToggleControl":
                return <TriggerOnToggleControl {...baseProps} />;
              case "TriggerOnPulseControl":
                return (
                  <TriggerOnPulseControl
                    {...baseProps}
                    durationInput={inspectorState.durationInput}
                    setDurationInput={inspectorState.setDurationInput}
                  />
                );
              case "CyclePulseControl":
                return <CyclePulseControl {...baseProps} />;
              case "CycleToggleControl":
                return <CycleToggleControl {...baseProps} />;
              default:
                console.warn(
                  `[NodeControls] ❌ Unknown legacy control type: ${controlConfig.legacyControlType}`
                );
                return (
                  <div className="text-xs text-orange-500">
                    Unknown control type: {controlConfig.legacyControlType}
                  </div>
                );
            }
          }
          break;

        case "factory":
          console.log(
            `[NodeControls] 🏭 Using factory control for ${validNodeType}`
          );
          return null; // Let factory handle it

        case "none":
          console.log(
            `[NodeControls] 🚫 Node ${validNodeType} explicitly has no controls`
          );
          return (
            <div className="text-xs text-gray-500">
              This node type does not require controls
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
      console.error(
        `[NodeControls] ❌ Registry control resolution failed for ${nodeType}:`,
        error
      );
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
    console.log(
      `[NodeControls] 🔍 Rendering controls for node type: ${node.type}`
    );

    // PRIORITY 1: Registry-Based Control Resolution (Type-Safe)
    const registryControl = getControlFromRegistry(node.type);
    if (registryControl) {
      console.log(`[NodeControls] ✅ Using REGISTRY control for ${node.type}`);
      return registryControl;
    }

    // PRIORITY 2: Factory Controls (for nodes created via NodeFactory)
    if (hasFactoryInspectorControls(node.type)) {
      console.log(`[NodeControls] 🏭 Using FACTORY control for ${node.type}`);
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
    console.log(
      `[NodeControls] ⚠️ No registry or factory control found for ${node.type}`
    );

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
