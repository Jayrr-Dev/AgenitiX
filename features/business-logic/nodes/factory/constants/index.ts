// ============================================================================
// FACTORY NODE CONSTANTS
// ============================================================================

import { Position } from '@xyflow/react';
import type { NodeSize } from '../types';

// ============================================================================
// CACHE CONFIGURATION
// ============================================================================

/**
 * CACHE CONFIGURATION
 * Settings for performance optimization caching
 */
export const CACHE_TTL = 100; // Cache for 100ms to batch rapid updates

// ============================================================================
// TIMING CONFIGURATION
// ============================================================================

/**
 * DEBOUNCE TIMING
 * Optimized timing for smooth vs instant updates
 */
export const SMOOTH_ACTIVATION_DELAY = 8; // ms for smooth activation
export const INSTANT_PRIORITY_DELAY = 0; // ms for instant updates

/**
 * PROCESSING THROTTLE
 * Prevent rapid successive processing calls
 */
export const PROCESSING_THROTTLE_MS = 5; // ms minimum between processing calls

// ============================================================================
// DEFAULT NODE SIZES
// ============================================================================

/**
 * DEFAULT NODE SIZES
 * Standard sizing configurations for different node types
 */
export const DEFAULT_TEXT_NODE_SIZE: NodeSize = {
  collapsed: {
    width: 'w-[120px]',
    height: 'h-[60px]'
  },
  expanded: {
    width: 'w-[180px]'
  }
};

export const DEFAULT_LOGIC_NODE_SIZE: NodeSize = {
  collapsed: {
    width: 'w-[60px]',
    height: 'h-[60px]'
  },
  expanded: {
    width: 'w-[120px]'
  }
};

// ============================================================================
// ERROR INJECTION SUPPORT
// ============================================================================

/**
 * NODES SUPPORTING ERROR INJECTION
 * Node types that support Vibe Mode error injection
 */
export const ERROR_INJECTION_SUPPORTED_NODES = [
  'createText', 
  'testJson', 
  'viewOutput'
] as const;

// ============================================================================
// NODE CLASSIFICATION
// ============================================================================

/**
 * TRANSFORMATION NODE PATTERNS
 * Patterns to identify transformation nodes
 */
export const TRANSFORMATION_NODE_PATTERNS = [
  'turnToUppercase',
  'transform',
  'turn',
  'convert'
] as const;

/**
 * TRIGGER NODE PATTERNS
 * Patterns to identify trigger nodes
 */
export const TRIGGER_NODE_PATTERNS = [
  'trigger',
  'pulse',
  'toggle'
] as const;

/**
 * HEAD NODE PATTERNS
 * Patterns to identify head/source nodes
 */
export const HEAD_NODE_PATTERNS = [
  'trigger',
  'cycle',
  'create',
  'input',
  'manual'
] as const; 