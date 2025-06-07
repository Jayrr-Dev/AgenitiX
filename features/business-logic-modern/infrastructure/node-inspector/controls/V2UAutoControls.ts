/**
 * V2U AUTO CONTROLS - Zero-registration control resolution
 *
 * 🎯 ZERO REGISTRATION: Automatically detects and resolves controls without manual registries
 * • Leverages defineNode() self-contained architecture
 * • Simple pattern matching for fallback cases
 * • No manual registry maintenance required
 * • Just works™ with existing V2U nodes
 *
 * Keywords: zero-registration, auto-detection, defineNode, pattern-matching, just-works
 */

import type { AgenNode } from "@/features/business-logic-modern/infrastructure/flow-engine/types/nodeData";
import React from "react";
import { BaseControlProps } from "../types";

// Import controls (these are the actual components, not registry entries)
import { V2UTextControl } from "./V2UTextControl";
import {
  V2UTriggerOnClickControl,
  V2UTriggerOnPulseControl,
  V2UTriggerOnToggleControl,
} from "./V2UTriggerControls";

// Legacy fallbacks
import { TextNodeControl } from "./TextNodeControl";
import {
  TriggerOnClickControl,
  TriggerOnPulseControl,
  TriggerOnToggleControl,
} from "./TriggerControls";

// ============================================================================
// ZERO-REGISTRATION DETECTION
// ============================================================================

/**
 * Detects if a node is V2U (created with defineNode())
 */
export function isV2UNode(node: AgenNode): boolean {
  const nodeData = node.data as any;
  return !!(
    nodeData._v2uMigrated === true ||
    nodeData._v2uVersion !== undefined ||
    nodeData._defineNodeConfig !== undefined ||
    nodeData._v2uMigrationDate !== undefined
  );
}

/**
 * ZERO REGISTRATION: Gets control directly from defineNode() config
 */
function getControlFromDefineNode(
  node: AgenNode
): React.FC<BaseControlProps> | null {
  const nodeData = node.data as any;

  // Check if this node has defineNode() configuration
  if (nodeData._defineNodeConfig?.inspector?.controlComponent) {
    return nodeData._defineNodeConfig.inspector.controlComponent;
  }

  return null;
}

/**
 * PATTERN MATCHING: Zero-config control detection based on node type
 */
function getControlByPattern(
  nodeType: string,
  isV2U: boolean
): React.FC<BaseControlProps> | null {
  const type = nodeType.toLowerCase();

  // Text-based nodes
  if (type.includes("text") || type.includes("createtext")) {
    return isV2U ? V2UTextControl : TextNodeControl;
  }

  // Trigger-based nodes - create wrappers for V2U controls that have additional props
  if (type.includes("trigger")) {
    if (type.includes("click")) {
      if (isV2U) {
        return (props: BaseControlProps) =>
          React.createElement(V2UTriggerOnClickControl, {
            ...props,
            triggerType: "click" as const,
          });
      }
      return TriggerOnClickControl;
    }
    if (type.includes("toggle")) {
      if (isV2U) {
        return (props: BaseControlProps) =>
          React.createElement(V2UTriggerOnToggleControl, {
            ...props,
            triggerType: "toggle" as const,
          });
      }
      return TriggerOnToggleControl;
    }
    if (type.includes("pulse")) {
      if (isV2U) {
        return (props: BaseControlProps) =>
          React.createElement(V2UTriggerOnPulseControl, {
            ...props,
            triggerType: "pulse" as const,
          });
      }
      return (props: BaseControlProps) =>
        React.createElement(TriggerOnPulseControl, {
          ...props,
          durationInput: "", // Default value
          setDurationInput: () => {}, // No-op for read-only controls
        });
    }
    // Default trigger
    if (isV2U) {
      return (props: BaseControlProps) =>
        React.createElement(V2UTriggerOnClickControl, {
          ...props,
          triggerType: "click" as const,
        });
    }
    return TriggerOnClickControl;
  }

  return null;
}

// ============================================================================
// MAIN AUTO-RESOLUTION FUNCTION
// ============================================================================

/**
 * ZERO REGISTRATION: Automatically resolves the right control for any node
 * No manual registry updates required!
 */
export function autoResolveControl(node: AgenNode): {
  ControlComponent: React.FC<BaseControlProps> | null;
  isV2U: boolean;
  method: "defineNode" | "pattern" | "none";
} {
  const isV2U = isV2UNode(node);

  // PRIORITY 1: Check defineNode() config (self-contained)
  const defineNodeControl = getControlFromDefineNode(node);
  if (defineNodeControl) {
    return {
      ControlComponent: defineNodeControl,
      isV2U: true,
      method: "defineNode",
    };
  }

  // PRIORITY 2: Pattern matching (zero config)
  const patternControl = getControlByPattern(node.type, isV2U);
  if (patternControl) {
    return {
      ControlComponent: patternControl,
      isV2U,
      method: "pattern",
    };
  }

  // No control found
  return {
    ControlComponent: null,
    isV2U,
    method: "none",
  };
}

export default {
  autoResolveControl,
  isV2UNode,
};
