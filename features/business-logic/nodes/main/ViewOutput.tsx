// nodes/ViewOutput.tsx
'use client'

/* -------------------------------------------------------------------------- */
/*  ViewOutput - Converted to NodeFactory                                    */
/*  – Displays values from connected nodes with type indicators               */
/* -------------------------------------------------------------------------- */

import React from 'react';
import { Position } from '@xyflow/react';
import { createNodeComponent, type BaseNodeData } from '../factory/NodeFactory';
import { extractNodeValue, safeStringify } from '../utils/nodeUtils';

// ============================================================================
// NODE DATA INTERFACE  
// ============================================================================

interface ViewOutputData extends BaseNodeData {
  displayedValues: Array<{
    type: string;
    content: any;
    id: string;
  }>;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Helper function to get data type information and colors
const getDataTypeInfo = (content: any) => {
  if (typeof content === 'string') return { type: 's', color: '#3b82f6', label: 'string' };
  if (typeof content === 'number') return { type: 'n', color: '#f59e42', label: 'number' };
  if (typeof content === 'boolean') return { type: 'b', color: '#10b981', label: 'boolean' };
  if (typeof content === 'bigint') return { type: 'N', color: '#a21caf', label: 'bigint' };
  if (Array.isArray(content)) return { type: 'a', color: '#f472b6', label: 'array' };
  if (content === null) return { type: '∅', color: '#ef4444', label: 'null' };
  if (content === undefined) return { type: 'u', color: '#d1d5db', label: 'undefined' };
  if (typeof content === 'symbol') return { type: 'S', color: '#eab308', label: 'symbol' };
  if (typeof content === 'object') return { type: 'j', color: '#6366f1', label: 'object' };
  return { type: 'x', color: '#6b7280', label: 'any' };
};

// Helper function to format content for display
const formatContent = (content: any): string => {
  if (typeof content === 'string') return content;
  if (typeof content === 'number') {
    if (Number.isNaN(content)) return 'NaN';
    if (!Number.isFinite(content)) return content > 0 ? 'Infinity' : '-Infinity';
    return content.toString();
  }
  if (typeof content === 'boolean') return content ? 'true' : 'false';
  if (typeof content === 'bigint') return content.toString() + 'n';
  try {
    return safeStringify(content);
  } catch {
    return String(content);
  }
};

// ============================================================================
// NODE CONFIGURATION
// ============================================================================

const ViewOutput = createNodeComponent<ViewOutputData>({
  nodeType: 'viewOutput',
  category: 'test', // Test/debug theme for utility nodes
  displayName: 'View Output',
  defaultData: { 
    displayedValues: []
  },
  
  // Custom size configuration for 120x120 collapsed, 180x180 expanded
  size: {
    collapsed: {
      width: 'w-[120px]',
      height: 'h-[120px]'
    },
    expanded: {
      width: 'w-[180px]'
    }
  },
  
  // Define handles (accepts any input type)
  handles: [
    { id: 'x', dataType: 'x', position: Position.Left, type: 'target' }
  ],
  
  // Processing logic - extract and format values from connected nodes
  processLogic: ({ data, connections, nodesData, updateNodeData, id, setError }) => {
    try {
      // Extract values from connected nodes using safe extraction
      const values = nodesData
        .map((node) => {
          // Special handling for TestInput nodes - use 'value' property directly
          let extractedValue;
          if (node.type === 'testInput') {
            extractedValue = node.data?.value;
          } else {
            extractedValue = extractNodeValue(node.data);
          }
          
          return {
            type: node.type,
            content: extractedValue,
            id: node.id
          };
        })
        .filter(item => {
          // Allow all values except undefined and null
          // This ensures false, 0, empty string, etc. are all displayed
          return item.content !== undefined && item.content !== null;
        });

      updateNodeData(id, { 
        displayedValues: values
      });
      
    } catch (updateError) {
      console.error(`ViewOutput ${id} - Update error:`, updateError);
      const errorMessage = updateError instanceof Error ? updateError.message : 'Unknown error';
      setError(errorMessage);
      
      // Try to update with error state
      updateNodeData(id, { 
        displayedValues: []
      });
    }
  },

  // Collapsed state rendering - show preview of values
  renderCollapsed: ({ data, error }) => {
    const values = data.displayedValues || [];
    
    return (
      <div className="absolute inset-0 flex flex-col px-2 py-2 overflow-hidden">
        <div className="flex items-center justify-center mb-1">
          <div className="text-xs font-semibold text-gray-900 dark:text-gray-100">
            {error ? 'Error' : '📤 View Output'}
          </div>
        </div>
        
        {error ? (
          <div className="text-xs text-center text-red-600 dark:text-red-400 break-words flex-1 flex items-center justify-center">
            {error}
          </div>
        ) : values.length ? (
          <div className="space-y-1 flex-1 overflow-hidden">
            {values.map((item) => (
              <div 
                key={item.id}
                className="bg-white/50 dark:bg-black/20 rounded px-1 py-0.5 overflow-hidden"
                style={{ 
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}
              >
                {formatContent(item.content)}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs italic text-gray-600 dark:text-gray-400 flex-1 flex items-center justify-center text-center">
            Connect nodes
          </div>
        )}
      </div>
    );
  },

  // Expanded state rendering - full UI with type indicators
  renderExpanded: ({ data, error, categoryTextTheme }) => {
    const values = data.displayedValues || [];
    
    return (
      <div className="flex text-xs flex-col w-full h-[180px] overflow-hidden">
        <div className={`font-semibold mb-2 flex items-center justify-between ${categoryTextTheme.primary}`}>
          <span>{error ? 'Error' : 'View Output'}</span>
          {error ? (
            <span className="text-xs text-red-600 dark:text-red-400">● {error}</span>
          ) : (
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {values.length} input{values.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        
        {error && (
          <div className="mb-2 p-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-300">
            <div className="font-semibold mb-1">Error Details:</div>
            <div className="mb-2">{error}</div>
          </div>
        )}

        {values.length ? (
          <div 
            className="nodrag space-y-2 flex-1 overflow-y-auto max-h-[140px] pr-1"
            onWheel={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            style={{ touchAction: 'pan-y' }}
          >
            {values.map((item) => {
              const typeInfo = getDataTypeInfo(item.content);
              return (
                <div 
                  key={item.id}
                  className="bg-white/50 dark:bg-black/20 rounded px-2 py-2"
                >
                  {/* Type indicator with colored icon */}
                  <div className="flex items-center gap-2 mb-1">
                    <div 
                      className="w-3 h-3 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: typeInfo.color }}
                      title={typeInfo.label}
                    >
                      {typeInfo.type}
                    </div>
                    <span className={`text-xs font-medium ${categoryTextTheme.secondary}`}>
                      {typeInfo.label}
                    </span>
                  </div>
                  
                  {/* Content */}
                  <div className={`text-xs font-mono break-all ${categoryTextTheme.primary}`}>
                    {formatContent(item.content)}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={`text-xs italic ${categoryTextTheme.secondary} flex-1 flex items-center justify-center text-center`}>
            {error ? 'Fix error to view outputs' : 'Connect any node with output'}
          </div>
        )}
      </div>
    );
  },

  // Error recovery data
  errorRecoveryData: {
    displayedValues: []
  }
});

export default ViewOutput;
