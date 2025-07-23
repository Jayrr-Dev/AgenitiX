/**
 * viewText NODE - Clean content-focused node template
 *
 * • Focuses ONLY on content and layout - no structural styling
 * • withNodeScaffold handles all borders, sizing, theming, interactive states
 * • Schema-driven controls in Node Inspector
 * • Type-safe data validation with Zod schema
 * • Clean separation of concerns for maximum maintainability
 *
 * Keywords: view-text, content-focused, schema-driven, type-safe, clean-architecture
 */

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { NodeProps, useReactFlow } from '@xyflow/react';
import { z } from 'zod';
import { withNodeScaffold } from '@/features/business-logic-modern/infrastructure/node-core/withNodeScaffold';
import { NodeSpec } from '@/features/business-logic-modern/infrastructure/node-core/NodeSpec';
import {
  createNodeValidator,
  reportValidationError,
  useNodeDataValidation
} from '@/features/business-logic-modern/infrastructure/node-core/validation';
import { SafeSchemas, createSafeInitialData } from '@/features/business-logic-modern/infrastructure/node-core/schema-helpers';
import { CATEGORIES } from '@/features/business-logic-modern/infrastructure/theming/categories';
import { EXPANDED_SIZES, COLLAPSED_SIZES } from '@/features/business-logic-modern/infrastructure/theming/sizing';
import { ExpandCollapseButton } from '@/components/nodes/ExpandCollapseButton';
import { useNodeData } from '@/hooks/useNodeData';
import { useConnectionHandlers } from '@/features/business-logic-modern/infrastructure/flow-engine/hooks/useConnectionHandlers';

// -- PLOP-INJECTED-IMPORTS --

/**
 * Data schema for viewText node
 * Define your node's data structure - controls are automatically generated
 */
const ViewTextDataSchema = z.object({
  // Basic fields - customize as needed
  text: SafeSchemas.text('Default text'),
  isEnabled: SafeSchemas.boolean(true),
  isActive: SafeSchemas.boolean(false),
  isExpanded: SafeSchemas.boolean(false),
  receivedData: SafeSchemas.optionalText(), // Store received data from connected nodes

  // Dynamic size fields for node inspector controls
  expandedSize: SafeSchemas.text('VE2'), // Dynamic expanded size
  collapsedSize: SafeSchemas.text('C2'), // Dynamic collapsed size

  // Add your fields here - controls are auto-generated:
  // description: SafeSchemas.optionalText(),
  // count: SafeSchemas.number(1, 1, 100),
  // priority: SafeSchemas.enum(['low', 'medium', 'high'], 'medium'),
}).passthrough();

type ViewTextData = z.infer<typeof ViewTextDataSchema>;

// Create enterprise validator
const validateNodeData = createNodeValidator(ViewTextDataSchema, 'ViewText');

/**
 * Dynamic node specification that uses data for sizing
 */
const createDynamicSpec = (nodeData: ViewTextData): NodeSpec => ({
  kind: 'viewText',
  displayName: 'viewText'.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim(),
  label: 'viewText'.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim(),
  category: CATEGORIES.VIEW,
  size: {
    expanded: EXPANDED_SIZES[nodeData.expandedSize as keyof typeof EXPANDED_SIZES] || EXPANDED_SIZES.VE2,
    collapsed: COLLAPSED_SIZES[nodeData.collapsedSize as keyof typeof COLLAPSED_SIZES] || COLLAPSED_SIZES.C2,
  },
  handles: [
    { id: 'json-input', code: 'j', position: 'top', type: 'target', dataType: 'JSON' },
    { id: 'output', code: 's', position: 'right', type: 'source', dataType: 'String' },
    { id: 'activate', code: 's', position: 'left', type: 'target', dataType: 'String' },
  ],
  inspector: {
    key: 'ViewTextInspector',
  },
  version: 1,
  runtime: {
    execute: 'viewText_execute_v1',
  },
  initialData: createSafeInitialData(ViewTextDataSchema),
  dataSchema: ViewTextDataSchema,
  controls: {
    autoGenerate: true,
    excludeFields: ["isActive", "receivedData", "expandedSize", "collapsedSize"], // Hide system fields and size fields from main controls
    customFields: [
      {
        key: "isExpanded",
        type: "boolean",
        label: "Expand",
      },
    ],
  },
  icon: 'LuFileText', // Lucide icon for text viewing
  author: 'Agenitix Team',
  description: 'Displays and formats text content with customizable viewing options',
  feature: 'base',
  tags: ["display", "formatting"],
  theming: {
    
    
    
  },
  receivedData: {
    enabled: true,
    displayMode: 'formatted',
    showInCollapsed: true,
    formatData: (data: any) => {
      // Comprehensive data type handling
      if (data === null) return 'null';
      if (data === undefined) return 'undefined';
      if (typeof data === 'string') return data || 'Empty string';
      if (typeof data === 'number') return String(data);
      if (typeof data === 'boolean') return data ? 'true' : 'false';
      if (typeof data === 'bigint') return data.toString();
      if (typeof data === 'symbol') return data.toString();
      if (typeof data === 'function') return '[Function]';
      
      if (typeof data === 'object') {
        if (Array.isArray(data)) {
          if (data.length === 0) return '[] (empty array)';
          try {
            return JSON.stringify(data, null, 2);
          } catch {
            return '[Array]';
          }
        } else if (data instanceof Date) {
          return data.toISOString();
        } else if (data instanceof RegExp) {
          return data.toString();
        } else if (data instanceof Error) {
          return `Error: ${data.message}`;
        } else if (data instanceof Map) {
          try {
            return JSON.stringify(Array.from(data.entries()), null, 2);
          } catch {
            return '[Map]';
          }
        } else if (data instanceof Set) {
          try {
            return JSON.stringify(Array.from(data), null, 2);
          } catch {
            return '[Set]';
          }
        } else if (data instanceof Promise) {
          return '[Promise]';
        } else {
          // Handle plain objects with common data properties
          const dataProperties = [
            'text', 'output', 'value', 'data', 'content', 'message', 
            'result', 'response', 'body', 'payload', 'input', 'output'
          ];
          
          for (const prop of dataProperties) {
            if (data[prop] !== null && data[prop] !== undefined) {
              if (typeof data[prop] === 'string') {
                return data[prop] || 'Empty string';
              } else if (typeof data[prop] === 'number') {
                return String(data[prop]);
              } else if (typeof data[prop] === 'boolean') {
                return data[prop] ? 'true' : 'false';
              } else if (typeof data[prop] === 'object') {
                try {
                  return JSON.stringify(data[prop], null, 2);
                } catch {
                  return `[${prop}]`;
                }
              } else {
                return String(data[prop]);
              }
            }
          }
          
          // If no common properties found, stringify the entire object
          try {
            return JSON.stringify(data, null, 2);
          } catch {
            return '[Object]';
          }
        }
      }
      
      // Fallback for any other types
      return String(data);
    },
  },
});

