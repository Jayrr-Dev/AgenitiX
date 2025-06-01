import { useMemo } from 'react';
import { useVibeModeStore } from '../../../stores/vibeModeStore';
import type { HandleConfig, FilteredHandles } from '../types';
import { shouldShowJsonHandle } from '../utils/conditionalRendering';

/**
 * USE NODE HANDLES
 * Smart handle filtering and display logic
 * Refactored with extracted conditional logic utilities
 * 
 * @param handles - Handle configuration array
 * @param connections - Current connections
 * @param allNodes - All nodes in the flow
 * @returns Filtered input and output handles
 */
export function useNodeHandles(
  handles: HandleConfig[],
  connections: any[],
  allNodes: any[]
): FilteredHandles {
  // VIBE MODE STATE
  const { isVibeModeActive, showJsonHandles } = useVibeModeStore();

  // ========================================================================
  // HANDLE VALIDATION AND DEBUGGING
  // ========================================================================
  
  // Check for handle ID conflicts (in development)
  if (process.env.NODE_ENV === 'development') {
    const handleIds = handles.map(h => h.id);
    const duplicateIds = handleIds.filter((id, index) => handleIds.indexOf(id) !== index);
    
    if (duplicateIds.length > 0) {
      console.error('🚨 Handle ID conflicts detected:', duplicateIds);
      console.error('🔧 Handles configuration:', handles);
    }
  }

  // ========================================================================
  // HANDLE FILTERING LOGIC WITH EXTRACTED UTILITIES
  // ========================================================================
  
  const { inputHandlesFiltered, outputHandles }: FilteredHandles = useMemo(() => {
    
    // FILTER INPUT HANDLES with extracted logic
    const inputHandlesFiltered = handles
      .filter(handle => handle.type === 'target')
      .filter(handle => shouldShowJsonHandle(
        handle,
        connections,
        allNodes,
        showJsonHandles,
        isVibeModeActive
      ));
    
    // FILTER OUTPUT HANDLES (simpler logic)
    const outputHandles = filterOutputHandles(handles);
    
    return { inputHandlesFiltered, outputHandles };
  }, [
    handles, 
    connections, 
    showJsonHandles, 
    isVibeModeActive, 
    allNodes
  ]);

  return { inputHandlesFiltered, outputHandles };
}

// ============================================================================
// EXTRACTED HELPER FUNCTIONS
// ============================================================================

/**
 * FILTER OUTPUT HANDLES
 * Simple output handle filtering with early return
 */
function filterOutputHandles(handles: HandleConfig[]): HandleConfig[] {
  return handles.filter(handle => handle.type === 'source');
} 