import React, { useMemo } from 'react';
import { NodeType } from '../types';

interface NodeOutputProps {
  output: string | null;
  nodeType: NodeType;
}

export const NodeOutput: React.FC<NodeOutputProps> = ({ output, nodeType }) => {
  
  // ENHANCED REGISTRY INTEGRATION - Get additional metadata
  const registryMetadata = useMemo(() => {
    try {
      // Lazy import to avoid circular dependency
      const { ENHANCED_NODE_REGISTRY } = require('../../../nodes/nodeRegistry');
      return ENHANCED_NODE_REGISTRY[nodeType] || null;
    } catch (error) {
      // Fallback if registry unavailable
      return null;
    }
  }, [nodeType]);

  // ENHANCED OUTPUT FORMATTING
  const formatOutput = useMemo(() => {
    if (output === null || output === undefined) {
      return { 
        text: '—', 
        color: 'text-gray-400 italic',
        type: 'null'
      };
    }

    // Try to parse and detect data type
    let parsedValue: any = output;
    let detectedType = 'string';
    
    try {
      // Attempt JSON parsing for complex types
      if (typeof output === 'string' && (output.startsWith('{') || output.startsWith('['))) {
        parsedValue = JSON.parse(output);
        detectedType = Array.isArray(parsedValue) ? 'array' : 'object';
      } else if (output === 'true' || output === 'false') {
        parsedValue = output === 'true';
        detectedType = 'boolean';
      } else if (!isNaN(Number(output)) && output.trim() !== '') {
        parsedValue = Number(output);
        detectedType = 'number';
      }
    } catch {
      // Keep as string if parsing fails
      detectedType = 'string';
    }

    // TYPE-SPECIFIC FORMATTING AND COLORS
    switch (detectedType) {
      case 'boolean':
        return {
          text: String(parsedValue),
          color: parsedValue ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
          type: 'boolean',
          icon: parsedValue ? '✅' : '❌'
        };
      
      case 'number':
        return {
          text: String(parsedValue),
          color: 'text-orange-600 dark:text-orange-400',
          type: 'number',
          icon: '🔢'
        };
      
      case 'array':
        return {
          text: `[${parsedValue.length} items]`,
          color: 'text-pink-600 dark:text-pink-400',
          type: 'array',
          icon: '📊',
          fullText: JSON.stringify(parsedValue, null, 2)
        };
      
      case 'object':
        const keys = Object.keys(parsedValue);
        return {
          text: `{${keys.length} properties}`,
          color: 'text-indigo-600 dark:text-indigo-400',
          type: 'object',
          icon: '📋',
          fullText: JSON.stringify(parsedValue, null, 2)
        };
      
      default:
        // REGISTRY-BASED SPECIAL STYLING
        if (registryMetadata?.ui?.branding?.textColor) {
          return {
            text: String(output),
            color: registryMetadata.ui.branding.textColor,
            type: 'string',
            icon: registryMetadata.ui.icon || '📝'
          };
        }
        
        // NODE TYPE SPECIFIC STYLING (LEGACY SUPPORT)
        if (nodeType === 'turnToUppercase') {
          return {
            text: String(output),
            color: 'text-sky-600 dark:text-sky-400',
            type: 'string',
            icon: '🔤'
          };
        }
        
        return {
          text: String(output),
          color: 'text-gray-700 dark:text-gray-300',
          type: 'string',
          icon: '📝'
        };
    }
  }, [output, nodeType, registryMetadata]);

  return (
    <div className="text-xs space-y-1">
      <div className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
        <span>Output:</span>
        {formatOutput.icon && (
          <span className="text-sm" title={`Type: ${formatOutput.type}`}>
            {formatOutput.icon}
          </span>
        )}
      </div>
      
      <div className={`font-mono break-all bg-gray-100 dark:bg-gray-800 rounded-md px-3 py-2 border ${formatOutput.color}`}>
        {formatOutput.text}
      </div>
      
      {/* EXPANDED VIEW FOR COMPLEX TYPES */}
      {formatOutput.fullText && (
        <details className="mt-2">
          <summary className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
            View full {formatOutput.type}
          </summary>
          <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-900 rounded border text-xs font-mono overflow-auto max-h-32">
            <pre className="whitespace-pre-wrap text-gray-600 dark:text-gray-400">
              {formatOutput.fullText}
            </pre>
          </div>
        </details>
      )}
    </div>
  );
}; 