// Static spec for registry (uses default sizes)
const spec: NodeSpec = createDynamicSpec({ expandedSize: "VE2", collapsedSize: "C2" } as ViewTextData);

/**
 * Content-focused styling constants
 * Only handles internal layout and content - no structural styling
 */
const CONTENT_STYLES = {
  // Content area layouts
  content: {
    expanded: "p-4 w-full h-full flex flex-col",
    collapsed: "flex items-center justify-center w-full h-full",
  },

  // Header layouts
  header: {
    container: "flex items-center justify-between mb-3",
  },

  // Main content layouts
  main: {
    container: "flex-1 flex items-center justify-center",
    content: "text-center",
    icon: "text-2xl mb-2",
  },

  // Collapsed state layouts
  collapsed: {
    icon: "text-2xl",
  },
} as const;

/**
 * Category-specific text colors from design system
 */
const CATEGORY_TEXT_COLORS = {
  CREATE: {
    primary: "text-(--node-create-text)",
    secondary: "text-(--node-create-text-secondary)",
  },
  VIEW: {
    primary: "text-(--node-view-text)",
    secondary: "text-(--node-view-text-secondary)",
  },
  TRIGGER: {
    primary: "text-(--node-trigger-text)",
    secondary: "text-(--node-trigger-text-secondary)",
  },
  TEST: {
    primary: "text-(--node-test-text)",
    secondary: "text-(--node-test-text-secondary)",
  },
  CYCLE: {
    primary: "text-(--node-cycle-text)",
    secondary: "text-(--node-cycle-text-secondary)",
  },
} as const;

/**
 * viewText Node Component
 *
 * Clean content-focused component using optimized data flow:
 * • Uses useOptimizedDataFlow for instant propagation
 * • Automatically updates when connected nodes change
 * • No infinite loops - proper dependency management
 * • Follows optimized data flow pattern
 */
