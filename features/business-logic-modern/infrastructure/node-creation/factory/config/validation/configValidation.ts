/**
 * CONFIGURATION VALIDATION SYSTEM
 *
 * Provides comprehensive runtime validation and immutability for node factory configurations.
 * Ensures type safety, data integrity, and performance optimization through config freezing.
 *
 * FEATURES:
 * • Runtime validation for NodeFactoryConfig objects
 * • Deep immutability through object freezing
 * • Type-safe configuration handling
 * • Performance-optimized validation checks
 * • Comprehensive error messages with debugging info
 *
 * VALIDATION BENEFITS:
 * • Prevents runtime configuration errors
 * • Ensures data integrity across the system
 * • Provides clear error messages for debugging
 * • Maintains immutability for predictable behavior
 *
 * @author Factory Configuration Team
 * @since v3.0.0
 * @keywords config-validation, immutability, type-safety, runtime-validation
 */

import type {
  BaseNodeData,
  HandleConfig,
  NodeFactoryConfig,
} from "../../types";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ValidationOptions {
  /** Whether to validate handle configurations (default: true) */
  validateHandles?: boolean;
  /** Whether to validate size configurations (default: true) */
  validateSize?: boolean;
  /** Whether to perform deep validation (default: false) */
  deepValidation?: boolean;
  /** Whether to throw errors or return validation results (default: true) */
  throwOnError?: boolean;
}

export interface ValidationResult {
  /** Whether the configuration is valid */
  isValid: boolean;
  /** List of validation errors */
  errors: string[];
  /** List of validation warnings */
  warnings: string[];
  /** Validation metadata */
  metadata: {
    validatedAt: string;
    nodeType: string;
    configSize: number;
  };
}

