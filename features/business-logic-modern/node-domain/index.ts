/**
 * NODE DOMAIN INDEX - Central exports for modern node implementations
 *
 * This file serves as a barrel that exports all available NodeSpec-based nodes.
 * The new lazy-import registry consumes this file to dynamically load nodes
 * only when they are needed by the application.
 *
 * This file is automatically updated by the Plop generator (`pnpm new:node`).
 */

// This file will be populated by the plop generator.
// Example:
// export { default as CreateTextNode } from './create/createText.node';

export { default as CreateTextNode } from './create/createText.node';
export { default as TestErrorV2UNode } from './test/testErrorV2U.node';
export { default as TriggerOnToggleV2UNode } from './trigger/triggerOnToggleV2U.node';
export { default as ViewOutputV2UNode } from './view/viewOutputV2U.node';