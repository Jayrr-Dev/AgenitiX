// features/business-logic/nodes/main/LogicNot.tsx
'use client'

import React from 'react';
import { Position } from '@xyflow/react';
import { createNodeComponent, type BaseNodeData } from '../factory/NodeFactory';
import { getSingleInputValue, isTruthyValue } from '../utils/nodeUtils';

// ============================================================================
// NODE DATA INTERFACE  
// ============================================================================

interface LogicNotData extends BaseNodeData {
  value: boolean;
  inputCount: number;
  triggered: boolean;
}

// ============================================================================
// NODE CONFIGURATION
// ============================================================================

const LogicNot = createNodeComponent<LogicNotData>({
  nodeType: 'logicNot',
  category: 'logic', // Purple theme for logic nodes
  displayName: 'Logic NOT',
  defaultData: { 
    value: false,
    inputCount: 0,
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
  
  // Processing logic - implement NOT gate with connection pruning
  processLogic: ({ data, connections, nodesData, updateNodeData, id, setError }) => {
    try {
      // Filter for boolean input connections
      const boolInputConnections = connections.filter(c => c.targetHandle === 'b');
      
      // Extract input value using safe utility
      const inputValue = getSingleInputValue(nodesData);
      const isTruthy = isTruthyValue(inputValue);
      
      // Negate the input value (NOT logic)
      const negated = !isTruthy;
      
      // Update node data with computed values
      updateNodeData(id, { 
        value: negated,
        triggered: negated, // Output the negated value
        inputCount: boolInputConnections.length
      });
      
      // Note: Connection pruning would need to be handled at a higher level
      // For now, we'll just track the input count and let the factory handle connections
      
    } catch (updateError) {
      console.error(`LogicNot ${id} - Update error:`, updateError);
      const errorMessage = updateError instanceof Error ? updateError.message : 'Unknown error';
      setError(errorMessage);
      
      // Reset to safe state
      updateNodeData(id, { 
        value: false,
        triggered: false,
        inputCount: 0
      });
    }
  },

  // Collapsed state rendering - just the NOT text
  renderCollapsed: ({ data, error }) => {
    // Use the current data state for visual feedback
    const inputCount = data.inputCount || 0;
    const hasInput = inputCount > 0;
    const outputValue = data.value; // The NOT result
    
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        {error ? (
          <div className="text-xs text-center text-red-600 break-words">
            {error}
          </div>
        ) : (
          <div className="w-16 h-16 flex items-center justify-center">
            <div className={`text-lg font-bold ${outputValue ? 'text-purple-700 dark:text-purple-300' : 'text-purple-400 dark:text-purple-600'}`}>
              NOT
            </div>
          </div>
        )}
      </div>
    );
  },

  // Expanded state rendering - detailed info display
  renderExpanded: ({ data, error, categoryTextTheme }) => (
    <div className="flex text-xs flex-col w-full h-[96px] px-1"> {/* 120px total - 24px factory padding */}
      <div className={`font-semibold mb-2 text-center ${categoryTextTheme.primary}`}>
        {error ? (
          <span className="text-red-600 dark:text-red-400">Error</span>
        ) : (
          'NOT Gate'
        )}
      </div>
      
      {error && (
        <div className="mb-1 p-1 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-300">
          <div className="text-xs">{error}</div>
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center space-y-2">
        {/* Output value display */}
        <div className={`text-xs ${categoryTextTheme.primary}`}>
          Output: <span className="font-mono font-bold">{String(data.value)}</span>
        </div>
        
        {/* Input connection status */}
        <div className={`text-xs ${categoryTextTheme.secondary}`}>
          Input: {data.inputCount}/1
        </div>
        
        {/* Connection status indicator */}
        <div className={`text-xs ${categoryTextTheme.secondary}`}>
          {data.inputCount === 0 ? (
            <span className="text-gray-500">No input</span>
          ) : data.inputCount === 1 ? (
            <span className="text-green-600 dark:text-green-400">Connected</span>
          ) : (
            <span className="text-yellow-600 dark:text-yellow-400">Pruning...</span>
          )}
        </div>
      </div>
    </div>
  ),

  // Error recovery data
  errorRecoveryData: {
    value: false,
    triggered: false,
    inputCount: 0
  }
});

export default LogicNot; 