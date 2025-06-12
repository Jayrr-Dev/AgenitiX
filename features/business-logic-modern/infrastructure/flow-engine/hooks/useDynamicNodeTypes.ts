import { useMemo } from 'react';

// Import all available node components
// This should be automatically updated when new nodes are created via Plop
import testErrorV2U from '../../../node-domain/test/testErrorV2U.node';
import viewOutputV2U from '../../../node-domain/view/viewOutputV2U.node';
// Add new node imports here (Plop can auto-inject these)

/**
 * Hook that provides nodeTypes for React Flow
 * Maps node type strings to their actual components
 * 
 * When you create a new node with `pnpm new:node`, add the import above
 * and include it in the nodeTypes object below.
 */
export function useDynamicNodeTypes() {
  const nodeTypes = useMemo(() => ({
    testErrorV2U,
    viewOutputV2U,
    // Add new node types here
  }), []);

  return nodeTypes;
} 