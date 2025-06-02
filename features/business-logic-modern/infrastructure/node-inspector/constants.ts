/**
 * NODE INSPECTOR CONSTANTS - Configuration constants for node inspection
 *
 * • Defines default values and configuration for inspector components
 * • Provides error type mappings and severity levels for error handling
 * • Contains animation durations and timing constants for UI interactions
 * • Includes input validation rules and formatting specifications
 * • Centralizes all configurable values for consistent behavior
 *
 * Keywords: constants, configuration, defaults, error-types, validation, timing
 */

// ============================================================================
// ENHANCED REGISTRY INTEGRATION
// ============================================================================

// Import from enhanced registry instead of maintaining duplicate configuration
export { getNodeTypeConfig } from "@/features/business-logic-modern/infrastructure/flow-engine/constants";

// ============================================================================
// NODE INSPECTOR SPECIFIC CONSTANTS
// ============================================================================

export const DEFAULT_VALUES = {
  DURATION: "500",
  COUNT: "0",
  MULTIPLIER: "1",
  DELAY: "1000",
  COUNT_SPEED: 1000,
  CYCLE_DURATION: 2000,
  PULSE_DURATION: 500,
  ON_DURATION: 4000,
  OFF_DURATION: 4000,
  TOTAL_CYCLES: 1,
} as const;

export const VALIDATION = {
  MIN_DURATION: 50,
  MIN_DELAY: 0,
  MIN_CYCLES: 1,
  MAX_CYCLES: 1000,
  MIN_COUNT_SPEED: 100,
} as const;

// Default durations for various node operations (in milliseconds)
export const DEFAULT_DURATIONS = {
  DELAY: 1000,
  TIMEOUT: 5000,
  ANIMATION: 300,
  DEBOUNCE: 500,
} as const;

// Error type configurations
export const ERROR_TYPES = {
  ERROR: "error",
  WARNING: "warning",
  INFO: "info",
} as const;

// Error severity levels for styling and prioritization
export const ERROR_SEVERITY = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
} as const;

// Input validation constants
export const VALIDATION_RULES = {
  MAX_INPUT_LENGTH: 1000,
  MIN_DELAY: 0,
  MAX_DELAY: 60000,
  MIN_COUNT: 1,
  MAX_COUNT: 100,
} as const;
