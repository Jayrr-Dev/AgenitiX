/**
 * ENHANCED NODE REGISTRY - Centralized node registration system
 *
 * • Central registry mapping node types to React components for ReactFlow
 * • Auto-generates node metadata, configs, and inspector mappings
 * • Provides category mapping for node styling and organization
 * • Imports all modern node components from different domains
 * • Single source of truth for all node type definitions
 *
 * Keywords: node-registry, ReactFlow, component-mapping, metadata, auto-generation
 */

"use client";

/* -------------------------------------------------------------------------- */
/*  ENHANCED CENTRALIZED NODE REGISTRY - Complete Auto-Generation            */
/*  – All node metadata in one place: types, configs, controls, imports      */
/*  – Auto-generates types, constants, and inspector mappings               */
/*  – True single-file registration - ZERO external updates needed          */
/* -------------------------------------------------------------------------- */

import React from "react";

// ============================================================================
// NODE COMPONENT IMPORTS - Using clean domain aliases
// ============================================================================

// CONTENT CREATION DOMAIN - Modern nodes only
import { CreateTextEnhanced } from "@content/nodes/CreateTextEnhanced";
import CreateTextRefactor from "@content/nodes/CreateTextRefactor";

// AUTOMATION TRIGGERS DOMAIN - Modern nodes only
import { CyclePulseEnhanced } from "@automation/nodes/CyclePulseEnhanced";
import TriggerOnToggleRefactor from "@automation/nodes/TriggerOnToggleRefactor";
import { TriggerToggleEnhanced } from "@automation/nodes/TriggerToggleEnhanced";

// DATA VISUALIZATION DOMAIN - Modern nodes only
import { ViewOutputEnhanced } from "@visualization/nodes/ViewOutputEnhanced";
import ViewOutputRefactor from "@visualization/nodes/ViewOutputRefactor";

// TESTING & DEBUGGING DOMAIN - Modern nodes only
import { ENHANCED_NODE_REGISTRY } from "@/features/business-logic-legacy/infrastructure/nodes/nodeRegistry";
import TestErrorRefactored from "@testing/nodes/TestErrorRefactored";

// ============================================================================
// NODE TYPES MAPPING FOR REACTFLOW
// ============================================================================
export type NodeCategory =
  | "create"
  | "logic"
  | "trigger"
  | "test"
  | "turn"
  | "count"
  | "delay"
  | "edit"
  | "cycle"
  | "view";
export type SidebarFolder =
  | "main"
  | "media"
  | "automation"
  | "test"
  | "integrations"
  | "misc"
  | "testing";
export type InspectorControlType =
  | "text"
  | "textarea"
  | "number"
  | "boolean"
  | "select"
  | "range"
  | "none";
/**
 * MODERN SYSTEM NODE TYPES
 * Provides the mapping of node type strings to React components for ReactFlow
 */
export const getNodeTypes = (): Record<string, React.ComponentType<any>> => {
  return {
    // CONTENT CREATION DOMAIN
    createTextEnhanced: CreateTextEnhanced,
    createTextRefactor: CreateTextRefactor,

    // AUTOMATION TRIGGERS DOMAIN
    cyclePulseEnhanced: CyclePulseEnhanced,
    triggerToggleEnhanced: TriggerToggleEnhanced,
    triggerOnToggleRefactor: TriggerOnToggleRefactor,

    // DATA VISUALIZATION DOMAIN
    viewOutputEnhanced: ViewOutputEnhanced,
    viewOutputRefactor: ViewOutputRefactor,

    // TESTING & DEBUGGING DOMAIN
    testErrorRefactored: TestErrorRefactored,
  };
};

/** Get category mapping for styling */
export const getCategoryMapping = (): Record<string, NodeCategory> => {
  const mapping: Record<string, NodeCategory> = {};

  Object.values(ENHANCED_NODE_REGISTRY).forEach((node) => {
    mapping[node.nodeType] = node.category;
  });

  return mapping;
};
