/**
 * NODE INSPECTOR - Re-export wrapper for modular node inspector
 *
 * • Re-exports the main NodeInspector component from modular architecture
 * • Provides unified access to node inspection functionality
 * • Exports types and interfaces for node inspector components
 * • Maintains backward compatibility with legacy imports
 * • Central entry point for node property editing and display
 *
 * Keywords: node-inspector, re-export, modular, properties, editing
 */

"use client";
/* -------------------------------------------------------------------------- */
/*  NodeInspector – shows data + input controls for the selected node         */
/*  REFACTORED: Now uses modular architecture for better maintainability     */
/* -------------------------------------------------------------------------- */

// Re-export the new modular NodeInspector
export { default } from "./node-inspector/NodeInspector";
export * from "./node-inspector/types";
