/**
 * Convert Domain Types
 * 
 * Type definitions for conversion and data transformation nodes
 */

import { z } from "zod";

// ============================================================================
// COMMON CONVERSION TYPES
// ============================================================================

/**
 * Key generation strategy for toObject conversion
 */
export type ObjectKeyStrategy = 
  | "hash"      // Generate hash-based key (e.g., { d2Fd: "hello" })
  | "index"     // Use numeric index (e.g., { 1: "hello" })
  | "custom"    // Use custom key array
  | "auto";     // Auto-detect best strategy

/**
 * Array conversion mode for toArray
 */
export type ArrayConversionMode =
  | "single"    // Single input to array [input]
  | "multiple"  // Multiple inputs to array [input1, input2, ...]
  | "flatten";  // Flatten nested arrays

/**
 * Text conversion format options
 */
export type TextConversionFormat =
  | "default"   // Standard toString()
  | "json"      // JSON.stringify()
  | "pretty"    // Pretty-printed format
  | "debug";    // Debug representation

// ============================================================================
// NODE DATA SCHEMAS
// ============================================================================

/**
 * Base conversion node data schema
 */
export const BaseConversionDataSchema = z.object({
  // UI State
  isEnabled: z.boolean().default(true),
  isActive: z.boolean().default(false),
  isExpanded: z.boolean().default(false),
  expandedSize: z.string().default("VE1"),
  collapsedSize: z.string().default("C1"),
  
  // Input/Output
  inputValue: z.any().optional(),
  outputValue: z.any().optional(),
  
  // Error handling
  hasError: z.boolean().default(false),
  errorMessage: z.string().optional(),
}).passthrough();

/**
 * Boolean conversion specific data
 */
export const BooleanConversionDataSchema = BaseConversionDataSchema.extend({
  // Boolean-specific options
  strictMode: z.boolean().default(false), // Use strict falsy rules
  customFalsyValues: z.array(z.string()).default([]), // Custom falsy values
  
  // Output
  booleanOutput: z.boolean().default(false),
});

/**
 * Text conversion specific data
 */
export const TextConversionDataSchema = BaseConversionDataSchema.extend({
  // Text-specific options
  format: z.enum(["default", "json", "pretty", "debug"]).default("default"),
  maxLength: z.number().optional(),
  truncateIndicator: z.string().default("..."),
  
  // Output
  textOutput: z.string().default(""),
});

/**
 * Object conversion specific data
 */
export const ObjectConversionDataSchema = BaseConversionDataSchema.extend({
  // Object-specific options
  keyStrategy: z.enum(["hash", "index", "custom", "auto"]).default("auto"),
  customKeys: z.array(z.string()).default([]),
  preserveType: z.boolean().default(false),
  
  // Output
  objectOutput: z.record(z.any()).default({}),
});

/**
 * Array conversion specific data
 */
export const ArrayConversionDataSchema = BaseConversionDataSchema.extend({
  // Array-specific options
  mode: z.enum(["single", "multiple", "flatten"]).default("multiple"),
  maxItems: z.number().optional(),
  preserveOrder: z.boolean().default(true),
  
  // Multiple inputs
  inputs: z.array(z.any()).default([]),
  
  // Output
  arrayOutput: z.array(z.any()).default([]),
});

/**
 * Any conversion specific data (passthrough)
 */
export const AnyConversionDataSchema = BaseConversionDataSchema.extend({
  // Any-specific options (minimal)
  preserveMetadata: z.boolean().default(false),
  
  // Output
  anyOutput: z.any().optional(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type BaseConversionData = z.infer<typeof BaseConversionDataSchema>;
export type BooleanConversionData = z.infer<typeof BooleanConversionDataSchema>;
export type TextConversionData = z.infer<typeof TextConversionDataSchema>;
export type ObjectConversionData = z.infer<typeof ObjectConversionDataSchema>;
export type ArrayConversionData = z.infer<typeof ArrayConversionDataSchema>;
export type AnyConversionData = z.infer<typeof AnyConversionDataSchema>;

// Union type for all conversion data
export type ConversionNodeData = 
  | BooleanConversionData
  | TextConversionData
  | ObjectConversionData
  | ArrayConversionData
  | AnyConversionData;