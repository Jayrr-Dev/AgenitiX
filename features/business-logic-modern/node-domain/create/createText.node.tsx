import type { NodeProps } from '@xyflow/react';
import { useState } from 'react';
import { z } from 'zod';

import { withNodeScaffold } from '@/features/business-logic-modern/infrastructure/node-core/withNodeScaffold';
import type { NodeSpec } from '@/features/business-logic-modern/infrastructure/node-core/NodeSpec';
import { createNodeValidator, CommonSchemas, reportValidationError } from '@/features/business-logic-modern/infrastructure/node-core/validation';
import { CATEGORIES } from '@/features/business-logic-modern/infrastructure/theming/categories';
import { EXPANDED_FIXED_SIZES, COLLAPSED_SIZES } from '@/features/business-logic-modern/infrastructure/theming/sizing';
// NOTE: This component does not exist yet. We are assuming it will be created.
// import { ExpandCollapseButton } from '@/components/nodes/ExpandCollapseButton';

// Enterprise-grade schema using common validation patterns
const CreateTextDataSchema = z.object({
  text: CommonSchemas.text.default('Hello, new system!'),
}).strict();

type CreateTextData = z.infer<typeof CreateTextDataSchema>;

// Create enterprise validator instance
const validateNodeData = createNodeValidator(CreateTextDataSchema, 'CreateText');

const spec: NodeSpec = {
  kind: 'createText',
  displayName: 'Create Text',
  category: CATEGORIES.CREATE,
  size: {
    expanded: EXPANDED_FIXED_SIZES.FE1,
    collapsed: COLLAPSED_SIZES.C1,
  },
  handles: [
    { id: 'json-input', dataType: 'j', position: 'left', type: 'target' },
    { id: 'output', dataType: 's', position: 'right', type: 'source' },
  ],
  inspector: {
    key: 'CreateTextInspector',
  },
  initialData: CreateTextDataSchema.parse({}),
};

const CreateTextNodeComponent = ({ data, id }: NodeProps) => {
  const [isExpanded, setExpanded] = useState(true);
  
  // Enterprise validation with comprehensive error handling
  const validationResult = validateNodeData(data);
  const nodeData = validationResult.data;
  
  // Report validation errors for monitoring/debugging
  if (!validationResult.success) {
    reportValidationError('CreateText', id, validationResult.errors, {
      originalData: validationResult.originalData,
      component: 'CreateTextNode',
    });
  }

  // In a real implementation, this would come from a hook like useNodeData(id)
  const updateData = (newData: Partial<CreateTextData>) => {
    console.log(`Updating data for ${id}:`, newData);
    // TODO: Implement actual data update with validation
  };

  const onToggle = () => setExpanded(!isExpanded);

  return (
    <>
      <button onClick={onToggle} style={{position: 'absolute', top: 2, left: 2, zIndex: 10}}>
        {isExpanded ? '⦾' : '⦿'}
      </button>

      {isExpanded ? (
        <div className="p-4 pt-6">
            <label className="text-xs font-semibold">Output Text</label>
            <textarea
                value={nodeData.text}
                onChange={(e) => updateData({ text: e.target.value })}
                className="w-full h-16 p-1 border rounded"
            />
        </div>
      ) : (
        <div className="flex items-center justify-center h-full">
          <p className="text-2xl">✍️</p>
        </div>
      )}
    </>
  );
};

export default withNodeScaffold(spec, CreateTextNodeComponent); 