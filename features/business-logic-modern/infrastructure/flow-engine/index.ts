/**
 * FLOW ENGINE INDEX - Central export point for flow engine
 *
 * • Re-exports main FlowEditor component and functionality
 * • Provides unified access to flow editor types and interfaces
 * • Exports flow editor constants and configuration
 * • Centralized entry point for all flow engine features
 * • Simplifies imports across the application
 *
 * Keywords: exports, flow-engine, entry-point, types, constants
 */

// ============================================================================
// FLOW ENGINE EXPORTS
// ============================================================================
// Central export point for all flow engine functionality

// RE-EXPORT FLOW EDITOR MAIN
export * from "./flow-editor";

// RE-EXPORT TYPES
export * from "./flow-editor/types";

// RE-EXPORT CONSTANTS
export * from "./flow-editor/constants";