const ViewTextNodeComponent = ({ data, id, spec }: NodeProps & { spec: NodeSpec }) => {
  // Use proper React Flow data management
  const { nodeData, updateNodeData } = useNodeData(id, data);

  // Direct access to React Flow store for immediate data access
  const { getNodes, getEdges } = useReactFlow();

  // Get isExpanded directly from node data
  const isExpanded = (nodeData as ViewTextData).isExpanded || false;

  // Update expanded state via node data
  const handleToggleExpanded = useCallback(() => {
    updateNodeData({ isExpanded: !isExpanded });
  }, [isExpanded]);

  // Enterprise validation with comprehensive error handling
  const validationResult = validateNodeData(nodeData);
  const validatedData = validationResult.data;

  // Report validation errors for monitoring
  if (!validationResult.success) {
    reportValidationError('ViewText', id, validationResult.errors, {
      originalData: validationResult.originalData,
      component: 'ViewTextNodeComponent',
    });
  }

  // Enterprise data validation hook for real-time updates
  const { getHealthScore } = useNodeDataValidation(
    ViewTextDataSchema,
    'ViewText',
    validatedData,
    id
  );



  // Get category-specific text colors
  const categoryKey = spec.category as keyof typeof CATEGORY_TEXT_COLORS;
  const categoryTextColors = CATEGORY_TEXT_COLORS[categoryKey] || CATEGORY_TEXT_COLORS.CREATE;

  // Track last processed input to prevent unnecessary updates
  const lastProcessedInputRef = useRef<string | null>(null);

  // Connection handlers for immediate response to connect/disconnect events
  useConnectionHandlers(id, {
    onConnect: useCallback((edge: any) => {
      // When a connection is made, clear any "No connected inputs" state
      if (validatedData.text === 'No connected inputs') {
        updateNodeData({
          text: '',
          receivedData: '',
          isActive: false
        });
      }
    }, [validatedData.text, updateNodeData]),
    
    onDisconnect: useCallback((edge: any) => {
      // When a connection is broken, check if there are still other connections
      const nodes = getNodes();
      const edges = getEdges();
      const remainingInputEdges = edges.filter(edge => edge.target === id);
      
      if (remainingInputEdges.length === 0) {
        // No more connections - clear the data
        lastProcessedInputRef.current = null;
        updateNodeData({
          isActive: false,
          receivedData: 'No connected inputs',
          text: 'No connected inputs',
          output: 'No connected inputs'
        });
      }
      // If there are still other connections, the useEffect will handle updating with remaining texts
    }, [updateNodeData, id, getNodes, getEdges])
  });

  // Direct data access to avoid timing issues
  useEffect(() => {
    const nodes = getNodes();
    const edges = getEdges();
    
    // Find connected input nodes
    const inputEdges = edges.filter(edge => edge.target === id);
    const inputNodes = inputEdges.map(edge => 
      nodes.find(node => node.id === edge.source)
    ).filter(Boolean);
    
    if (inputNodes.length > 0) {
      // Collect text from all connected input nodes
      const allTexts: string[] = [];
      
      inputNodes.forEach(sourceNode => {
        if (sourceNode?.data) {
          let nodeText = '';
          
          if (sourceNode.data.text !== undefined) {
            nodeText = String(sourceNode.data.text);
          } else if (sourceNode.data.output !== undefined) {
            nodeText = String(sourceNode.data.output);
          } else {
            nodeText = String(sourceNode.data);
          }
          
          // Only add valid text
          if (nodeText && nodeText !== 'null' && nodeText !== 'undefined') {
            allTexts.push(nodeText);
          }
        }
      });
      
      // Concatenate all texts without separator for predictable behavior
      const concatenatedText = allTexts.join('');
      
      // Always update if the text has changed (including empty strings)
      if (lastProcessedInputRef.current !== concatenatedText) {
        lastProcessedInputRef.current = concatenatedText;
        
        const hasContent = concatenatedText && concatenatedText.trim().length > 0;
        
        updateNodeData({ 
          isActive: hasContent,
          receivedData: concatenatedText,
          text: concatenatedText,
          output: concatenatedText
        });
      }
    } else {
      // No connected inputs - clear the data
      if (lastProcessedInputRef.current !== null) {
        lastProcessedInputRef.current = null;
        
        updateNodeData({ 
          isActive: false,
          receivedData: 'No connected inputs',
          text: 'No connected inputs',
          output: 'No connected inputs'
        });
      }
    }
  }, [id, getNodes, getEdges, updateNodeData]);

  return (
    <>
      <ExpandCollapseButton showUI={isExpanded} onToggle={handleToggleExpanded} size="sm" />

      {isExpanded ? (
        <div className={CONTENT_STYLES.content.expanded}>
          {/* Display received text from connected nodes */}
          <div className={CONTENT_STYLES.main.container}>
            <div className={CONTENT_STYLES.main.content}>
              <div className="font-normal text-xs">
                {validatedData.text || 'No connected inputs'}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className={CONTENT_STYLES.content.collapsed}>
          <div className="text-center">
            {spec.receivedData?.showInCollapsed && validatedData.text !== 'No connected inputs' ? (
              <div className={`text-xs ${categoryTextColors.primary} tracking-wide truncate w-[50px]`}>
                {validatedData.text}
              </div>
            ) : (
              <div className={`text-xs font-medium ${categoryTextColors.primary} tracking-wide truncate w-[50px]`}>
                VIEW
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

// Wrapper component that creates dynamic spec based on node data
const ViewTextNodeWithDynamicSpec = (props: NodeProps) => {
  const { nodeData } = useNodeData(props.id, props.data);
  
  // Memoize the dynamic spec to prevent infinite re-renders
  const dynamicSpec = useMemo(() => createDynamicSpec(nodeData as ViewTextData), [
    nodeData.expandedSize,
    nodeData.collapsedSize,
    nodeData.kind,
    nodeData.displayName,
    nodeData.label,
    nodeData.category,
    nodeData.handles,
    nodeData.inspector,
    nodeData.version,
    nodeData.runtime,
    nodeData.initialData,
    nodeData.dataSchema,
    nodeData.controls,
    nodeData.icon,
    nodeData.author,
    nodeData.description,
    nodeData.feature,
    nodeData.tags
  ]);
  
  return withNodeScaffold(dynamicSpec, (componentProps: NodeProps) => (
    <ViewTextNodeComponent {...componentProps} spec={dynamicSpec} />
  ))(props);
};

export default ViewTextNodeWithDynamicSpec;

// Export spec for registry access
export { spec };
