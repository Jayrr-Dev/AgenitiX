import React from 'react';
import { Position } from '@xyflow/react';
import { createNodeComponent, createTextNodeConfig, createTextInputControl, type BaseNodeData } from '../factory/NodeFactory';

// ============================================================================
// NODE DATA INTERFACE
// ============================================================================

interface TestErrorData extends BaseNodeData {
  text: string;
  label: string;
}

// ============================================================================
// NODE CONFIGURATION
// ============================================================================

const TestError = createNodeComponent<TestErrorData>({
  nodeType: 'testError',
  category: 'test',
  displayName: 'TestError',
  defaultData: { 
    text: 'Test Error Node', 
    label: 'Error Test'
  },
  
  // Define handles explicitly
  handles: [
    { id: 'b', dataType: 'b', position: Position.Left, type: 'target' },
    { id: 's', dataType: 's', position: Position.Right, type: 'source' }
  ],
  
  // Simple processing logic - just pass through the label
  processLogic: ({ data, updateNodeData, id }) => {
    // For now, just update the text output with the label
    const outputText = data.label || 'Test Error Node';
    updateNodeData(id, { text: outputText });
  },

  // Collapsed state rendering
  renderCollapsed: ({ data, error }) => (
    <div className="absolute inset-0 flex flex-col items-center justify-center px-2">
      <div className="text-xs font-semibold mb-1">
        {error ? 'Error' : 'Test Error'}
      </div>
      <div className="text-xs text-center break-words">
        {error ? error : (data.label || 'Test Node')}
      </div>
    </div>
  ),

  // Expanded state rendering
  renderExpanded: ({ data, error, categoryTextTheme }) => (
    <div className="flex text-xs flex-col w-auto">
      <div className={`font-semibold mb-2 ${categoryTextTheme.primary}`}>
        {error ? 'Error State' : 'Test Error Node'}
      </div>
      
      {error ? (
        <div className="min-h-[65px] text-xs break-all bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded px-3 py-2 text-red-700 dark:text-red-300">
          {error}
        </div>
      ) : (
        <div className="min-h-[65px] text-xs break-all bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-3 py-2">
          <div className="mb-2">
            <strong>Label:</strong> {data.label || 'Test Node'}
          </div>
          <div>
            <strong>Output:</strong> {data.text || 'No output'}
          </div>
        </div>
      )}
    </div>
  ),

  // Inspector controls using NodeFactory helper
  renderInspectorControls: createTextInputControl('Label', 'label', 'Enter node label...'),

  // Error recovery data
  errorRecoveryData: {
    text: 'Test Error Node',
    label: 'Error Test'
  }
});

export default TestError; 