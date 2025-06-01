import { useMemo } from 'react';
import { useVibeModeStore } from '../../../stores/vibeModeStore';
import type { HandleConfig, FilteredHandles } from '../types';

/**
 * USE NODE HANDLES
 * Smart handle filtering and display logic
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

  // HANDLE FILTERING LOGIC
  const { inputHandlesFiltered, outputHandles }: FilteredHandles = useMemo(() => {
    // FILTER INPUT HANDLES
    const inputHandlesFiltered = handles
      .filter(handle => handle.type === 'target')
      .filter(handle => {
        // JSON HANDLE VISIBILITY LOGIC
        if (handle.dataType === 'j') {
          const hasJsonConnection = connections.some(c => c.targetHandle === handle.id);
          const hasJsonSources = allNodes.some(node => 
            node.type === 'testJson' || 
            node.type === 'testError' ||
            (node.data && (node.data.json !== undefined || node.data.parsedJson !== undefined))
          );
          
          // PRIORITY ORDER for JSON handle visibility:
          // 1. ALWAYS show if already connected (don't break existing connections)
          // 2. Show if showJsonHandles is explicitly enabled (X button state)
          // 3. Show if Vibe Mode is active (legacy support)
          // 4. Show if there are JSON sources in the flow (smart auto-show)
          return hasJsonConnection ||           // Priority 1: Connected = always visible
                 showJsonHandles ||             // Priority 2: X button state
                 isVibeModeActive ||            // Priority 3: Vibe Mode legacy
                 hasJsonSources;                // Priority 4: Smart auto-show
        }
        return true;
      });
    
    // FILTER OUTPUT HANDLES
    const outputHandles = handles.filter(handle => handle.type === 'source');
    
    return { inputHandlesFiltered, outputHandles };
  }, [handles, connections, showJsonHandles, isVibeModeActive, allNodes]);

  return { inputHandlesFiltered, outputHandles };
} 