export interface ConfigFreezeOptions {
  /** Whether to perform deep freezing (default: true) */
  deep?: boolean;
  /** Whether to freeze handle configurations (default: true) */
  freezeHandles?: boolean;
  /** Whether to freeze size configurations (default: true) */
  freezeSize?: boolean;
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Comprehensive runtime validation for NodeFactoryConfig
 * Performs type checking, structure validation, and optional deep validation
 *
 * @param config - The configuration object to validate
 * @param options - Validation options for customizing behavior
 * @returns ValidationResult with detailed validation information
 *
 * @example
 * ```typescript
 * const result = validateNodeConfig(config, { deepValidation: true });
 * if (!result.isValid) {
 *   console.error('Config validation failed:', result.errors);
 * }
 * ```
 */
export function validateNodeConfig<T extends BaseNodeData>(
  config: NodeFactoryConfig<T>,
  options: ValidationOptions = {}
): ValidationResult {
  const {
    validateHandles = true,
    validateSize = true,
    deepValidation = false,
    throwOnError = true,
  } = options;

  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic validation
  if (!config || typeof config !== "object") {
    const error = "NodeFactoryConfig must be an object";
    errors.push(error);
    if (throwOnError) throw new Error(error);
  }

  if (typeof config.nodeType !== "string" || !config.nodeType.trim()) {
    const error = "NodeFactoryConfig.nodeType must be a non-empty string";
    errors.push(error);
    if (throwOnError) throw new Error(error);
  }

  // Handle validation
  if (validateHandles && config.handles) {
    if (!Array.isArray(config.handles)) {
      const error = "NodeFactoryConfig.handles must be an array if provided";
      errors.push(error);
      if (throwOnError) throw new Error(error);
    } else if (deepValidation) {
      // Deep handle validation
      config.handles.forEach((handle, index) => {
        if (!isValidHandle(handle)) {
          errors.push(
            `Invalid handle at index ${index}: ${JSON.stringify(handle)}`
          );
        }
      });
    }
  }

  // Size validation
  if (validateSize && config.size) {
    if (typeof config.size !== "object") {
      const error = "NodeFactoryConfig.size must be an object if provided";
      errors.push(error);
      if (throwOnError) throw new Error(error);
    } else if (deepValidation) {
      // Deep size validation
      const sizeErrors = validateSizeConfig(config.size);
      errors.push(...sizeErrors);
    }
  }

  // Additional deep validation
  if (deepValidation) {
    // Validate category
    if (config.category && typeof config.category !== "string") {
      errors.push("NodeFactoryConfig.category must be a string");
    }

    // Validate displayName
    if (!config.displayName || typeof config.displayName !== "string") {
      errors.push(
        "NodeFactoryConfig.displayName is required and must be a string"
      );
    }

    // Validate defaultData structure
    if (!config.defaultData || typeof config.defaultData !== "object") {
      errors.push(
        "NodeFactoryConfig.defaultData is required and must be an object"
      );
    }

    // Validate processing functions
    if (!config.processLogic || typeof config.processLogic !== "function") {
      errors.push(
        "NodeFactoryConfig.processLogic is required and must be a function"
      );
    }

    if (
      !config.renderCollapsed ||
      typeof config.renderCollapsed !== "function"
    ) {
      errors.push(
        "NodeFactoryConfig.renderCollapsed is required and must be a function"
      );
    }

    if (!config.renderExpanded || typeof config.renderExpanded !== "function") {
      errors.push(
        "NodeFactoryConfig.renderExpanded is required and must be a function"
      );
    }

    // Optional function validations
    if (
      config.renderInspectorControls &&
      typeof config.renderInspectorControls !== "function"
    ) {
      errors.push(
        "NodeFactoryConfig.renderInspectorControls must be a function if provided"
      );
    }

    if (config.validate && typeof config.validate !== "function") {
      errors.push("NodeFactoryConfig.validate must be a function if provided");
    }

    // Check for circular references
    try {
      JSON.stringify(config);
    } catch (error) {
      errors.push(`Configuration contains circular references: ${error}`);
    }
  }

  const result: ValidationResult = {
    isValid: errors.length === 0,
    errors,
    warnings,
    metadata: {
      validatedAt: new Date().toISOString(),
      nodeType: config?.nodeType || "unknown",
      configSize: JSON.stringify(config || {}).length,
    },
  };

  return result;
}

/**
 * Legacy validation function for backward compatibility
 * Throws errors on validation failure (original behavior)
 *
 * @param config - The configuration to validate
 * @throws Error if validation fails
 */
export function validateNodeConfigLegacy<T extends BaseNodeData>(
  config: NodeFactoryConfig<T>
): void {
  validateNodeConfig(config, { throwOnError: true });
}

// ============================================================================
// CONFIGURATION FREEZING
// ============================================================================

/**
 * Freeze config object to guarantee immutability and purity
 * Creates a deep frozen copy to prevent accidental modifications
 *
 * @param config - The configuration to freeze
 * @param options - Freezing options for customizing behavior
 * @returns Immutable frozen configuration
 *
 * @example
 * ```typescript
 * const frozenConfig = freezeConfig(config, { deep: true });
 * // frozenConfig is now completely immutable
 * ```
 */
export function freezeConfig<T extends BaseNodeData>(
  config: NodeFactoryConfig<T>,
  options: ConfigFreezeOptions = {}
): NodeFactoryConfig<T> {
  const { deep = true, freezeHandles = true, freezeSize = true } = options;

  // Create a deep copy to avoid mutating the original
  const frozenConfig = {
    ...config,
    handles:
      freezeHandles && config.handles ? [...config.handles] : config.handles,
    size: freezeSize && config.size ? { ...config.size } : config.size,
  } as NodeFactoryConfig<T>;

  // Apply freezing
  if (deep) {
    return deepFreeze(frozenConfig);
  } else {
    return Object.freeze(frozenConfig);
  }
}

/**
 * Create a frozen copy of the configuration for safe usage
 * Non-destructive alternative to freezeConfig that preserves original
 *
 * @param config - The configuration to copy and freeze
 * @param options - Freezing options
 * @returns New frozen configuration instance
 */
export function createFrozenConfig<T extends BaseNodeData>(
  config: NodeFactoryConfig<T>,
  options: ConfigFreezeOptions = {}
): NodeFactoryConfig<T> {
  // Always perform deep copying for safety
  const deepCopy = JSON.parse(JSON.stringify(config));
  return freezeConfig(deepCopy, options);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Deep freeze an object and all its nested properties
 * Ensures complete immutability throughout the object tree
 *
 * @param obj - The object to deep freeze
 * @returns Deeply frozen object
 */
function deepFreeze<T>(obj: T): T {
  // Retrieve the property names defined on obj
  Object.getOwnPropertyNames(obj).forEach((prop) => {
    const value = (obj as any)[prop];

    // Freeze properties before freezing self
    if (value && typeof value === "object") {
      deepFreeze(value);
    }
  });

  return Object.freeze(obj);
}

/**
 * Validate a handle configuration object
 * @param handle - The handle to validate
 * @returns Whether the handle is valid
 */
function isValidHandle(handle: any): handle is HandleConfig {
  return (
    handle &&
    typeof handle === "object" &&
    typeof handle.id === "string" &&
    typeof handle.type === "string" &&
    (handle.position === undefined || typeof handle.position === "string")
  );
}

/**
 * Validate size configuration
 * @param size - The size configuration to validate
 * @returns Array of validation errors
 */
function validateSizeConfig(size: any): string[] {
  const errors: string[] = [];

  if (size.width !== undefined) {
    if (typeof size.width !== "number" || size.width < 0) {
      errors.push("Size width must be a non-negative number");
    }
  }

  if (size.height !== undefined) {
    if (typeof size.height !== "number" || size.height < 0) {
      errors.push("Size height must be a non-negative number");
    }
  }

  if (size.minWidth !== undefined) {
    if (typeof size.minWidth !== "number" || size.minWidth < 0) {
      errors.push("Size minWidth must be a non-negative number");
    }
  }

  if (size.minHeight !== undefined) {
    if (typeof size.minHeight !== "number" || size.minHeight < 0) {
      errors.push("Size minHeight must be a non-negative number");
    }
  }

  // Logical validation
  if (size.width && size.minWidth && size.width < size.minWidth) {
    errors.push("Size width cannot be less than minWidth");
  }

  if (size.height && size.minHeight && size.height < size.minHeight) {
    errors.push("Size height cannot be less than minHeight");
  }

  return errors;
}

/**
 * Check if a configuration is frozen
 * @param config - The configuration to check
 * @returns Whether the configuration is frozen
 */
export function isConfigFrozen<T extends BaseNodeData>(
  config: NodeFactoryConfig<T>
): boolean {
  return Object.isFrozen(config);
}

/**
 * Get configuration metadata for debugging
 * @param config - The configuration to analyze
 * @returns Metadata about the configuration
 */
export function getConfigMetadata<T extends BaseNodeData>(
  config: NodeFactoryConfig<T>
) {
  return {
    nodeType: config.nodeType,
    category: config.category,
    displayName: config.displayName,
    hasHandles: !!config.handles,
    handleCount: config.handles?.length || 0,
    hasSize: !!config.size,
    hasDefaultData: !!config.defaultData,
    hasProcessLogic: !!config.processLogic,
    hasRenderCollapsed: !!config.renderCollapsed,
    hasRenderExpanded: !!config.renderExpanded,
    hasInspectorControls: !!config.renderInspectorControls,
    hasValidation: !!config.validate,
    isFrozen: Object.isFrozen(config),
    configSize: JSON.stringify(config).length,
    propertyCount: Object.keys(config).length,
  };
}
