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
 * Enterprise-grade data schema for TestErrorV2U node
 */
const TestErrorV2UDataSchema = z.object({
  errorMessage: CommonSchemas.text.default('Custom error message'),
  errorType: z.enum(['error', 'warning', 'info']).default('error'),
  isGeneratingError: CommonSchemas.boolean,
}).strict();

type TestErrorV2UData = z.infer<typeof TestErrorV2UDataSchema>;

// Create enterprise validator
const validateNodeData = createNodeValidator(TestErrorV2UDataSchema, 'TestErrorV2U');

/**
 * Node specification with enterprise configuration
 */
const spec: NodeSpec = {
  kind: 'testErrorV2U',
  displayName: 'Test Error (V2U)',
  category: CATEGORIES.TEST,
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
      id: 'text',
      type: 'source',
      dataType: 's',
      position: 'right',
    },
    {
      id: 'json',
      type: 'source',
      dataType: 'j',
      position: 'right',
    }
  ],
  inspector: {
    key: 'TestErrorV2UInspector',
  },
  initialData: TestErrorV2UDataSchema.parse({}),
};

/**
 * Test Error (V2U) Node Component
 * 
 * Enterprise standards:
 * - Type-safe data validation with Zod
 * - Comprehensive error handling and reporting
 * - Real-time validation metrics
 * - Audit trail for data updates
 */
const TestErrorV2UComponent = ({ data, id }: NodeProps) => {
  const [isExpanded, setExpanded] = useState(true);
  
  // Enterprise validation with comprehensive error handling
  const validationResult = validateNodeData(data);
  const nodeData = validationResult.data;
  
  // Report validation errors for monitoring
  if (!validationResult.success) {
    reportValidationError('TestErrorV2U', id, validationResult.errors, {
      originalData: validationResult.originalData,
      component: 'TestErrorV2UNodeComponent',
    });
  }

  // Enterprise data validation hook for real-time updates
  const { updateData, getHealthScore } = useNodeDataValidation(
    TestErrorV2UDataSchema,
    'TestErrorV2U',
    nodeData,
    id
  );

  const onToggle = () => setExpanded(!isExpanded);

  // Handle data updates with validation
  const handleDataUpdate = (updates: Partial<TestErrorV2UData>) => {
    try {
      const updatedData = updateData(updates);
      console.log(`TestErrorV2U node ${id} updated:`, updatedData);
      // TODO: Implement actual data persistence via React Flow store
    } catch (error) {
      console.error('Failed to update TestErrorV2U node data:', error);
    }
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
              <h3 className="text-sm font-semibold">Test Error (V2U)</h3>
              {process.env.NODE_ENV === 'development' && (
                <span className="text-xs text-gray-500">
                  Health: {getHealthScore()}%
                </span>
              )}
            </div>
            
            <div className="text-xs text-gray-600">
              Enhanced error generation with V2U architecture
            </div>
            
            <div className="space-y-2">
              <div>
                <label className="text-xs font-semibold">Error Message</label>
                <input
                  type="text"
                  value={nodeData.errorMessage}
                  onChange={(e) => handleDataUpdate({ errorMessage: e.target.value })}
                  className="w-full p-1 border rounded text-xs"
                  placeholder="Enter error message..."
                />
              </div>
              
              <div>
                <label className="text-xs font-semibold">Error Type</label>
                <select
                  value={nodeData.errorType}
                  onChange={(e) => handleDataUpdate({ errorType: e.target.value as 'error' | 'warning' | 'info' })}
                  className="w-full p-1 border rounded text-xs"
                >
                  <option value="error">Error</option>
                  <option value="warning">Warning</option>
                  <option value="info">Info</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={nodeData.isGeneratingError}
                  onChange={(e) => handleDataUpdate({ isGeneratingError: e.target.checked })}
                  className="rounded"
                />
                <label className="text-xs">Generate Error</label>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="text-2xl">⚠️</div>
        </div>
      )}
    </>
  );
};

export default withNodeScaffold(spec, TestErrorV2UComponent);

// Export spec for registry access
export { spec };
