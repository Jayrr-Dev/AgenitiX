import type { NodeProps } from '@xyflow/react';
import { useState } from 'react';
import { z } from 'zod';

import { withNodeScaffold } from '@/features/business-logic-modern/infrastructure/node-core/withNodeScaffold';
import type { NodeSpec } from '@/features/business-logic-modern/infrastructure/node-core/NodeSpec';
import { 
  createNodeValidator, 
  CommonSchemas, 
  reportValidationError,
  useNodeDataValidation 
} from '@/features/business-logic-modern/infrastructure/node-core/validation';
import { CATEGORIES } from '@/features/business-logic-modern/infrastructure/theming/categories';
import { EXPANDED_FIXED_SIZES, COLLAPSED_SIZES } from '@/features/business-logic-modern/infrastructure/theming/sizing';

/**
 * Enterprise-grade data schema for ViewOutputV2U node
 */
const ViewOutputV2UDataSchema = z.object({
  displayedValues: z.array(z.record(z.unknown())).default([]),
  showTypeIndicators: CommonSchemas.boolean.default(true),
  maxDisplayItems: CommonSchemas.positiveInt.default(10),
}).strict();

type ViewOutputV2UData = z.infer<typeof ViewOutputV2UDataSchema>;

// Create enterprise validator
const validateNodeData = createNodeValidator(ViewOutputV2UDataSchema, 'ViewOutputV2U');

/**
 * Node specification with enterprise configuration
 */
const spec: NodeSpec = {
  kind: 'viewOutputV2U',
  displayName: 'View Output (V2U)',
  category: CATEGORIES.VIEW,
  size: {
    expanded: EXPANDED_FIXED_SIZES.FE1,
    collapsed: COLLAPSED_SIZES.C1,
  },
  handles: [
    {
      id: 'json-input',
      dataType: 'j',
      position: 'left',
      type: 'target',
    },
    {
      id: 'input',
      type: 'target',
      dataType: 'a',
      position: 'left',
    }
  ],
  inspector: {
    key: 'ViewOutputV2UInspector',
  },
  initialData: ViewOutputV2UDataSchema.parse({}),
};

/**
 * View Output (V2U) Node Component
 * 
 * Enterprise standards:
 * - Type-safe data validation with Zod
 * - Comprehensive error handling and reporting
 * - Real-time validation metrics
 * - Audit trail for data updates
 */
const ViewOutputV2UComponent = ({ data, id }: NodeProps) => {
  const [isExpanded, setExpanded] = useState(true);
  
  // Enterprise validation with comprehensive error handling
  const validationResult = validateNodeData(data);
  const nodeData = validationResult.data;
  
  // Report validation errors for monitoring
  if (!validationResult.success) {
    reportValidationError('ViewOutputV2U', id, validationResult.errors, {
      originalData: validationResult.originalData,
      component: 'ViewOutputV2UNodeComponent',
    });
  }

  // Enterprise data validation hook for real-time updates
  const { updateData, getHealthScore } = useNodeDataValidation(
    ViewOutputV2UDataSchema,
    'ViewOutputV2U',
    nodeData,
    id
  );

  const onToggle = () => setExpanded(!isExpanded);

  // Handle data updates with validation
  const handleDataUpdate = (updates: Partial<ViewOutputV2UData>) => {
    try {
      const updatedData = updateData(updates);
      console.log(`ViewOutputV2U node ${id} updated:`, updatedData);
      // TODO: Implement actual data persistence via React Flow store
    } catch (error) {
      console.error('Failed to update ViewOutputV2U node data:', error);
    }
  };

  // Helper function to render displayed values
  const renderDisplayedValues = () => {
    if (!nodeData.displayedValues || nodeData.displayedValues.length === 0) {
      return (
        <div className="text-xs text-gray-500 italic">
          No data connected
        </div>
      );
    }

    return nodeData.displayedValues.slice(0, nodeData.maxDisplayItems).map((value, index) => (
      <div key={index} className="border rounded p-2 bg-gray-50">
        <div className="text-xs font-mono">
          {JSON.stringify(value, null, 2)}
        </div>
        {nodeData.showTypeIndicators && (
          <div className="text-xs text-gray-500 mt-1">
            Type: {typeof value === 'object' ? 'Object' : typeof value}
          </div>
        )}
      </div>
    ));
  };

  return (
    <>
      <button
        onClick={onToggle}
        className="absolute top-1 left-1 z-10 w-6 h-6 flex items-center justify-center rounded bg-white/80 hover:bg-white border border-gray-300 text-sm"
      >
        {isExpanded ? '⦾' : '⦿'}
      </button>

      {isExpanded ? (
        <div className="p-4 pt-8">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">View Output (V2U)</h3>
              {process.env.NODE_ENV === 'development' && (
                <span className="text-xs text-gray-500">
                  Health: {getHealthScore()}%
                </span>
              )}
            </div>
            
            <div className="text-xs text-gray-600">
              Enhanced data viewing component with V2U architecture
            </div>
            
            <div className="space-y-2">
                             <div className="flex items-center justify-between">
                 <label className="text-xs font-semibold">Display Settings</label>
                 <span className="text-xs text-gray-500">
                   {nodeData.displayedValues?.length || 0} items
                 </span>
               </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={nodeData.showTypeIndicators}
                  onChange={(e) => handleDataUpdate({ showTypeIndicators: e.target.checked })}
                  className="rounded"
                />
                <label className="text-xs">Show type indicators</label>
              </div>
              
              <div>
                <label className="text-xs font-semibold">Max display items</label>
                <input
                  type="number"
                  value={nodeData.maxDisplayItems}
                  onChange={(e) => handleDataUpdate({ maxDisplayItems: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="w-full p-1 border rounded text-xs"
                  min="1"
                  max="100"
                />
              </div>
              
              <div className="border-t pt-2">
                <label className="text-xs font-semibold">Connected Data</label>
                <div className="max-h-32 overflow-y-auto space-y-1 mt-1">
                  {renderDisplayedValues()}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="text-2xl">👁️</div>
        </div>
      )}
    </>
  );
};

export default withNodeScaffold(spec, ViewOutputV2UComponent);

// Export spec for registry access
export { spec };
