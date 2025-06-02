/**
 * MODERN NODE REGISTRY - Centralized registration for modern node domain
 *
 * • Central registry mapping node types to React components for ReactFlow
 * • Auto-syncs with available nodes from the modern node-domain structure
 * • Provides category mapping for node styling and organization
 * • Single source of truth for node type definitions and metadata
 * • Supports dynamic registration and type-safe component mapping
 *
 * Keywords: node-registry, ReactFlow, component-mapping, modern-domain, registration
 */

"use client";

import React from "react";

// ============================================================================
// IMPORT ACTUAL NODE COMPONENTS FROM DOMAIN
// ============================================================================

// Import actual nodes from the node-domain structure
import CreateText from "../../../node-domain/create/CreateText";
import TestError from "../../../node-domain/test/TestError";
import TriggerOnToggle from "../../../node-domain/trigger/TriggerOnToggle";
import ViewOutput from "../../../node-domain/view/ViewOutput";

// Import constants for validation
import { NODE_TYPE_CONFIG } from "../../flow-engine/constants";
import type { NodeType } from "../../flow-engine/types/nodeData";

// ============================================================================
// NODE REGISTRATION INTERFACE
// ============================================================================

export interface NodeRegistration {
  component: React.ComponentType<any>;
  category: NodeCategory;
  folder: SidebarFolder;
  displayName: string;
  description: string;
  hasToggle: boolean;
  iconWidth: number;
  iconHeight: number;
  expandedWidth: number;
  expandedHeight: number;
}

export type NodeCategory = "create" | "view" | "trigger" | "test" | "cycle";
export type SidebarFolder = "main" | "automation" | "testing" | "visualization";

// ============================================================================
// MODERN NODE REGISTRY MAPPING
// ============================================================================

/**
 * REGISTERABLE NODE MAPPING
 * Maps node types to their React components and metadata
 */
export const MODERN_NODE_REGISTRY: Record<NodeType, NodeRegistration> = {
  // CREATE DOMAIN
  createText: {
    component: CreateText,
    category: "create",
    folder: "main",
    displayName: "Create Text",
    description: "Creates and outputs text content",
    hasToggle: true,
    iconWidth: 120, // Text nodes are wider
    iconHeight: 60,
    expandedWidth: 200,
    expandedHeight: 120,
  },

  // VIEW DOMAIN
  viewOutput: {
    component: ViewOutput,
    category: "view",
    folder: "visualization",
    displayName: "View Output",
    description: "Displays output values from connected nodes",
    hasToggle: true,
    iconWidth: 60,
    iconHeight: 60,
    expandedWidth: 200,
    expandedHeight: 150,
  },

  // TRIGGER DOMAIN
  triggerOnToggle: {
    component: TriggerOnToggle,
    category: "trigger",
    folder: "automation",
    displayName: "Trigger On Toggle",
    description: "Toggles output state when triggered",
    hasToggle: true,
    iconWidth: 60,
    iconHeight: 60,
    expandedWidth: 120,
    expandedHeight: 120,
  },

  // TEST DOMAIN
  testError: {
    component: TestError,
    category: "test",
    folder: "testing",
    displayName: "Test Error",
    description: "Generates test errors for debugging workflows",
    hasToggle: true,
    iconWidth: 60,
    iconHeight: 60,
    expandedWidth: 150,
    expandedHeight: 140,
  },
};

// ============================================================================
// REGISTRY UTILITIES
// ============================================================================

/**
 * GET NODE TYPES FOR REACTFLOW
 * Returns the component mapping required by ReactFlow
 */
export function getNodeTypes(): Record<string, React.ComponentType<any>> {
  const nodeTypes: Record<string, React.ComponentType<any>> = {};

  Object.entries(MODERN_NODE_REGISTRY).forEach(([nodeType, registration]) => {
    nodeTypes[nodeType] = registration.component;
  });

  return nodeTypes;
}

/**
 * GET CATEGORY MAPPING
 * Returns mapping of node types to their categories
 */
export function getCategoryMapping(): Record<NodeType, NodeCategory> {
  const mapping = {} as Record<NodeType, NodeCategory>;

  Object.entries(MODERN_NODE_REGISTRY).forEach(([nodeType, registration]) => {
    mapping[nodeType as NodeType] = registration.category;
  });

  return mapping;
}

