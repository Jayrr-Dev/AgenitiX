/**
 * Modern Node Registry - Updated for NodeSpec Architecture
 * 
 * This maintains the original registry interface but works with the new
 * single-file .node.tsx architecture using NodeSpec.
 */

import { CATEGORIES } from '../theming/categories';

// Import the actual node components to get their types
import testErrorV2U from '../../node-domain/test/testErrorV2U.node';
import viewOutputV2U from '../../node-domain/view/viewOutputV2U.node';

// Node types that are available
const nodeTypes = {
  testErrorV2U,
  viewOutputV2U,
} as const;

// Metadata for each node type (derived from NodeSpec)
const nodeMetadata = {
  testErrorV2U: {
    nodeType: 'testErrorV2U',
    displayName: 'Test Error (V2U)',
    category: CATEGORIES.TEST,
    description: 'Enhanced error generation with V2U architecture',
    icon: '⚠️',
    component: 'TestErrorV2UComponent',
    ui: {
      size: { width: 200, height: 150 },
      defaultCollapsed: false,
    },
    handles: [
      { id: 'json-input', dataType: 'j', position: 'left', type: 'target' },
      { id: 'text', type: 'source', dataType: 's', position: 'right' },
      { id: 'json', type: 'source', dataType: 'j', position: 'right' }
    ] as { id: string; type: string; dataType: string; position: string; }[],
    data: {
      errorMessage: { type: 'string', default: 'Custom error message' },
      errorType: { type: 'string', default: 'error' },
      isGeneratingError: { type: 'boolean', default: false },
    },
    sidebar: {
      folder: 'test',
      order: 1,
    },
  },
  viewOutputV2U: {
    nodeType: 'viewOutputV2U',
    displayName: 'View Output (V2U)',
    category: CATEGORIES.VIEW,
    description: 'Enhanced data visualization with V2U architecture',
    icon: '👁️',
    component: 'ViewOutputV2UComponent',
    ui: {
      size: { width: 200, height: 150 },
      defaultCollapsed: false,
    },
    handles: [
      { id: 'input', dataType: 'any', position: 'left', type: 'target' }
    ] as { id: string; type: string; dataType: string; position: string; }[],
    data: {
      label: { type: 'string', default: 'Output' },
      displayedValues: { type: 'array', default: [] },
      isActive: { type: 'boolean', default: true },
    },
    sidebar: {
      folder: 'view',
      order: 1,
    },
  },
};

export type NodeMetadata = typeof nodeMetadata[keyof typeof nodeMetadata];

/**
 * Get node metadata by type
 */
export function getNodeMetadata(nodeType: string): NodeMetadata | null {
  return nodeMetadata[nodeType as keyof typeof nodeMetadata] || null;
}

/**
 * Get all node metadata
 */
export function getAllNodeMetadata(): NodeMetadata[] {
  return Object.values(nodeMetadata);
}

/**
 * Validate a node type
 */
export function validateNode(nodeType: string) {
  const metadata = getNodeMetadata(nodeType);
  
  return {
    isValid: metadata !== null,
    warnings: metadata ? [] : [`Node type '${nodeType}' not found`],
    suggestions: metadata ? [] : ['Check if the node type is correctly spelled and has been migrated to NodeSpec format'],
  };
}

/**
 * Modern node registry - maintains compatibility with existing code
 */
export const modernNodeRegistry = new Map(Object.entries(nodeMetadata)); 