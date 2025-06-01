'use client';

// ============================================================================
// FAST + RELIABLE CREATE TEXT - EXAMPLE IMPLEMENTATION
// ============================================================================

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { createFastReliableNode } from './FastReliableNodeBase';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface FastReliableCreateTextData {
  text: string;
  isActive: boolean;
  prefix?: string;
  maxLength?: number;
  isExpanded?: boolean;
  // Fast + Reliable specific fields
  output?: string;
  _validated?: boolean;
}

// ============================================================================
// FAST + RELIABLE COMPUTATION LOGIC  
// ============================================================================

function computeCreateText(
  data: FastReliableCreateTextData, 
  activeInputs: Record<string, any>
): Partial<FastReliableCreateTextData> {
  // INPUT PROCESSING: Handle active inputs
  let currentText = data.text || '';
  
  // Apply inputs from active upstream nodes
  if (activeInputs.default) {
    currentText = String(activeInputs.default);
  }

  // FAST VALIDATION: Real-time validation
  const isTextValid = currentText.length > 0;
  const exceedsMaxLength = data.maxLength && currentText.length > data.maxLength;
  
  // COMPUTED OUTPUT: Build final output
  let computedOutput = currentText;
  
  // Apply prefix if configured
  if (data.prefix && isTextValid) {
    computedOutput = `${data.prefix}${currentText}`;
  }

  // Apply length constraints
  if (exceedsMaxLength) {
    computedOutput = computedOutput.substring(0, data.maxLength!);
  }

  // ACTIVATION LOGIC: Fast activation decision
  const shouldBeActive = isTextValid && computedOutput.length > 0;

  return {
    text: computedOutput,
    output: computedOutput,
    isActive: shouldBeActive,
    _validated: !exceedsMaxLength
  };
}

// ============================================================================
// FAST + RELIABLE CREATE TEXT RENDERER WITH CATEGORY THEMING
// ============================================================================

