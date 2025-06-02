/**
 * CONNECTION TYPE SAFETY - Comprehensive handle and connection types
 *
 * • Provides strict TypeScript interfaces for handle configurations
 * • Defines connection object types with proper handle ID validation
 * • Implements type guards for runtime validation and safety
 * • Creates branded types to prevent ID/dataType confusion
 * • Enables compile-time detection of handle system bugs
 *
 * Keywords: type-safety, handles, connections, validation, branded-types, compile-time-checks
 */

// ============================================================================
// HANDLE SYSTEM TYPES
// ============================================================================

/**
 * HANDLE ID BRAND TYPE
 * Prevents confusion between handle IDs and dataTypes
 */
export type HandleId = string & { readonly __brand: "HandleId" };

/**
 * DATA TYPE BRAND TYPE
 * Distinguishes dataTypes from handle IDs at compile time
 */
export type DataType = string & { readonly __brand: "DataType" };

/**
 * HANDLE POSITION ENUM
 * Strict positioning for handle placement
 */
export type HandlePosition = "left" | "right" | "top" | "bottom";

/**
 * HANDLE TYPE ENUM
 * Source vs target handle types
 */
export type HandleType = "source" | "target";

/**
 * STANDARD HANDLE IDS
 * Centralized constants for all handle identifiers
 */
export const HANDLE_IDS = {
  TRIGGER: "trigger" as HandleId,
  OUTPUT: "output" as HandleId,
  JSON: "json" as HandleId,
  INPUT: "input" as HandleId,
  VALUE: "value" as HandleId,
  TEXT: "text" as HandleId,
  DATA: "data" as HandleId,
} as const;

/**
 * STANDARD DATA TYPES
 * Centralized constants for all data type identifiers
 */
export const DATA_TYPES = {
  BOOLEAN: "b" as DataType,
  STRING: "s" as DataType,
  JSON: "j" as DataType,
  NUMBER: "n" as DataType,
  ANY: "a" as DataType,
} as const;

/**
 * HANDLE CONFIGURATION INTERFACE
 * Complete type-safe handle definition
 */
export interface HandleConfig {
  readonly id: HandleId;
  readonly type: HandleType;
  readonly dataType: DataType;
  readonly position: HandlePosition;
  readonly label?: string;
  readonly required?: boolean;
  readonly validation?: (value: any) => boolean;
}

/**
 * HANDLE REGISTRY TYPE
 * Maps node types to their handle configurations
 */
export type HandleRegistry = Record<string, HandleConfig[]>;

// ============================================================================
// CONNECTION SYSTEM TYPES
// ============================================================================

/**
 * NODE ID BRAND TYPE
 * Ensures node IDs are properly typed
 */
export type NodeId = string & { readonly __brand: "NodeId" };

/**
 * CONNECTION INTERFACE
 * Type-safe connection object with proper handle ID references
 */
export interface TypeSafeConnection {
  readonly source: NodeId;
  readonly target: NodeId;
  readonly sourceHandle: HandleId;
  readonly targetHandle: HandleId;
}

/**
 * CONNECTION FILTER PARAMS
 * Parameters for type-safe connection filtering
 */
export interface ConnectionFilterParams {
  readonly connections: TypeSafeConnection[];
  readonly nodeId: NodeId;
  readonly handleId?: HandleId;
  readonly handleType?: HandleType;
  readonly dataType?: DataType;
}

/**
 * TRIGGER CONNECTION PARAMS
 * Specific parameters for trigger connection detection
 */
