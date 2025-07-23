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

import React, { useCallback, useEffect, useState, useRef } from 'react';
import { NodeProps, useReactFlow, useNodes, useEdges } from '@xyflow/react';
import { z } from 'zod';
import { withNodeScaffold } from '@/features/business-logic-modern/infrastructure/node-core/withNodeScaffold';
import { NodeSpec } from '@/features/business-logic-modern/infrastructure/node-core/NodeSpec';
import {
  createNodeValidator,
  CommonSchemas,
  reportValidationError,
  useNodeDataValidation
} from '@/features/business-logic-modern/infrastructure/node-core/validation';
import { SafeSchemas, createSafeInitialData } from '@/features/business-logic-modern/infrastructure/node-core/schema-helpers';
import { CATEGORIES } from '@/features/business-logic-modern/infrastructure/theming/categories';
import { EXPANDED_SIZES, COLLAPSED_SIZES } from '@/features/business-logic-modern/infrastructure/theming/sizing';
import { ExpandCollapseButton } from '@/components/nodes/ExpandCollapseButton';
import { useNodeData } from '@/hooks/useNodeData';

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
 * Clean content-focused component following React Flow best practices:
 * • Uses useReactFlow, useNodeConnections, and useNodesData hooks
 * • Automatically updates when connected nodes change
 * • No infinite loops - proper dependency management
 * • Follows official React Flow computing flows pattern
 */
const ViewTextNodeComponent = ({ data, id }: NodeProps) => {
  // Use proper React Flow data management
  const { nodeData, updateNodeData } = useNodeData(id, data);
  const { getNode, getNodes } = useReactFlow();

  // Local state for received text and active status
  const [receivedText, setReceivedText] = useState<string>('No connected inputs');
  const [isActive, setIsActive] = useState<boolean>(false);
  
  // Ref to track if we've already updated node data to prevent infinite loops
  const lastUpdateRef = useRef<{ text: string; active: boolean } | null>(null);
  
  // Ref to track processing state to prevent recursive updates
  const isProcessingRef = useRef<boolean>(false);
  
  // Ref to track the last processed edge IDs to detect actual changes
  const lastProcessedEdgesRef = useRef<string>('');

  // Get isExpanded directly from node data
  const isExpanded = (nodeData as ViewTextData).isExpanded || false;

  // Update expanded state via node data
  const handleToggleExpanded = useCallback(() => {
    updateNodeData({ ...nodeData, isExpanded: !isExpanded });
  }, [nodeData, isExpanded, updateNodeData]);

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

  // Get all nodes and edges to find connections
  const nodes = useNodes();
  const edges = useEdges();

  // Process connected data when nodes or edges change
  useEffect(() => {
    // Prevent recursive processing
    if (isProcessingRef.current) {
      return;
    }

    const processConnectedData = () => {
      try {
        isProcessingRef.current = true;
        
        // Get only edges that connect to this specific node
        const relevantEdges = edges.filter(edge => edge.target === id);
        
        // Create a hash of the relevant edges to detect actual changes
        const edgesHash = relevantEdges.map(edge => `${edge.source}-${edge.target}-${edge.sourceHandle}-${edge.targetHandle}`).join('|');
        
        // Only process if edges have actually changed
        if (edgesHash === lastProcessedEdgesRef.current) {
          return;
        }
        
        lastProcessedEdgesRef.current = edgesHash;
        
        const connectedTexts: string[] = [];
        
        // Get data from source nodes using spec's formatData function
        relevantEdges.forEach(edge => {
          const sourceNode = nodes.find(node => node.id === edge.source);
          if (sourceNode && sourceNode.data) {
            // Use the spec's formatData function for comprehensive data type handling
            const textValue = spec.receivedData?.formatData?.(sourceNode.data) || String(sourceNode.data);
            connectedTexts.push(textValue);
          }
        });

        // Update received text with proper null handling and determine active state
        if (connectedTexts.length > 0) {
          const formattedTexts = connectedTexts.map(text => {
            if (text === 'null') {
              return 'null';
            } else if (text === 'undefined') {
              return 'undefined';
            } else if (text === 'Empty string') {
              return '';
            } else if (text === 'Invalid data') {
              return 'Invalid data';
            } else {
              return text;
            }
          });
          
          const finalText = formattedTexts.join('\n');
          setReceivedText(finalText);
          
          // Determine if node should be active based on received data
          const hasValidData = formattedTexts.some(text => 
            text !== 'null' && 
            text !== 'undefined' && 
            text !== '' && 
            text !== 'Invalid data' &&
            text !== 'No connected inputs'
          );
          setIsActive(hasValidData);
          
          // Only update node data if values have actually changed to prevent infinite loops
          const currentUpdate = { text: finalText, active: hasValidData };
          if (!lastUpdateRef.current || 
              lastUpdateRef.current.text !== currentUpdate.text || 
              lastUpdateRef.current.active !== currentUpdate.active) {
            lastUpdateRef.current = currentUpdate;
            updateNodeData({ 
              ...nodeData, 
              isActive: hasValidData,
              receivedData: finalText,
              text: finalText // Also update the text field for inspector display
            });
          }
        } else {
          setReceivedText('');
          setIsActive(false);
          
          // Only update node data if values have actually changed
          const currentUpdate = { text: '', active: false };
          if (!lastUpdateRef.current || 
              lastUpdateRef.current.text !== currentUpdate.text || 
              lastUpdateRef.current.active !== currentUpdate.active) {
            lastUpdateRef.current = currentUpdate;
            updateNodeData({ 
              ...nodeData, 
              isActive: false,
              receivedData: '',
              text: 'No connected inputs' // Update text field for inspector display
            });
          }
        }
      } catch (error) {
        console.error('Error processing connected data:', error);
        setReceivedText('Error processing inputs');
      } finally {
        isProcessingRef.current = false;
      }
    };

    processConnectedData();
  }, [edges.filter(edge => edge.target === id).map(edge => `${edge.source}-${edge.target}-${edge.sourceHandle}-${edge.targetHandle}`).join('|')]); // Only depend on relevant edge changes

  return (
    <>
      <ExpandCollapseButton showUI={isExpanded} onToggle={handleToggleExpanded} size="sm" />

      {isExpanded ? (
        <div className={CONTENT_STYLES.content.expanded}>
          {/* Display received text from connected nodes */}
          <div className={CONTENT_STYLES.main.container}>
            <div className={CONTENT_STYLES.main.content}>
              <div className="font-normal text-xs">
                {validatedData.text || receivedText}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className={CONTENT_STYLES.content.collapsed}>
          <div className="text-center">
            {spec.receivedData?.showInCollapsed && (validatedData.text || receivedText) !== 'No connected inputs' ? (
              <div className={`text-xs ${categoryTextColors.primary} tracking-wide truncate w-[50px]`}>
                {validatedData.text || receivedText}
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
  const dynamicSpec = createDynamicSpec(nodeData as ViewTextData);
  return withNodeScaffold(dynamicSpec, ViewTextNodeComponent)(props);
};

export default ViewTextNodeWithDynamicSpec;

// Export spec for registry access
export { spec };
