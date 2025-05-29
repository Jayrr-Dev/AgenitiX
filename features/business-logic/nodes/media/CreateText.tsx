// nodes/CreateText.tsx
'use client'

/* -------------------------------------------------------------------------- */
/*  CreateText - Converted to NodeFactory                                    */
/*  – Creates text output with optional trigger input                        */
/* -------------------------------------------------------------------------- */

import React, { useRef } from 'react';
import { Position } from '@xyflow/react';
import { createNodeComponent, type BaseNodeData } from '../factory/NodeFactory';
import { getSingleInputValue, isTruthyValue } from '../utils/nodeUtils';

// ============================================================================
// NODE DATA INTERFACE  
// ============================================================================

interface CreateTextData extends BaseNodeData {
  text: string;
  heldText: string;
}

// ============================================================================
// NODE CONFIGURATION
// ============================================================================

const CreateText = createNodeComponent<CreateTextData>({
  nodeType: 'createText',
  category: 'create', // This will give it blue styling
  displayName: 'Create Text',
  defaultData: { 
    text: '',
    heldText: ''
  },
  
  // Define handles (boolean trigger input -> string output)
  handles: [
    { id: 'b', dataType: 'b', position: Position.Left, type: 'target' },
    { id: 's', dataType: 's', position: Position.Right, type: 'source' }
  ],
  
  // Processing logic - preserve the exact original trigger logic
  processLogic: ({ data, connections, nodesData, updateNodeData, id, setError }) => {
    try {
      // Filter for trigger connections (boolean handle 'b')
      const triggerConnections = connections.filter(c => c.targetHandle === 'b');
      
      // Get trigger value from connected trigger nodes
      const triggerValue = getSingleInputValue(nodesData);
      const isTriggered = isTruthyValue(triggerValue);
      
      // Get the held text (what user has typed)
      const outputText = typeof data.heldText === 'string' ? data.heldText : '';
      
      // Validate text length (prevent memory issues)
      if (outputText.length > 100000) {
        throw new Error('Text too long (max 100,000 characters)');
      }
      
      // Output logic: output text if no trigger connected OR trigger is active
      const finalOutput = triggerConnections.length === 0 || isTriggered ? outputText : '';
      
      updateNodeData(id, { 
        text: finalOutput
      });
      
    } catch (updateError) {
      console.error(`CreateText ${id} - Update error:`, updateError);
      const errorMessage = updateError instanceof Error ? updateError.message : 'Unknown error';
      setError(errorMessage);
      
      // Try to update with error state
        updateNodeData(id, { 
        text: ''
      });
    }
  },

  // Collapsed state rendering with inline text editing
  renderCollapsed: ({ data, error, updateNodeData, id }) => {
    const currentText = typeof data.heldText === 'string' ? data.heldText : '';
    const previewText = currentText.length > 20 ? currentText.substring(0, 20) + '...' : currentText;

  return (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-2">
        <div className="text-xs font-semibold mt-1 mb-1">
            {error ? 'Error' : 'Create Text'}
        </div>
        {error ? (
          <div className="text-xs text-center break-words">
            {error}
          </div>
        ) : (
          <div 
            className="nodrag nowheel w-full flex-1 flex items-center justify-center"
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <CreateTextInput data={data} updateNodeData={updateNodeData} id={id} />
          </div>
        )}
        </div>
    );
  },

  // Expanded state rendering with full text editing
  renderExpanded: ({ data, error, categoryTextTheme, updateNodeData, id }) => (
    <div className="flex text-xs flex-col w-auto">
      <div className={`font-semibold mb-2 flex items-center justify-between ${categoryTextTheme.primary}`}>
            <span>{error ? 'Error' : 'Create Text'}</span>
            {error && (
              <span className="text-xs text-red-600 dark:text-red-400">● {error}</span>
            )}
          </div>
          
          {error && (
            <div className="mb-2 p-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-300">
              <div className="font-semibold mb-1">Error Details:</div>
              <div className="mb-2">{error}</div>
            </div>
          )}
          
          <div 
        className="nodrag nowheel"
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
        <CreateTextExpanded data={data} error={error} categoryTextTheme={categoryTextTheme} updateNodeData={updateNodeData} id={id} />
      </div>
    </div>
  ),

  // Error recovery data
  errorRecoveryData: {
    text: '',
    heldText: ''
  }
});

// ============================================================================
// HELPER COMPONENTS FOR TEXT EDITING
// ============================================================================

// Collapsed text input component
const CreateTextInput = ({ data, updateNodeData, id }: { 
  data: CreateTextData; 
  updateNodeData: (id: string, data: Partial<CreateTextData>) => void; 
  id: string; 
}) => {
  const currentText = typeof data.heldText === 'string' ? data.heldText : '';
  
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    try {
      const newText = e.target.value;
      
      // Validate input
      if (newText.length > 100000) {
        return; // Just ignore if too long
      }
      
      // Update held text via factory's updateNodeData
      updateNodeData(id, { heldText: newText });
    } catch (inputError) {
      console.error('CreateText - Input error:', inputError);
    }
  };

  return (
    <textarea
      className="w-full h-8 px-2 py-2 mb-2 text-xs text-center rounded border bg-transparent placeholder-opacity-60 resize-none focus:outline-none focus:ring-1 focus:border-transparent transition-colors overflow-y-auto border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-100 focus:ring-blue-500"
      value={currentText}
      onChange={handleTextChange}
      placeholder="Enter text..."
      style={{ 
        lineHeight: '1.2',
        fontFamily: 'inherit'
      }}
      onFocus={(e) => e.target.select()}
      onWheel={(e) => e.stopPropagation()}
    />
  );
};

// Expanded text input component  
const CreateTextExpanded = ({ data, error, categoryTextTheme, updateNodeData, id }: { 
  data: CreateTextData; 
  error: string | null; 
  categoryTextTheme: any; 
  updateNodeData: (id: string, data: Partial<CreateTextData>) => void; 
  id: string; 
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const currentText = typeof data.heldText === 'string' ? data.heldText : '';
  
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    try {
      const newText = e.target.value;
      
      // Validate input
      if (newText.length > 100000) {
        return; // Just ignore if too long
      }
      
      // Update held text via factory's updateNodeData
      updateNodeData(id, { heldText: newText });
    } catch (inputError) {
      console.error('CreateText - Input error:', inputError);
    }
  };

  return (
            <textarea
              ref={textareaRef}
      className={`w-full text-xs min-h-[65px] px-3 py-2 rounded border bg-white dark:bg-blue-800 placeholder-blue-400 dark:placeholder-blue-500 resize-both focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                error 
          ? 'border-red-300 dark:border-red-700 text-red-900 dark:text-red-100 focus:ring-red-500'
                  : `${categoryTextTheme.border} ${categoryTextTheme.primary} ${categoryTextTheme.focus}`
              }`}
              value={currentText}
              onChange={handleTextChange}
              placeholder={error ? "Fix error to continue editing..." : "Enter your text here..."}
              disabled={!!error}
              style={{ 
                lineHeight: '1.4',
                fontFamily: 'inherit'
              }}
            />
  );
};

export default CreateText;
