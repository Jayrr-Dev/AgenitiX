/**
 * FACTORY TYPES INDEX - Comprehensive type definitions for node factory
 *
 * • Defines all TypeScript interfaces and types for factory system
 * • Provides type safety for node creation and configuration
 * • Includes base types, configuration interfaces, and utility types
 * • Supports extensible type system for custom node implementations
 * • Centralizes all factory-related type definitions for consistency
 * • Integrated with registry system for unified node creation
 *
 * Keywords: factory-types, typescript, interfaces, type-safety, configuration, extensible
 */

// ============================================================================
// FACTORY NODE TYPE DEFINITIONS
// ============================================================================

import { Position, type Connection, type Node } from "@xyflow/react";
import { ReactNode } from "react";

// ============================================================================
// BASE INTERFACES
// ============================================================================

/**
 * BASE NODE DATA INTERFACE
 * All factory nodes must extend this base interface
 */
export interface BaseNodeData {
  /** Error message if node encounters issues */
  error?: string;
  /** Whether node should propagate data downstream */
  isActive?: boolean;
  /** Allow additional properties for flexibility */
  [key: string]: any;
}

/**
 * HANDLE CONFIGURATION
 * Defines input/output handles for nodes
 */
export interface HandleConfig {
  /** Unique identifier for the handle */
  id: string;
  /** Data type: string, number, boolean, json, array, etc. */
  dataType: "s" | "n" | "b" | "j" | "a" | "N" | "f" | "x" | "u" | "S" | "∅";
  /** Position on the node */
  position: Position;
  /** Handle type: input or output */
  type: "source" | "target";
}

/**
 * NODE SIZE CONFIGURATION
 * Defines responsive sizing for collapsed and expanded states
 */
export interface NodeSize {
  collapsed: {
    width: string;
    height: string;
  };
  expanded: {
    width: string;
  };
}

// ============================================================================
// CATEGORY AND FOLDER TYPES - Registry Integration
// ============================================================================

export type NodeCategory = "create" | "view" | "trigger" | "test" | "cycle";
export type SidebarFolder = "main" | "automation" | "testing" | "visualization";

// ============================================================================
// INSPECTOR INTERFACES
// ============================================================================

/**
 * INSPECTOR CONTROL PROPS
 * Props passed to custom inspector control components
 */
