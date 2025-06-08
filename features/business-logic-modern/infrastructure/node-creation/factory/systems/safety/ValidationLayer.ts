/**
 * VALIDATION LAYER - Enterprise-grade configuration validation
 *
 * • Provides comprehensive node configuration validation
 * • Implements type-safe validation with detailed error messages
 * • Supports validation of handles, sizes, and node integrity
 * • Features configuration freezing for immutability guarantees
 *
 * Keywords: validation, type-safety, configuration, immutability, enterprise
 */

import type { BaseNodeData, NodeFactoryConfig } from "../../types";

// ============================================================================
// CONFIGURATION VALIDATION
// ============================================================================

/**
 * Validates node factory configuration for type safety and correctness
 * @param config - The node factory configuration to validate
 * @throws Error if configuration is invalid
 */
export function validateNodeConfig<T extends BaseNodeData>(
  config: NodeFactoryConfig<T>
): void {
  if (!config || typeof config !== "object") {
    throw new Error("NodeFactoryConfig must be an object");
  }

  if (typeof config.nodeType !== "string" || !config.nodeType.trim()) {
    throw new Error("NodeFactoryConfig.nodeType must be a non-empty string");
  }

  if (config.handles && !Array.isArray(config.handles)) {
    throw new Error("NodeFactoryConfig.handles must be an array if provided");
  }

  if (config.size && typeof config.size !== "object") {
    throw new Error("NodeFactoryConfig.size must be an object if provided");
  }
}

/**
 * Freeze config object to guarantee purity and prevent mutations
 * @param config - The configuration to freeze
 * @returns Frozen configuration object
 */
export function freezeConfig<T extends BaseNodeData>(
  config: NodeFactoryConfig<T>
): NodeFactoryConfig<T> {
  return Object.freeze({
    ...config,
    handles: config.handles ? [...config.handles] : undefined,
    size: config.size ? { ...config.size } : undefined,
  }) as NodeFactoryConfig<T>;
}

// ============================================================================
// NODE INTEGRITY VALIDATION
// ============================================================================

/**
 * Validates node integrity and returns validation status
 * @param nodeId - The node ID to validate
 * @returns True if node passes all integrity checks
 */
export function validateNodeIntegrity(nodeId: string): boolean {
  try {
    // Basic validation checks
    if (!nodeId || typeof nodeId !== "string") {
      console.warn(`[ValidationLayer] Invalid nodeId: ${nodeId}`);
      return false;
    }

    // Additional integrity checks can be added here
    // - Check if node exists in DOM
    // - Validate node data structure
    // - Check connections validity
    // - Verify handle configurations

    return true;
  } catch (error) {
    console.error(
      `[ValidationLayer] Node integrity check failed for ${nodeId}:`,
      error
    );
    return false;
  }
}

// ============================================================================
// HANDLE VALIDATION
// ============================================================================

/**
 * Validates handle configuration array
 * @param handles - Array of handle configurations to validate
 * @returns True if all handles are valid
 */
export function validateHandles(handles: any[]): boolean {
  if (!Array.isArray(handles)) {
    return false;
  }

  return handles.every((handle) => {
    return (
      handle &&
      typeof handle.id === "string" &&
      typeof handle.dataType === "string" &&
      typeof handle.position === "string" &&
      (handle.type === "source" || handle.type === "target")
    );
  });
}

// ============================================================================
// SIZE VALIDATION
// ============================================================================

/**
 * Validates node size configuration
 * @param size - Size configuration to validate
 * @returns True if size configuration is valid
 */
export function validateNodeSize(size: any): boolean {
  if (!size || typeof size !== "object") {
    return false;
  }

  const { collapsed, expanded } = size;

  // Validate collapsed size
  if (
    !collapsed ||
    !collapsed.width?.startsWith("w-") ||
    !collapsed.height?.startsWith("h-")
  ) {
    return false;
  }

  // Validate expanded size
  if (!expanded || !expanded.width?.startsWith("w-")) {
    return false;
  }

  // Expanded height is optional
  if (expanded.height && !expanded.height.startsWith("h-")) {
    return false;
  }

  return true;
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Creates a comprehensive validation report for a node configuration
 * @param config - Configuration to validate
 * @returns Validation report with errors and warnings
 */
export function createValidationReport<T extends BaseNodeData>(
  config: NodeFactoryConfig<T>
): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    validateNodeConfig(config);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }

  // Additional validation checks
  if (config.handles && !validateHandles(config.handles)) {
    errors.push("Invalid handle configuration detected");
  }

  if (config.size && !validateNodeSize(config.size)) {
    warnings.push("Size configuration may not follow best practices");
  }

  if (!config.displayName) {
    warnings.push(
      "No display name provided - consider adding one for better UX"
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates multiple configurations at once
 * @param configs - Array of configurations to validate
 * @returns Array of validation reports
 */
export function validateConfigurations<T extends BaseNodeData>(
  configs: NodeFactoryConfig<T>[]
): Array<{
  config: NodeFactoryConfig<T>;
  report: ReturnType<typeof createValidationReport>;
}> {
  return configs.map((config) => ({
    config,
    report: createValidationReport(config),
  }));
}
