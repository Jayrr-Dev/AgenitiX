import type { NodeProps } from '@xyflow/react';
import { useState } from 'react';

import { withNodeScaffold } from '@/features/business-logic-modern/infrastructure/node-core/withNodeScaffold';
import type { NodeSpec } from '@/features/business-logic-modern/infrastructure/node-core/NodeSpec';
import { CATEGORIES } from '@/features/business-logic-modern/infrastructure/theming/categories';
import { EXPANDED_FIXED_SIZES, COLLAPSED_SIZES } from '@/features/business-logic-modern/infrastructure/theming/sizing';

const spec: NodeSpec = {
  kind: 'viewOutputV2U',
  displayName: 'View Output (V2U)',
  category: CATEGORIES.OUTPUT,
  size: {
    expanded: EXPANDED_FIXED_SIZES.FE1,
    collapsed: COLLAPSED_SIZES.C1,
  },
  handles: [
    {
        "id": "input",
        "type": "target",
        "dataType": "any",
        "position": "left",
        "description": "Data input from any node - automatically extracts and displays values"
    }
],
  inspector: {
    key: 'ViewOutputV2UInspector',
  },
  initialData: {
    "displayedValues": []
},
};

type ViewOutputV2UData = {
  "displayedValues": []
};

const ViewOutputV2UComponent = ({ data, id }: NodeProps<ViewOutputV2UData>) => {
  const [isExpanded, setExpanded] = useState(true);

  // In a real implementation, this would come from a hook like useNodeData(id)
  const updateData = (newData: Partial<ViewOutputV2UData>) => console.log(`Updating data for ${id}:`, newData);

  const onToggle = () => setExpanded(!isExpanded);

  return (
    <>
      <button onClick={onToggle} style={{position: 'absolute', top: 2, left: 2, zIndex: 10}}>
        {isExpanded ? '⦾' : '⦿'}
      </button>

      {isExpanded ? (
        <div className="p-4 pt-6">
          <h3 className="text-sm font-semibold mb-2">View Output (V2U)</h3>
          <p className="text-xs text-gray-600">Enhanced data viewing component with V2U architecture - displays values from connected nodes with type indicators</p>
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

export default withNodeScaffold(spec, ViewOutputV2UComponent);