export interface InspectorControlProps<T extends BaseNodeData> {
  /** Node data and metadata */
  node: { id: string; type: string; data: T };
  /** Function to update node data */
  updateNodeData: (id: string, patch: Record<string, unknown>) => void;
  /** Optional error logging function */
  onLogError?: (
    nodeId: string,
    message: string,
    type?: any,
    source?: string
  ) => void;
  /** Optional inspector state for complex controls */
  inspectorState?: {
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

// ============================================================================
// PROCESS LOGIC INTERFACES
// ============================================================================

/**
 * PROCESS LOGIC PROPS
 * Props passed to node processing logic functions
 */
export interface ProcessLogicProps<T extends BaseNodeData> {
  id: string;
  data: T;
  connections: Connection[];
  nodesData: any[];
  updateNodeData: (id: string, data: Partial<T>) => void;
  setError: (error: string | null) => void;
}

/**
 * RENDER PROPS INTERFACES
 * Props for rendering collapsed and expanded states
 */
export interface RenderCollapsedProps<T extends BaseNodeData> {
  data: T;
  error: string | null;
  nodeType: string;
  updateNodeData: (id: string, data: Partial<T>) => void;
  id: string;
}

export interface RenderExpandedProps<T extends BaseNodeData> {
  data: T;
  error: string | null;
  nodeType: string;
  categoryTextTheme: any;
  textTheme: any;
  updateNodeData: (id: string, data: Partial<T>) => void;
  id: string;
}

// ============================================================================
// MAIN FACTORY CONFIGURATION
// ============================================================================

/**
 * NODE FACTORY CONFIGURATION
 * Complete configuration for creating a factory node
 */
export interface NodeFactoryConfig<T extends BaseNodeData> {
  /** Unique node type identifier */
  nodeType: string;
  /** Visual category for styling */
  category: NodeCategory;
  /** Human-readable display name */
  displayName: string;
  /** Optional custom sizing */
  size?: NodeSize;
  /** Input/output handle definitions */
  handles: HandleConfig[];
  /** Default data structure */
  defaultData: T;
  /** Main processing logic */
  processLogic: (props: ProcessLogicProps<T>) => void;
  /** Collapsed state render function */
  renderCollapsed: (props: RenderCollapsedProps<T>) => ReactNode;
  /** Expanded state render function */
  renderExpanded: (props: RenderExpandedProps<T>) => ReactNode;
  /** Optional inspector controls */
  renderInspectorControls?: (props: InspectorControlProps<T>) => ReactNode;
  /** Optional error recovery data */
  errorRecoveryData?: Partial<T>;
  /** Optional validation function for safety layer */
  validate?: (data: T) => boolean;
}

// ============================================================================
// CACHE AND PERFORMANCE TYPES
// ============================================================================

/**
 * CACHE ENTRY
 * Structure for cached calculation results
 */
export interface CacheEntry {
  result: boolean;
  timestamp: number;
}

/**
 * CONNECTION SUMMARY
 * Optimized connection data for memoization
 */
export interface ConnectionSummary {
  source: string;
  target: string;
  targetHandle: string | null;
  sourceHandle: string | null;
}

/**
 * NODE DATA SUMMARY
 * Optimized node data for memoization
 */
export interface NodeDataSummary {
  id: string;
  isActive?: boolean;
  triggered?: boolean;
  value?: any;
  text?: any;
  output?: any;
}

/**
 * RELEVANT CONNECTION DATA
 * Memoized connection data structure
 */
export interface RelevantConnectionData {
  connectionsSummary: ConnectionSummary[];
  nodeIds: string[];
  nodeDataSummary: NodeDataSummary[];
}

// ============================================================================
// ERROR STATE TYPES
// ============================================================================

/**
 * ERROR STATE
 * Computed error state information
 */
export interface ErrorState {
  supportsErrorInjection: boolean;
  hasVibeError: boolean;
  finalErrorForStyling: string | boolean | null;
  finalErrorType: string;
}

// ============================================================================
// HANDLE FILTER RESULTS
// ============================================================================

/**
 * FILTERED HANDLES
 * Result of handle filtering operations
 */
export interface FilteredHandles {
  inputHandlesFiltered: HandleConfig[];
  outputHandles: HandleConfig[];
}

// ============================================================================
// NODE TYPE DEFINITIONS
// ============================================================================

export type NodeType =
  | "createText"
  | "viewOutput"
  | "triggerOnToggle"
  | "testError"
  | "cyclePulse";

// ============================================================================
// BASE NODE TYPES
// ============================================================================

export interface AgenNode extends Node {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: NodeData;
  deletable?: boolean;
  targetPosition?: Position;
}

// ============================================================================
// NODE DATA INTERFACE
// ============================================================================

export interface NodeData {
  label?: string;
  showUI?: boolean;
  icon?: string;
  [key: string]: unknown;
}

// ============================================================================
// NODE CONFIGURATION INTERFACE
// ============================================================================

export interface NodeConfig {
  label: string;
  defaultData: NodeData;
  hasTargetPosition?: boolean;
  targetPosition?: Position;
  icon?: string;
  width?: number;
  height?: number;
}

// ============================================================================
// FACTORY TYPES
// ============================================================================

export interface NodeFactory {
  createNode: (
    type: NodeType,
    position: { x: number; y: number },
    customData?: Record<string, unknown>
  ) => AgenNode;
  isValidNodeType: (type: string) => type is NodeType;
  getNodeDefaultData: (type: NodeType) => NodeData;
  copyNode: (
    originalNode: AgenNode,
    offset?: { x: number; y: number }
  ) => AgenNode;
}

// ============================================================================
// REGISTRY INTEGRATION TYPES
// ============================================================================

export type InspectorControlType =
  | "text"
  | "textarea"
  | "number"
  | "boolean"
  | "select"
  | "range"
  | "none";

export interface ControlField {
  key: string;
  type: InspectorControlType;
  label: string;
  placeholder?: string;
  options?: Array<{ value: any; label: string }>;
  min?: number;
  max?: number;
  step?: number;
  rows?: number;
}

export interface ControlGroup {
  title: string;
  fields: ControlField[];
}

export interface InspectorControlConfig {
  type: "factory" | "legacy" | "none";
  controlGroups?: ControlGroup[];
  legacyControlType?: string;
}

// ============================================================================
// INTEGRATION NOTES
// ============================================================================

/**
 * REGISTRY INTEGRATION:
 *
 * This file serves as the source of truth for factory types.
 * The registry imports these types and adds its own enhanced interfaces.
 *
 * BENEFITS:
 * • Single source of truth for core factory types
 * • No circular dependencies
 * • Registry can extend and enhance these base types
 * • Full TypeScript intellisense and type safety
 * • Clean separation of concerns
 *
 * USAGE:
 * ```typescript
 * import { BaseNodeData, NodeFactoryConfig } from './factory/types';
 * import { EnhancedNodeRegistration } from './node-registry/nodeRegistry';
 * ```
 */

console.log("✅ Factory Types - Core type definitions loaded");
