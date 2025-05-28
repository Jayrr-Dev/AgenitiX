import React from 'react';
import type { AgenNode } from '../../../FlowEditor';
import { ErrorType } from '../types';
import { TextNodeControl } from '../controls/TextNodeControl';
import { TriggerOnClickControl, TriggerOnToggleControl, TriggerOnPulseControl } from '../controls/TriggerControls';

interface NodeControlsProps {
  node: AgenNode;
  updateNodeData: (id: string, patch: Record<string, unknown>) => void;
  onLogError: (nodeId: string, message: string, type?: ErrorType, source?: string) => void;
  inspectorState: {
    durationInput: string;
    setDurationInput: (value: string) => void;
    countInput: string;
    setCountInput: (value: string) => void;
    multiplierInput: string;
    setMultiplierInput: (value: string) => void;
    delayInput: string;
    setDelayInput: (value: string) => void;
  };
}

export const NodeControls: React.FC<NodeControlsProps> = ({ 
  node, 
  updateNodeData, 
  onLogError, 
  inspectorState 
}) => {
  const renderControlsForNodeType = () => {
    const baseProps = { node, updateNodeData };

    switch (node.type) {
      case 'textNode':
        return <TextNodeControl {...baseProps} />;
      
      case 'outputnode':
        return (
          <div className="flex flex-col gap-2">
            <label className="block text-xs">
              <div className="flex flex-row gap-2">
                <span className="py-1">Label:</span>
                <input
                  type="text"
                  className="w-full rounded border px-1 py-1 text-xs"
                  value={typeof node.data.label === 'string' ? node.data.label : ''}
                  onChange={(e) => updateNodeData(node.id, { label: e.target.value })}
                />
              </div>
            </label>
          </div>
        );
      
      case 'triggerOnClick':
        return <TriggerOnClickControl {...baseProps} />;
      
      case 'triggerOnToggle':
        return <TriggerOnToggleControl {...baseProps} />;
      
      case 'triggerOnPulse':
        return (
          <TriggerOnPulseControl 
            {...baseProps}
            durationInput={inspectorState.durationInput}
            setDurationInput={inspectorState.setDurationInput}
          />
        );
      
      // Add more cases as needed
      default:
        return (
          <div className="text-xs text-gray-500 italic">
            No controls available for this node type
          </div>
        );
    }
  };

  return (
    <div>
      <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
        Controls:
      </h4>
      <div className="space-y-2 overflow-y-auto flex-1">
        {renderControlsForNodeType()}
      </div>
    </div>
  );
}; 