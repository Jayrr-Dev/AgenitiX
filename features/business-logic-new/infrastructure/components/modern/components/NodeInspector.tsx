'use client';
/* -------------------------------------------------------------------------- */
/*  NodeInspector – shows data + input controls for the selected node         */
/*  REFACTORED: Now uses modular architecture for better maintainability     */
/* -------------------------------------------------------------------------- */

// Re-export the new modular NodeInspector
export { default } from './node-inspector/NodeInspector';
export * from './node-inspector/types'; 