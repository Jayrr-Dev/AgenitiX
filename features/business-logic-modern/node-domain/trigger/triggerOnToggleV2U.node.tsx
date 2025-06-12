import type { NodeProps } from '@xyflow/react';
import { useState } from 'react';

import { withNodeScaffold } from '@/features/business-logic-modern/infrastructure/node-core/withNodeScaffold';
import type { NodeSpec } from '@/features/business-logic-modern/infrastructure/node-core/NodeSpec';
import { CATEGORIES } from '@/features/business-logic-modern/infrastructure/theming/categories';
import { EXPANDED_FIXED_SIZES, COLLAPSED_SIZES } from '@/features/business-logic-modern/infrastructure/theming/sizing';

const spec: NodeSpec = {
  kind: 'triggerOnToggleV2U',
  displayName: 'Trigger On Toggle V2U',
  category: CATEGORIES.TRIGGER,
  size: {
    expanded: EXPANDED_FIXED_SIZES.FE1,
    collapsed: COLLAPSED_SIZES.C1,
  },
  handles: [
    {
        "id": "trigger",
        "type": "source",
        "dataType": "boolean",
        "position": "right"
    },
    {
        "id": "state",
        "type": "source",
        "dataType": "string",
        "position": "right"
    }
],
  inspector: {
    key: 'TriggerOnToggleV2UInspector',
  },
  initialData: {
    "isActive": false,
    "triggerState": "inactive",
    "v2uFeatures": {},
    "advancedTriggers": []
},
};

type TriggerOnToggleV2UData = {
  "isActive": false,
  "triggerState": "inactive",
  "v2uFeatures": {},
  "advancedTriggers": []
};

const TriggerOnToggleV2UComponent = ({ data, id }: NodeProps) => {
  const [isExpanded, setExpanded] = useState(true);

  // In a real implementation, this would come from a hook like useNodeData(id)
  const updateData = (newData: Partial<TriggerOnToggleV2UData>) => console.log(`Updating data for ${id}:`, newData);

  const onToggle = () => setExpanded(!isExpanded);

  return (
    <>
      <button onClick={onToggle} style={{position: 'absolute', top: 2, left: 2, zIndex: 10}}>
        {isExpanded ? '⦾' : '⦿'}
      </button>

      {isExpanded ? (
        <div className="p-4 pt-6">
          <h3 className="text-sm font-semibold mb-2">Trigger On Toggle V2U</h3>
          <p className="text-xs text-gray-600">Ultimate V2U trigger with advanced toggle states and enhanced workflow control</p>
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

export default withNodeScaffold(spec, TriggerOnToggleV2UComponent);

// Export spec for registry access
export { spec };