export interface TriggerConnectionParams {
  readonly connections: TypeSafeConnection[];
  readonly nodeId: NodeId;
  readonly triggerHandleId?: HandleId;
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

/**
 * HANDLE VALIDATION RESULT
 * Result of handle configuration validation
 */
export interface HandleValidationResult {
  readonly valid: boolean;
  readonly errors: string[];
  readonly warnings: string[];
}

/**
 * CONNECTION VALIDATION RESULT
 * Result of connection validation
 */
export interface ConnectionValidationResult {
  readonly valid: boolean;
  readonly errors: string[];
  readonly sourceHandle?: HandleConfig;
  readonly targetHandle?: HandleConfig;
  readonly dataTypeCompatible: boolean;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * IS HANDLE ID
 * Type guard to validate handle ID format
 */
export const isHandleId = (value: string): value is HandleId => {
  return typeof value === "string" && value.length > 0 && !value.includes(" ");
};

/**
 * IS DATA TYPE
 * Type guard to validate data type format
 */
export const isDataType = (value: string): value is DataType => {
  return Object.values(DATA_TYPES).includes(value as DataType);
};

/**
 * IS NODE ID
 * Type guard to validate node ID format
 */
export const isNodeId = (value: string): value is NodeId => {
  return typeof value === "string" && value.length > 0;
};

/**
 * IS VALID CONNECTION
 * Type guard to validate connection object structure
 */
export const isValidConnection = (obj: any): obj is TypeSafeConnection => {
  return (
    obj &&
    typeof obj === "object" &&
    isNodeId(obj.source) &&
    isNodeId(obj.target) &&
    isHandleId(obj.sourceHandle) &&
    isHandleId(obj.targetHandle)
  );
};

// ============================================================================
// BRANDED TYPE CREATORS
// ============================================================================

/**
 * CREATE HANDLE ID
 * Safe constructor for HandleId branded type
 */
export const createHandleId = (value: string): HandleId => {
  if (!isHandleId(value)) {
    throw new Error(
      `Invalid handle ID: "${value}". Must be non-empty string without spaces.`
    );
  }
  return value as HandleId;
};

/**
 * CREATE DATA TYPE
 * Safe constructor for DataType branded type
 */
export const createDataType = (value: string): DataType => {
  if (!isDataType(value)) {
    throw new Error(
      `Invalid data type: "${value}". Must be one of: ${Object.values(DATA_TYPES).join(", ")}`
    );
  }
  return value as DataType;
};

/**
 * CREATE NODE ID
 * Safe constructor for NodeId branded type
 */
export const createNodeId = (value: string): NodeId => {
  if (!isNodeId(value)) {
    throw new Error(`Invalid node ID: "${value}". Must be non-empty string.`);
  }
  return value as NodeId;
};

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * EXTRACT HANDLE IDS
 * Utility type to extract handle IDs from handle configs
 */
export type ExtractHandleIds<T extends readonly HandleConfig[]> =
  T[number]["id"];

/**
 * FILTER CONNECTIONS BY HANDLE
 * Utility type for connection filtering results
 */
export type FilterConnectionsByHandle<T extends HandleId> =
  TypeSafeConnection & {
    readonly targetHandle: T;
  };

/**
 * HANDLE TYPE MAP
 * Maps handle IDs to their expected data types
 */
export type HandleTypeMap = {
  [K in HandleId]: DataType;
};

// ============================================================================
// COMPILE TIME VALIDATION
// ============================================================================

/**
 * VALIDATE HANDLE CONSISTENCY
 * Compile-time check that handle IDs and data types are properly separated
 */
type ValidateHandleConsistency = {
  // Ensure handle IDs cannot be assigned to data types
  handleIdIsNotDataType: HandleId extends DataType ? never : true;
  // Ensure data types cannot be assigned to handle IDs
  dataTypeIsNotHandleId: DataType extends HandleId ? never : true;
  // Ensure node IDs are properly branded
  nodeIdIsBranded: NodeId extends string
    ? string extends NodeId
      ? never
      : true
    : never;
};

// Compile-time assertion
const _validateTypes: ValidateHandleConsistency = {
  handleIdIsNotDataType: true,
  dataTypeIsNotHandleId: true,
  nodeIdIsBranded: true,
};

// Export the validation type for external use
export type { ValidateHandleConsistency };
