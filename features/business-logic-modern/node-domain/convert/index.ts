/**
 * Convert Domain - Type Conversion and Data Transformation Nodes
 * 
 * This domain contains nodes that convert any input to specific output types,
 * following JavaScript type conversion rules and best practices.
 * 
 * Available nodes:
 * - toBoolean: Converts any input to boolean using JavaScript falsy rules
 * - toText: Converts any input to string representation
 * - toObject: Converts any input to object with configurable key strategy
 * - toArray: Converts multiple inputs to array format
 * - toAny: Passes through any input as universal any type
 */

// Export all convert nodes
export { default as toBoolean } from "./toBoolean.node";
export { default as toText } from "./toText.node";
export { default as toObject } from "./toObject.node";
export { default as toArray } from "./toArray.node";
export { default as toAny } from "./toAny.node";

// Export shared types and utilities
export * from "./types";
export * from "./utils";