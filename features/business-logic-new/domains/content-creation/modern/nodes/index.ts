// ============================================================================
// MODERN CONTENT CREATION NODES
// ============================================================================

// ENHANCED NODES - Factory-based with modern architecture
export { CreateTextEnhanced } from './CreateTextEnhanced';

// REFACTORED NODES - Modernized legacy nodes
export { default as CreateTextRefactor } from './CreateTextRefactor';

// TYPE EXPORTS
export type { CreateTextEnhancedData } from '../../../../infrastructure/flow-engine/modern/flow-editor/types';

// DOMAIN METADATA
export const CONTENT_CREATION_MODERN_NODES = {
  CreateTextEnhanced: 'createTextEnhanced',
  CreateTextRefactor: 'createTextRefactor'
} as const;

export const CONTENT_CREATION_MODERN_CATEGORIES = ['create'] as const; 