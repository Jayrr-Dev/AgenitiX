// nodes/TurnToText.tsx
'use client'

/* -------------------------------------------------------------------------- */
/*  TurnToText - Converted to NodeFactory                                     */
/*  – Converts any input value to text string                                 */
/* -------------------------------------------------------------------------- */

import React from 'react';
import { Position } from '@xyflow/react';
import { createNodeComponent, type BaseNodeData } from '../factory/NodeFactory';
import { getSingleInputValue } from '../utils/nodeUtils';

// ============================================================================
// NODE DATA INTERFACE
// ============================================================================

interface TurnToTextData extends BaseNodeData {
  text: string;
  originalValue: unknown;
}

// ============================================================================
// NODE CONFIGURATION
// ============================================================================

const TurnToText = createNodeComponent<TurnToTextData>({
  nodeType: 'turnToText',
  category: 'turn', // This will give it cyan styling
  displayName: 'Turn To Text',
  defaultData: { 
    text: '',
    originalValue: undefined
  },
  
  // Define handles (any input -> string output)
  handles: [
    { id: 'x', dataType: 'x', position: Position.Left, type: 'target' },
    { id: 's', dataType: 's', position: Position.Right, type: 'source' }
  ],
  
  // Processing logic - convert any input to string
  processLogic: ({ data, connections, nodesData, updateNodeData, id, setError }) => {
    try {
      // Get input value from connected nodes
      const inputValue = getSingleInputValue(nodesData);
      
      // Convert any input to string
      let stringValue = '';
      
      if (inputValue !== undefined) {
        // Handle special number values
        if (typeof inputValue === 'number') {
          if (Number.isNaN(inputValue)) {
            stringValue = 'NaN';
          } else if (!Number.isFinite(inputValue)) {
            stringValue = inputValue > 0 ? 'Infinity' : '-Infinity';
          } else {
            stringValue = String(inputValue);
          }
        }
        // Handle objects (including arrays)
        else if (typeof inputValue === 'object' && inputValue !== null) {
          try {
            // Try to stringify with proper formatting
            stringValue = JSON.stringify(inputValue, (key, value) => {
              // Handle BigInt
              if (typeof value === 'bigint') {
                return value.toString() + 'n';
              }
              // Handle Date objects
              if (value instanceof Date) {
                return value.toISOString();
              }
              // Handle RegExp objects
              if (value instanceof RegExp) {
                return value.toString();
              }
              // Handle Error objects
              if (value instanceof Error) {
                return {
                  name: value.name,
                  message: value.message,
                  stack: value.stack
                };
              }
              return value;
            }, 2);
          } catch (jsonError) {
            // If JSON.stringify fails (e.g., circular reference), use a fallback
            if (jsonError instanceof Error && jsonError.message.includes('circular')) {
              stringValue = '[Circular Object]';
            } else {
              stringValue = '[Complex Object]';
            }
          }
        }
        // Handle null
        else if (inputValue === null) {
          stringValue = 'null';
        }
        // Handle all other primitive types
        else {
          stringValue = String(inputValue);
        }
      }

      // Update node data with converted text
      updateNodeData(id, { 
        text: stringValue,
        originalValue: inputValue
      });
      
    } catch (conversionError) {
      const errorMessage = conversionError instanceof Error ? conversionError.message : 'Conversion error';
      setError(errorMessage);
      
      // Reset to safe state
      updateNodeData(id, { 
        text: '',
        originalValue: undefined
      });
    }
  },

  // Collapsed state rendering
  renderCollapsed: ({ data, error }) => {
    const previewText = data.text.length > 20 ? data.text.substring(0, 20) + '...' : data.text;
    
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center px-2">
        <div className="text-xs font-semibold mb-1">
          {error ? 'Error' : 'To Text'}
        </div>
        <div className="text-xs text-center break-words">
          {error ? error : (data.text ? `"${previewText}"` : 'Connect input')}
        </div>
      </div>
    );
  },

  // Expanded state rendering
  renderExpanded: ({ data, error, categoryTextTheme }) => (
    <div className="flex text-xs flex-col w-auto">
      <div className={`font-semibold mb-2 ${categoryTextTheme.primary}`}>
        {error ? 'Error' : 'Text Converter'}
      </div>
      
      {error && (
        <div className="mb-2 p-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-300">
          <div className="font-semibold mb-1">Conversion Error:</div>
          <div>{error}</div>
        </div>
      )}
      
      <div className="space-y-2">
        <div>
          <label className="block text-xs font-medium mb-1">Original Value Type:</label>
          <div className="text-xs bg-gray-50 dark:bg-gray-800 border rounded px-2 py-1">
            {data.originalValue === undefined ? 'undefined' : 
             data.originalValue === null ? 'null' : 
             typeof data.originalValue}
          </div>
        </div>
        
        <div>
          <label className="block text-xs font-medium mb-1">Converted Text:</label>
          <div className="min-h-[65px] text-xs font-mono break-all bg-white dark:bg-gray-700 border rounded px-2 py-2 max-h-[100px] overflow-y-auto">
            {data.text || (
              <span className="italic opacity-60">
                No input connected
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  ),

  // Error recovery data
  errorRecoveryData: {
    text: '',
    originalValue: undefined
  }
});

export default TurnToText;