/**
 * GET SIDEBAR FOLDER MAPPING
 * Returns mapping of node types to their sidebar folders
 */
export function getSidebarFolderMapping(): Record<NodeType, SidebarFolder> {
  const mapping = {} as Record<NodeType, SidebarFolder>;

  Object.entries(MODERN_NODE_REGISTRY).forEach(([nodeType, registration]) => {
    mapping[nodeType as NodeType] = registration.folder;
  });

  return mapping;
}

/**
 * VALIDATE NODE TYPE
 * Checks if a node type is registered and valid
 */
export function isValidNodeType(nodeType: string): nodeType is NodeType {
  return nodeType in MODERN_NODE_REGISTRY && nodeType in NODE_TYPE_CONFIG;
}

/**
 * GET NODE METADATA
 * Returns complete metadata for a registered node type
 */
export function getNodeMetadata(nodeType: NodeType): NodeRegistration | null {
  return MODERN_NODE_REGISTRY[nodeType] || null;
}

/**
 * GET NODES BY CATEGORY
 * Returns all node types in a specific category
 */
export function getNodesByCategory(category: NodeCategory): NodeType[] {
  return Object.entries(MODERN_NODE_REGISTRY)
    .filter(([_, registration]) => registration.category === category)
    .map(([nodeType]) => nodeType as NodeType);
}

/**
 * GET NODES BY FOLDER
 * Returns all node types in a specific sidebar folder
 */
export function getNodesByFolder(folder: SidebarFolder): NodeType[] {
  return Object.entries(MODERN_NODE_REGISTRY)
    .filter(([_, registration]) => registration.folder === folder)
    .map(([nodeType]) => nodeType as NodeType);
}

// ============================================================================
// REGISTRATION UTILITIES
// ============================================================================

/**
 * REGISTER ALL NODES FOR REACTFLOW
 * Returns complete node type mapping for ReactFlow registration
 * This is the main function to use when setting up ReactFlow
 */
export function registerAllNodes(): Record<string, React.ComponentType<any>> {
  console.log("🔄 Registering all modern nodes...");

  const nodeTypes = getNodeTypes();
  const registeredCount = Object.keys(nodeTypes).length;

  console.log(
    `✅ Successfully registered ${registeredCount} node types:`,
    Object.keys(nodeTypes)
  );

  // Validate that all registered nodes have proper configurations
  Object.keys(nodeTypes).forEach((nodeType) => {
    if (!isValidNodeType(nodeType)) {
      console.warn(
        `⚠️ Node type '${nodeType}' is registered but missing configuration`
      );
    }
  });

  return nodeTypes;
}

/**
 * VALIDATE REGISTRY COMPLETENESS
 * Ensures all nodes in registry have proper configurations
 */
export function validateRegistry(): boolean {
  console.log("🔍 Validating node registry...");

  let isValid = true;
  const issues: string[] = [];

  Object.entries(MODERN_NODE_REGISTRY).forEach(([nodeType, registration]) => {
    // Check if node type exists in constants
    if (!isValidNodeType(nodeType)) {
      issues.push(`Node type '${nodeType}' missing from constants`);
      isValid = false;
    }

    // Check required registration properties
    if (!registration.component) {
      issues.push(`Node type '${nodeType}' missing component`);
      isValid = false;
    }

    if (!registration.displayName) {
      issues.push(`Node type '${nodeType}' missing displayName`);
      isValid = false;
    }
  });

  if (isValid) {
    console.log("✅ Registry validation passed");
  } else {
    console.error("❌ Registry validation failed:", issues);
  }

  return isValid;
}

/**
 * GET REGISTRY STATS
 * Returns statistics about the current registry
 */
export function getRegistryStats() {
  const stats = {
    totalNodes: Object.keys(MODERN_NODE_REGISTRY).length,
    byCategory: {} as Record<NodeCategory, number>,
    byFolder: {} as Record<SidebarFolder, number>,
    withToggle: 0,
  };

  Object.values(MODERN_NODE_REGISTRY).forEach((registration) => {
    // Count by category
    stats.byCategory[registration.category] =
      (stats.byCategory[registration.category] || 0) + 1;

    // Count by folder
    stats.byFolder[registration.folder] =
      (stats.byFolder[registration.folder] || 0) + 1;

    // Count nodes with toggle
    if (registration.hasToggle) {
      stats.withToggle++;
    }
  });

  return stats;
}
