// ============================================================================
// ENHANCED REGISTRY INTEGRATION
// ============================================================================

// Import from enhanced registry instead of maintaining duplicate configuration
export { NODE_TYPE_CONFIG } from '../../flow-editor/constants';

// ============================================================================
// NODE INSPECTOR SPECIFIC CONSTANTS
// ============================================================================

export const DEFAULT_VALUES = {
  DURATION: '500',
  COUNT: '0',
  MULTIPLIER: '1',
  DELAY: '1000',
  COUNT_SPEED: 1000,
  CYCLE_DURATION: 2000,
  PULSE_DURATION: 500,
  ON_DURATION: 4000,
  OFF_DURATION: 4000,
  TOTAL_CYCLES: 1
} as const;

export const VALIDATION = {
  MIN_DURATION: 50,
  MIN_DELAY: 0,
  MIN_CYCLES: 1,
  MAX_CYCLES: 1000,
  MIN_COUNT_SPEED: 100
} as const; 