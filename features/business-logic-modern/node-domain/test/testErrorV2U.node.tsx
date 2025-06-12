import type { NodeProps } from '@xyflow/react';
import { useState } from 'react';

import { withNodeScaffold } from '@/features/business-logic-modern/infrastructure/node-core/withNodeScaffold';
import type { NodeSpec } from '@/features/business-logic-modern/infrastructure/node-core/NodeSpec';
import { CATEGORIES } from '@/features/business-logic-modern/infrastructure/theming/categories';
import { EXPANDED_FIXED_SIZES, COLLAPSED_SIZES } from '@/features/business-logic-modern/infrastructure/theming/sizing';

const spec: NodeSpec = {
  kind: 'testErrorV2U',
  displayName: 'Test Error (V2U)',
  category: CATEGORIES.TESTING,
  size: {
    expanded: EXPANDED_FIXED_SIZES.FE1,
    collapsed: COLLAPSED_SIZES.C1,
  },
  handles: [
    {
        "id": "text",
        "type": "source",
        "dataType": "string",
        "position": "right",
        "description": "Outputs the error message as a string"
    },
    {
        "id": "json",
        "type": "source",
        "dataType": "json",
        "position": "right",
        "description": "Outputs the error details as a JSON object"
    }
],
  inspector: {
    key: 'TestErrorV2UInspector',
  },
  initialData: {
    "errorMessage": "Custom error message",
    "errorType": "error",
    "isGeneratingError": false
},
};

type TestErrorV2UData = {
  "errorMessage": "Custom error message",
  "errorType": "error",
  "isGeneratingError": false
};

const TestErrorV2UComponent = ({ data, id }: NodeProps<TestErrorV2UData>) => {
  const [isExpanded, setExpanded] = useState(true);

  // In a real implementation, this would come from a hook like useNodeData(id)
  const updateData = (newData: Partial<TestErrorV2UData>) => console.log(`Updating data for ${id}:`, newData);

  const onToggle = () => setExpanded(!isExpanded);

  return (
    <>
      <button onClick={onToggle} style={{position: 'absolute', top: 2, left: 2, zIndex: 10}}>
        {isExpanded ? '⦾' : '⦿'}
      </button>

      {isExpanded ? (
        <div className="p-4 pt-6">
          <h3 className="text-sm font-semibold mb-2">Test Error (V2U)</h3>
          <p className="text-xs text-gray-600">Enhanced error generation with V2U architecture</p>
          {/* Add your expanded UI here */}
        </div>
      ) : (
        <div className="flex items-center justify-center h-full">
          <p className="text-2xl">📄</p>
        </div>
      )}
    </>
  );
};

export default withNodeScaffold(spec, TestErrorV2UComponent);