const FastReliableCreateTextRenderer = ({
  data,
  isExpanded,
  isActive,
  onUpdate,
  onToggle,
  error,
  categoryBaseClasses,
  categoryButtonTheme,
  categoryTextTheme,
  nodeStyleClasses,
  buttonTheme,
  textTheme
}: {
  data: FastReliableCreateTextData;
  isExpanded: boolean;
  isActive: boolean;
  onUpdate: (updates: Partial<FastReliableCreateTextData>) => void;
  onToggle: () => void;
  error?: string;
  // CATEGORY THEMING PROPS
  categoryBaseClasses: {
    background: string;
    border: string;
    textPrimary: string;
    textSecondary: string;
  };
  categoryButtonTheme: string;
  categoryTextTheme: {
    primary: string;
    secondary: string;
    border: string;
    focus: string;
  };
  nodeStyleClasses: string;
  buttonTheme: string;
  textTheme: {
    primary: string;
    secondary: string;
    border: string;
    focus: string;
  };
}) => {
  // Use proper theming based on state
  const currentTextTheme = error ? textTheme : categoryTextTheme;
  const currentButtonTheme = error || isActive ? buttonTheme : categoryButtonTheme;
  
  return (
    <>
      {/* INPUT HANDLE */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: isActive ? '#10B981' : '#6B7280',
          transition: 'all 0.1s ease'
        }}
      />
      
      {/* MAIN CONTAINER - Uses category theming */}
      <div className={`
        w-full h-full p-3 rounded-lg border-2 transition-all duration-200
        ${categoryBaseClasses.background}
        ${error ? textTheme.border : categoryBaseClasses.border}
      `}>
        
        {/* HEADER */}
        <div className="flex items-center justify-between mb-2">
          <span className={`font-medium text-sm ${currentTextTheme.primary}`}>
            ⚡ Fast Create Text
          </span>
          <button
            onClick={onToggle}
            className={`transition-colors ${currentButtonTheme}`}
          >
            {isExpanded ? '−' : '+'}
          </button>
        </div>

        {/* COLLAPSED VIEW */}
        {!isExpanded ? (
          <div className="space-y-2">
            {/* TEXT INPUT - Uses category theming */}
            <textarea
              value={data.text || ''}
              onChange={(e) => onUpdate({ text: e.target.value })}
              placeholder="Enter text..."
              className={`
                w-full p-2 rounded text-sm resize-none
                bg-gray-800 dark:bg-gray-700 
                ${error ? textTheme.border : categoryTextTheme.border}
                ${currentTextTheme.primary}
                ${error ? textTheme.focus : categoryTextTheme.focus}
              `}
              rows={2}
            />
            
            {/* QUICK STATUS */}
            <div className={`text-xs ${currentTextTheme.secondary}`}>
              {data.text?.length || 0} chars
              {data.maxLength && ` / ${data.maxLength}`}
            </div>
          </div>
        ) : (
          /* EXPANDED VIEW */
          <div className="space-y-3">
            {/* TEXT INPUT */}
            <div>
              <label className={`block text-xs mb-1 ${currentTextTheme.secondary}`}>
                Text Content
              </label>
              <textarea
                value={data.text || ''}
                onChange={(e) => onUpdate({ text: e.target.value })}
                placeholder="Enter your text content..."
                className={`
                  w-full p-2 rounded text-sm resize-none
                  bg-gray-800 dark:bg-gray-700
                  ${error ? textTheme.border : categoryTextTheme.border}
                  ${currentTextTheme.primary}
                  ${error ? textTheme.focus : categoryTextTheme.focus}
                `}
                rows={3}
              />
            </div>

            {/* PREFIX SETTING */}
            <div>
              <label className={`block text-xs mb-1 ${currentTextTheme.secondary}`}>
                Prefix (Optional)
              </label>
              <input
                type="text"
                value={data.prefix || ''}
                onChange={(e) => onUpdate({ prefix: e.target.value })}
                placeholder="e.g., 'User: '"
                className={`
                  w-full p-2 rounded text-sm
                  bg-gray-800 dark:bg-gray-700
                  ${error ? textTheme.border : categoryTextTheme.border}
                  ${currentTextTheme.primary}
                  ${error ? textTheme.focus : categoryTextTheme.focus}
                `}
              />
            </div>

            {/* MAX LENGTH SETTING */}
            <div>
              <label className={`block text-xs mb-1 ${currentTextTheme.secondary}`}>
                Max Length
              </label>
              <input
                type="number"
                value={data.maxLength || ''}
                onChange={(e) => onUpdate({ maxLength: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder="No limit"
                min="1"
                max="1000"
                className={`
                  w-full p-2 rounded text-sm
                  bg-gray-800 dark:bg-gray-700
                  ${error ? textTheme.border : categoryTextTheme.border}
                  ${currentTextTheme.primary}
                  ${error ? textTheme.focus : categoryTextTheme.focus}
                `}
              />
            </div>

            {/* STATUS INDICATORS */}
            <div className="flex items-center justify-between text-xs">
              <span className={currentTextTheme.secondary}>
                {data.text?.length || 0} chars
                {data.maxLength && ` / ${data.maxLength}`}
              </span>
              
              <div className="flex items-center space-x-2">
                {/* VALIDATION INDICATOR */}
                <span className={`px-2 py-1 rounded text-xs ${
                  data._validated ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                }`}>
                  {data._validated ? '✓ Valid' : '✗ Invalid'}
                </span>
                
                {/* FAST INDICATOR */}
                <span className="px-2 py-1 rounded text-xs bg-blue-600 text-white">
                  ⚡ Fast
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ERROR DISPLAY */}
        {error && (
          <div className="mt-2 p-2 bg-red-800 border border-red-600 rounded text-red-200 text-xs">
            Error: {error}
          </div>
        )}
      </div>
      
      {/* OUTPUT HANDLE */}
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: isActive && data.output ? '#10B981' : '#6B7280',
          transition: 'all 0.1s ease'
        }}
      />
    </>
  );
};

// ============================================================================
// FAST + RELIABLE CREATE TEXT NODE CONFIGURATION
// ============================================================================

const FastReliableCreateText = createFastReliableNode<FastReliableCreateTextData>({
  nodeType: 'fastReliableCreateText',
  displayName: 'FastReliableCreateText',
  category: 'create',
  
  // DEFAULT DATA
  defaultData: {
    text: '',
    isActive: false,
    prefix: '',
    maxLength: undefined,
    isExpanded: false,
    output: '',
    _validated: true
  },
  
  // FAST + RELIABLE COMPUTATION
  compute: computeCreateText,
  
  // VALIDATION
  validate: (data) => {
    return typeof data.text === 'string' && 
           (!data.maxLength || data.text.length <= data.maxLength);
  },
  
  // RENDERER
  renderNode: FastReliableCreateTextRenderer
});

export default FastReliableCreateText; 