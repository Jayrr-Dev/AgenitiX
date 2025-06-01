// nodes/TurnToUppercase.tsx
'use client'

/* -------------------------------------------------------------------------- */
/*  TurnToUppercase - Converted to NodeFactory                               */
/*  – Converts input text to UPPERCASE                                        */
/* -------------------------------------------------------------------------- */

import React from 'react';
import { Position } from '@xyflow/react';
import { createNodeComponent, createTextNodeConfig, createTextInputControl, type BaseNodeData } from '../factory/NodeFactory';
import { extractNodeValue } from '../utils/nodeUtils';
import type { AgenNode } from '../../flow-editor/types';

// ============================================================================
// NODE DATA INTERFACE
// ============================================================================

interface TurnToUppercaseData extends BaseNodeData {
  text: string;
}

// ============================================================================
// NODE CONFIGURATION
// ============================================================================

const TurnToUppercase = createNodeComponent<TurnToUppercaseData>({
  nodeType: 'turnToUppercase',
  category: 'turn', // This will give it cyan styling
  displayName: 'Turn To Uppercase',
  defaultData: { 
    text: ''
  },
  
  // Define handles (string input + boolean trigger -> string output)
  handles: [
    { id: 's', dataType: 's', position: Position.Left, type: 'target' },
    { id: 'b', dataType: 'b', position: Position.Bottom, type: 'target' },
    { id: 's', dataType: 's', position: Position.Right, type: 'source' }
  ],
  
  // Processing logic - preserve the exact original logic + add trigger support
  processLogic: ({ data, connections, nodesData, updateNodeData, id }) => {
    // Check trigger state first
    const triggerConnections = connections.filter(c => c.targetHandle === 'b');
    const isTriggered = triggerConnections.length === 0 || // No trigger = always active
      nodesData.some(node => 
        node.data?.triggered === true || 
        node.data?.value === true || 
        node.data?.output === true
      );
    
    // If not triggered, clear output and return
    if (!isTriggered) {
      updateNodeData(id, { text: '' });
      return;
    }
    
    // Filter for connections to our string input handle ('s') or default connections
    const stringConnections = connections.filter(c => 
      c.targetHandle === 's' || 
      c.targetHandle === null || 
      c.targetHandle === undefined ||
      !c.targetHandle
    );

    // Get text from connected nodes
    const texts = nodesData
      .map((node: AgenNode) => {
        // Special handling for testInput nodes - use 'value' property directly
        if (node.type === 'testInput') {
          const value = node.data?.value;
          return typeof value === 'string' ? value : String(value ?? '');
        }
        
        // Use extractNodeValue for consistent value extraction from other nodes
        const extractedValue = extractNodeValue(node.data);
        return typeof extractedValue === 'string' ? extractedValue : String(extractedValue ?? '');
      })
      .filter((text): text is string => Boolean(text));

    // If no valid text nodes are connected, use default text
    const defaultText = texts.length === 0 ? 'HELLO' : texts.join(' ');
    const transformed = defaultText.toUpperCase();

    // Update node data with the transformed text
    updateNodeData(id, { text: transformed });
  },

  // Collapsed state rendering
  renderCollapsed: ({ data, error }) => {
    const previewText = data.text.length > 15 ? data.text.substring(0, 15) + '...' : data.text;
    
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center px-2">
        <div className="text-xs font-semibold mb-1">
          {error ? 'Error' : 'Uppercase'}
        </div>
        <div className="text-xs text-center break-words">
          {error ? error : (data.text ? `"${previewText}"` : 'Connect text')}
        </div>
      </div>
    );
  },

  // Expanded state rendering
  renderExpanded: ({ data, error, categoryTextTheme }) => (
    <div className="flex text-xs mb-1 flex-col w-auto">
      <div className={`font-semibold mb-2 flex items-center justify-between ${categoryTextTheme.primary}`}>
        <span>{error ? 'Error State' : 'Uppercase Node'}</span>
      </div>

      {error ? (
        <div className="min-h-[65px] text-xs break-all bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded px-3 py-2 text-red-700 dark:text-red-300">
          {error}
        </div>
      ) : (
        <div className="min-h-[65px] text-xs font-mono break-all bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-3 py-2 overflow-hidden">
          {data.text || (
            <span className="italic opacity-60">
              Connect text nodes
            </span>
          )}
        </div>
      )}
    </div>
  ),

  // Optional: Add inspector controls (could add custom options like case options, etc.)
  renderInspectorControls: createTextInputControl('Custom Label', 'customLabel', 'Optional custom label...'),

  // Error recovery data
  errorRecoveryData: {
    text: ''
  }
});

export default TurnToUppercase;
