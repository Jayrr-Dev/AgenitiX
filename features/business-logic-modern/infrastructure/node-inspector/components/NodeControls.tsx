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

import type { AgenNode } from "@/features/business-logic-modern/infrastructure/flow-engine/types";
import React from "react";
import {
  getNodeInspectorControls,
  hasFactoryInspectorControls,
} from "../../../node-domain/factory/NodeFactory";
import { TextNodeControl } from "../controls/TextNodeControl";
import {
  CyclePulseControl,
  CycleToggleControl,
  TriggerOnClickControl,
  TriggerOnPulseControl,
  TriggerOnToggleControl,
} from "../controls/TriggerControls";
import { ErrorType } from "../types";

// ENHANCED REGISTRY INTEGRATION - Direct import instead of require()
import { generateInspectorControlMapping } from "../../../node-domain/nodeRegistry";

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
  // ENHANCED REGISTRY CONTROL RESOLUTION
  const getControlFromRegistry = (nodeType: string) => {
    try {
      // DEBUG: Log attempt to resolve registry control
      console.log(
        `[NodeControls] Attempting to resolve registry control for ${nodeType}`
      );

      // Direct function call instead of require()
      console.log(
        `[NodeControls] generateInspectorControlMapping type:`,
        typeof generateInspectorControlMapping
      );

      if (typeof generateInspectorControlMapping !== "function") {
        console.warn(
          `[NodeControls] generateInspectorControlMapping is not a function:`,
          generateInspectorControlMapping
        );
        return null;
      }

      const registryMapping = generateInspectorControlMapping();

      // DEBUG: Log the full mapping
      console.log(
        `[NodeControls] Registry mapping keys:`,
        Object.keys(registryMapping)
      );
      console.log(
        `[NodeControls] Registry mapping for ${nodeType}:`,
        registryMapping[nodeType]
      );

      const controlConfig = registryMapping[nodeType];

      if (controlConfig?.type === "legacy" && controlConfig.legacyControlType) {
        console.log(
          `[NodeControls] ✅ Found legacy control for ${nodeType}:`,
          controlConfig.legacyControlType
        );

        const baseProps = { node, updateNodeData };

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
            return null;
        }
      } else if (controlConfig?.type === "factory") {
        console.log(
          `[NodeControls] 🏭 Found factory control for ${nodeType}, deferring to NodeFactory`
        );
        return null; // Let NodeFactory handle it
      } else if (controlConfig?.type === "none") {
        console.log(
          `[NodeControls] 🚫 Node ${nodeType} explicitly has no controls`
        );
        return null;
      } else {
        console.log(
          `[NodeControls] ❓ No registry control config found for ${nodeType}. Config:`,
          controlConfig
        );
        return null;
      }
    } catch (error) {
      console.error(
        `[NodeControls] ❌ Registry control resolution failed for ${nodeType}:`,
        error
      );
      console.error(
        `[NodeControls] Error stack:`,
        error instanceof Error ? error.stack : "No stack trace available"
      );
      return null;
    }
  };

  const renderControlsForNodeType = () => {
    console.log(
      `[NodeControls] 🔍 Rendering controls for node type: ${node.type}`
    );

    // PRIORITY 1: Enhanced Registry Auto-Resolution
    const registryControl = getControlFromRegistry(node.type);
    if (registryControl) {
      console.log(`[NodeControls] ✅ Using REGISTRY control for ${node.type}`);
      return registryControl;
    }

    // PRIORITY 2: NodeFactory-created nodes
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

    // PRIORITY 3: Legacy manual switch statement (deprecated)
    console.log(`[NodeControls] 🔄 Using LEGACY switch for ${node.type}`);
    const baseProps = { node, updateNodeData };

    switch (node.type) {
      case "createText":
      case "createTextRefactor":
        return <TextNodeControl {...baseProps} />;

      case "triggerOnClick":
        return <TriggerOnClickControl {...baseProps} />;

      case "triggerOnToggle":
        return <TriggerOnToggleControl {...baseProps} />;

      case "triggerOnToggleRefactor":
        return <TriggerOnToggleControl {...baseProps} />;

      case "triggerOnPulse":
        return (
          <TriggerOnPulseControl
            {...baseProps}
            durationInput={inspectorState.durationInput}
            setDurationInput={inspectorState.setDurationInput}
          />
        );

      case "cyclePulse":
        return <CyclePulseControl {...baseProps} />;

      case "cycleToggle":
        return <CycleToggleControl {...baseProps} />;

      // Text processing nodes
      case "turnToText":
        return <TextNodeControl {...baseProps} />;

      // Boolean conversion nodes
      case "turnToBoolean":
        return <TextNodeControl {...baseProps} />;

      // Input/testing nodes
      case "testInput":
        return <TextNodeControl {...baseProps} />;

      // Object/array editors
      case "editObject":
      case "editArray":
        return <TextNodeControl {...baseProps} />;

      // Counter and delay nodes
      case "countInput":
      case "delayInput":
        return <TextNodeControl {...baseProps} />;

      // Processing nodes (no controls needed)
      case "turnToUppercase":
        return (
          <div className="text-xs text-gray-500">
            Processing node - connect text inputs to use
          </div>
        );

      // Logic nodes (use base controls for now)
      case "logicAnd":
      case "logicOr":
      case "logicNot":
      case "logicXor":
      case "logicXnor":
        return (
          <div className="text-xs text-gray-500">
            Logic node - no additional controls needed
          </div>
        );

      // View nodes
      case "viewOutput":
      case "viewOutputRefactor":
        return (
          <div className="text-xs text-gray-500">
            View node - no additional controls needed
          </div>
        );

      // Test nodes
      case "testError":
      case "testJson":
        return <TextNodeControl {...baseProps} />;

      default:
        return (
          <div className="text-xs text-gray-500 italic">
            No controls available for this node type: {node.type}
          </div>
        );
    }
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
