/**
 * CONFIG SYSTEM EXPORTS
 *
 * Centralized exports for configuration validation and management.
 * Provides clean import paths for validation, freezing, and metadata utilities.
 *
 * @author Factory Configuration Team
 * @since v3.0.0
 */

// Validation exports
export {
  createFrozenConfig,
  freezeConfig,
  getConfigMetadata,
  isConfigFrozen,
  validateNodeConfig,
  validateNodeConfigLegacy,
} from "./validation/configValidation";

// Type exports
export type {
  ConfigFreezeOptions,
  ValidationOptions,
  ValidationResult,
} from "./validation/configValidation";
