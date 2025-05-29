'use client'

import React from 'react';
import { Position } from '@xyflow/react';
import { createNodeComponent, type BaseNodeData } from '../factory/NodeFactory';
import IconForTrigger from '../node-icons/IconForTrigger';

// ============================================================================
// NODE DATA INTERFACE  
// ============================================================================

interface TriggerOnClickData extends BaseNodeData {
  triggered: boolean;
}

// ============================================================================
// NODE CONFIGURATION
// ============================================================================

const TriggerOnClick = createNodeComponent<TriggerOnClickData>({
  nodeType: 'triggerOnClick',
  category: 'trigger', // Yellow theme for trigger nodes
  displayName: 'Trigger On Click',
  defaultData: { 
    triggered: false
  },
  
  // Use logic node size (60x60 collapsed, 120x120 expanded)
  size: {
    collapsed: {
      width: 'w-[60px]',
      height: 'h-[60px]'
    },
    expanded: {
      width: 'w-[120px]'
    }
  },
  
  // Define handles (boolean input -> boolean output)
  handles: [
    { id: 'b', dataType: 'b', position: Position.Left, type: 'target' },
    { id: 'b', dataType: 'b', position: Position.Right, type: 'source' }
  ],
  
  // Processing logic - handle external trigger input
  processLogic: ({ data, connections, nodesData, updateNodeData, id, setError }) => {
    try {
      // Filter for boolean input connections
      const boolInputConnections = connections.filter(c => c.targetHandle === 'b');
      
      // If there are external boolean inputs, check if any are triggered
    if (boolInputConnections.length > 0) {
        const externalTrigger = nodesData.some(node => {
          // Check various trigger properties that might indicate an active trigger
          return node.data?.triggered === true || 
                 node.data?.value === true || 
                 node.data?.output === true;
        });
        
        // Only trigger if not already triggered (prevent spam)
        if (externalTrigger && !data.triggered) {
          updateNodeData(id, { triggered: true });
      }
        // Note: We don't auto-reset when external trigger goes false
        // This preserves the manual trigger behavior
      }
      
    } catch (updateError) {
      console.error(`TriggerOnClick ${id} - Update error:`, updateError);
      const errorMessage = updateError instanceof Error ? updateError.message : 'Unknown error';
      setError(errorMessage);
    }
  },

  // Collapsed state rendering - just the trigger icon
  renderCollapsed: ({ data, error, updateNodeData, id }) => {
    const isTriggered = data.triggered === true;
    
    const handleTrigger = () => {
      updateNodeData(id, { triggered: true });
    };

    const handleReset = () => {
      updateNodeData(id, { triggered: false });
    };

  return (
        <div className="absolute inset-0 flex items-center justify-center">
        {error ? (
          <div className="text-xs text-center text-red-600 break-words">
            {error}
          </div>
        ) : (
          <IconForTrigger 
            isOn={isTriggered} 
            onClick={isTriggered ? handleReset : handleTrigger} 
            size={40} 
          />
        )}
      </div>
    );
  },

  // Expanded state rendering - full UI with buttons
  renderExpanded: ({ data, error, categoryTextTheme, updateNodeData, id }) => {
    const isTriggered = data.triggered === true;
    
    const handleTrigger = () => {
      updateNodeData(id, { triggered: true });
    };

    const handleReset = () => {
      updateNodeData(id, { triggered: false });
    };

    return (
      <div className="flex text-xs flex-col w-full h-[96px] px-1"> {/* 120px total - 24px factory padding */}
        <div className={`font-semibold mb-1 text-center ${categoryTextTheme.primary}`}>
          {error ? (
            <span className="text-red-600 dark:text-red-400">Error</span>
          ) : (
            'Trigger'
          )}
        </div>
        
        {error && (
          <div className="mb-1 p-1 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-300">
            <div className="text-xs">{error}</div>
          </div>
        )}

        <div className="flex-1 flex flex-col items-center justify-center space-y-2">
          {/* Icon */}
          <IconForTrigger 
            isOn={isTriggered} 
            onClick={isTriggered ? handleReset : handleTrigger} 
            size={24} 
          />
          
          {/* Action button */}
          <div 
            className="nodrag nowheel"
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
          {isTriggered ? (
            <button
                className="px-2 py-1 rounded bg-yellow-600 hover:bg-yellow-700 text-white font-bold shadow transition-colors text-xs"
              onClick={handleReset}
                disabled={!!error}
            >
              Reset
            </button>
          ) : (
            <button
                className="px-2 py-1 rounded bg-yellow-500 hover:bg-yellow-600 text-white font-bold shadow transition-colors text-xs"
              onClick={handleTrigger}
                disabled={!!error}
            >
                Trigger
            </button>
          )}
          </div>
          
          {/* Compact status indicator */}
          <div className={`text-xs ${categoryTextTheme.secondary}`}>
            {isTriggered ? 
              <span className="text-yellow-600 dark:text-yellow-400 font-semibold">ON</span> : 
              <span className="text-gray-500">Ready</span>
            }
          </div>
        </div>
    </div>
    );
  },

  // Error recovery data
  errorRecoveryData: {
    triggered: false
}
});

export default TriggerOnClick;
