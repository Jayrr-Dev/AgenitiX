import React from 'react';
import { Position } from '@xyflow/react';
import { createNodeComponent, createTriggeredNodeConfig, type BaseNodeData } from '../factory/NodeFactory';

// ============================================================================
// NODE DATA INTERFACE  
// ============================================================================

interface TestJsonData extends BaseNodeData {
  jsonText: string;
  parsedJson: any;
  parseError: string | null;
  json: any;
}

// ============================================================================
// NODE CONFIGURATION
// ============================================================================

const TestJson = createNodeComponent<TestJsonData>(
  createTriggeredNodeConfig<TestJsonData>({
    nodeType: 'testJson',
    category: 'create', // Blue theme for creation nodes
    displayName: 'Test JSON',
    defaultData: { 
      jsonText: '{"heldText": "Hello from JSON!", "text": "Updated via Vibe Mode"}',
      parsedJson: null,
      parseError: null as string | null,
      json: ''
    },
    
    // Standard text node size
    size: {
      collapsed: {
        width: 'w-[120px]',
        height: 'h-[60px]'
      },
      expanded: {
        width: 'w-[200px]'
      }
    },
    
    // JSON output handle (trigger input will be added automatically)
    handles: [
      { id: 'j', dataType: 'j', position: Position.Right, type: 'source' }
    ],
    
    // Processing logic - parse JSON text (now with trigger support)
    processLogic: ({ data, updateNodeData, id, setError }) => {
      try {
        if (!data.jsonText || data.jsonText.trim() === '') {
          // Only update if values are different
          if (data.parsedJson !== null || data.parseError !== 'Empty JSON text' || data.json !== null) {
            updateNodeData(id, { 
              parsedJson: null, 
              parseError: 'Empty JSON text',
              json: null // Clear JSON output
            });
          }
          // Clear factory error for empty input (not really an error)
          setError(null);
          return;
        }
        
        const parsed = JSON.parse(data.jsonText);
        
        // Only update if values are different
        if (JSON.stringify(data.parsedJson) !== JSON.stringify(parsed) || 
            data.parseError !== null || 
            JSON.stringify(data.json) !== JSON.stringify(parsed)) {
          updateNodeData(id, { 
            parsedJson: parsed, 
            parseError: null,
            json: parsed // Set JSON output for connections
          });
        }
        
        // Clear factory error on successful parse
        setError(null);
        
      } catch (parseError) {
        const errorMessage = parseError instanceof Error ? parseError.message : 'JSON parse error';
        
        // Only update if values are different
        if (data.parsedJson !== null || 
            data.parseError !== errorMessage || 
            data.json !== null) {
          updateNodeData(id, { 
            parsedJson: null, 
            parseError: errorMessage,
            json: null // Clear JSON output on error
          });
        }
        
        // Set factory error to trigger red glow effect
        setError(`JSON Parse Error: ${errorMessage}`);
        console.log(`TestJson ${id}: Setting factory error:`, `JSON Parse Error: ${errorMessage}`);
        
        console.warn(`TestJson ${id}: Parse error:`, errorMessage);
      }
    },
    
    // Collapsed state rendering
    renderCollapsed: ({ data, error }) => (
      <div className="absolute inset-0 flex flex-col items-center justify-center px-2">
        <div className="text-xs font-semibold mb-1">
          {error ? 'Error' : 'JSON'}
        </div>
        {error ? (
          <div className="text-xs text-center text-red-600 break-words overflow-hidden leading-tight max-h-8 overflow-y-auto">
            JSON Parse Error
          </div>
        ) : data.parseError ? (
          <div className="text-xs text-center text-orange-600 break-words overflow-hidden leading-tight">
            Parse Error
          </div>
        ) : data.parsedJson ? (
          <div className="text-xs text-center text-green-600 leading-tight">
            Valid JSON
          </div>
        ) : data.json === '' ? (
          <div className="text-xs text-center text-gray-400 leading-tight">
            Inactive
          </div>
        ) : (
          <div className="text-xs text-center text-gray-500 leading-tight">
            No JSON
          </div>
        )}
      </div>
    ),
    
    // Expanded state rendering - JSON text editor
    renderExpanded: ({ data, error, categoryTextTheme, updateNodeData, id }) => (
      <div className="flex text-xs flex-col w-auto">
        <div className={`font-semibold mb-2 ${categoryTextTheme.primary}`}>
          {error ? 'Error' : 'Test JSON'}
        </div>
        
        <div className="space-y-2">
          <div>
            <label className="block text-xs font-medium mb-1">JSON Text:</label>
            <textarea
              className="w-full text-xs min-h-[80px] px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 font-mono nodrag nowheel"
              value={data.jsonText}
              onChange={(e) => updateNodeData(id, { jsonText: e.target.value })}
              placeholder='{"key": "value"}'
              onWheel={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
            />
          </div>
          
          {/* Quick Examples */}
          <div className="space-y-1">
            <label className="block text-xs font-medium">Quick Examples:</label>
            <div className="grid grid-cols-1 gap-1">
              <button
                className="text-xs p-1 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded hover:bg-blue-100 dark:hover:bg-blue-900/50 text-left"
                onClick={() => updateNodeData(id, { jsonText: '{"heldText": "Hello from JSON!", "text": "Updated via Vibe Mode"}' })}
              >
                Text Update
              </button>
              <button
                className="text-xs p-1 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded hover:bg-green-100 dark:hover:bg-green-900/50 text-left"
                onClick={() => updateNodeData(id, { jsonText: '{"cycleDuration": 1000, "pulseDuration": 200, "maxCycles": 5}' })}
              >
                CyclePulse Config
              </button>
              <button
                className="text-xs p-1 bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded hover:bg-purple-100 dark:hover:bg-purple-900/50 text-left"
                onClick={() => updateNodeData(id, { jsonText: '{"count": 42, "step": 5, "active": true}' })}
              >
                CountInput Config
              </button>
            </div>
          </div>
          
          {/* Parse Status */}
          <div className="text-xs">
            <span className="font-medium">Status: </span>
            {data.parseError ? (
              <span className="text-orange-600 dark:text-orange-400">
                Error: {data.parseError}
              </span>
            ) : data.parsedJson ? (
              <span className="text-green-600 dark:text-green-400">
                Valid JSON ({typeof data.parsedJson === 'object' ? Object.keys(data.parsedJson).length : 0} properties)
              </span>
            ) : (
              <span className="text-gray-500">No JSON</span>
            )}
          </div>
          
          {/* Preview */}
          {data.parsedJson && !data.parseError && (
            <div>
              <label className="block text-xs font-medium mb-1">Preview:</label>
              <div className="text-xs bg-gray-50 dark:bg-gray-800 border rounded px-2 py-1 font-mono max-h-[60px] overflow-y-auto">
                {JSON.stringify(data.parsedJson, null, 2)}
              </div>
            </div>
          )}
        </div>
      </div>
    ),
    
    // Inspector controls for JSON editing
    renderInspectorControls: ({ node, updateNodeData }) => (
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium mb-1">
            JSON Text:
          </label>
          <textarea
            className="w-full rounded border px-2 py-1 text-xs font-mono"
            rows={6}
            value={node.data.jsonText || ''}
            onChange={(e) => updateNodeData(node.id, { jsonText: e.target.value })}
            placeholder='{"key": "value"}'
          />
        </div>
        
        {node.data.parseError && (
          <div className="p-2 bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded">
            <div className="text-xs font-semibold text-orange-700 dark:text-orange-300 mb-1">
              Parse Error:
            </div>
            <div className="text-xs text-orange-600 dark:text-orange-400">
              {node.data.parseError}
            </div>
          </div>
        )}
        
        {node.data.parsedJson && !node.data.parseError && (
          <div className="p-2 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded">
            <div className="text-xs font-semibold text-green-700 dark:text-green-300 mb-1">
              Valid JSON:
            </div>
            <div className="text-xs text-green-600 dark:text-green-400 font-mono">
              {typeof node.data.parsedJson === 'object' ? Object.keys(node.data.parsedJson).length : 0} properties
            </div>
          </div>
        )}
      </div>
    ),
    
    // Error recovery data
    errorRecoveryData: {
      jsonText: '{"heldText": "Hello from JSON!", "text": "Updated via Vibe Mode"}',
      parsedJson: null,
      parseError: null,
      json: ''
    }
  })
);

export default TestJson; 