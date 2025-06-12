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
import { SafeSchemas, createSafeInitialData } from '@/features/business-logic-modern/infrastructure/node-core/schema-helpers';
import { CATEGORIES } from '@/features/business-logic-modern/infrastructure/theming/categories';
import { EXPANDED_FIXED_SIZES, COLLAPSED_SIZES } from '@/features/business-logic-modern/infrastructure/theming/sizing';
import { ExpandCollapseButton } from '@/components/nodes/ExpandCollapseButton';

// -- PLOP-INJECTED-IMPORTS --

/**
 * Enterprise-grade data schema for createText node
 * Define your node's data structure with validation rules
 */
const CreateTextDataSchema = z.object({
  // Default schema with common fields - customize as needed:
  text: SafeSchemas.text('Default text'),
  isEnabled: SafeSchemas.boolean(true),
  // Indicates whether the node is active in the flow engine (used by scaffolding/theme)
  isActive: SafeSchemas.boolean(false),
  
  // Add your specific fields here using SafeSchemas:
  // number: SafeSchemas.number(0, 0, 100),
  // url: SafeSchemas.url(),
  // email: SafeSchemas.email(),
  
}).strict(); // Prevents unexpected properties

type CreateTextData = z.infer<typeof CreateTextDataSchema>;

// Create enterprise validator
const validateNodeData = createNodeValidator(CreateTextDataSchema, 'CreateText');

/**
 * Node specification with enterprise configuration
 */
const spec: NodeSpec = {
  kind: 'createText',
  displayName: 'createText',
  category: CATEGORIES.CREATE,
  size: {
    expanded: EXPANDED_FIXED_SIZES.FE1,
    collapsed: COLLAPSED_SIZES.C1,
  },
  handles: [
    // Standard JSON input for programmatic control
    { id: 'json-input', dataType: 'j', position: 'left', type: 'target' },
    
    // Add your specific handles here:
    // { id: 'input-1', dataType: 's', position: 'left', type: 'target' },
    // { id: 'output-1', dataType: 's', position: 'right', type: 'source' },
    
    // Boolean control for activation (if needed)
    // { id: 'activate', dataType: 'b', position: 'left', type: 'target' },
  ],
  inspector: {
    key: 'CreateTextInspector',
  },
  initialData: createSafeInitialData(CreateTextDataSchema), // Auto-generated safe defaults
};

/**
 * createText Node Component
 * 
 * Follows enterprise standards:
 * - Two visual states (collapsed/expanded)
 * - JSON input for programmatic control
 * - Type-safe data validation
 * - Error handling and reporting
 * - Metrics collection
 */
const CreateTextNodeComponent = ({ data, id }: NodeProps) => {
  const [isExpanded, setExpanded] = useState(true);
  
  // Enterprise validation with comprehensive error handling
  const validationResult = validateNodeData(data);
  const nodeData = validationResult.data;
  
  // Report validation errors for monitoring
  if (!validationResult.success) {
    reportValidationError('CreateText', id, validationResult.errors, {
      originalData: validationResult.originalData,
      component: 'CreateTextNodeComponent',
    });
  }

  // Enterprise data validation hook for real-time updates
  const { updateData, getHealthScore } = useNodeDataValidation(
    CreateTextDataSchema,
    'CreateText',
    nodeData,
    id
  );

  const onToggle = () => setExpanded(!isExpanded);

  // Handle data updates with validation
  const handleDataUpdate = (updates: Partial<CreateTextData>) => {
    try {
      const updatedData = updateData(updates);
      console.log(`CreateText node ${id} updated:`, updatedData);
      // TODO: Implement actual data persistence via React Flow store
    } catch (error) {
      console.error('Failed to update CreateText node data:', error);
    }
  };

  return (
    <>
      <ExpandCollapseButton 
        isCollapsed={!isExpanded} 
        onToggle={onToggle} 
      />

      {isExpanded ? (
        <div className="p-4 pt-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">createText</h3>
              {process.env.NODE_ENV === 'development' && (
                <span className="text-xs text-gray-500">
                  Health: {getHealthScore()}%
                </span>
              )}
            </div>
            
            {/* Default UI controls - customize as needed */}
            <div>
              <label className="text-xs font-semibold">Text</label>
              <input
                type="text"
                value={nodeData.text || ''}
                onChange={(e) => handleDataUpdate({ text: e.target.value })}
                className="w-full p-1 border rounded text-sm"
                placeholder="Enter text..."
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={nodeData.isEnabled || false}
                onChange={(e) => handleDataUpdate({ isEnabled: e.target.checked })}
                className="rounded"
              />
              <label className="text-xs">Enabled</label>
            </div>
            
            {/* Example number input:
            <div>
              <label className="text-xs font-semibold">Number</label>
              <input
                type="number"
                value={nodeData.number || 0}
                onChange={(e) => handleDataUpdate({ number: Number(e.target.value) })}
                className="w-full p-1 border rounded text-sm"
              />
            </div>
            */}
            
            {/* Example checkbox:
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={nodeData.isEnabled || false}
                onChange={(e) => handleDataUpdate({ isEnabled: e.target.checked })}
                className="rounded"
              />
              <label className="text-xs">Enable feature</label>
            </div>
            */}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full">
          {/* Add your collapsed UI icon here */}
          <div className="text-2xl">
            🔧
          </div>
        </div>
      )}
    </>
  );
};

export default withNodeScaffold(spec, CreateTextNodeComponent);

// Export spec for registry access
export { spec }; 