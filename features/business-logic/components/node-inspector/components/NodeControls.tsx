import React from 'react';
import type { AgenNode } from '../../../flow-editor/types';
import { ErrorType } from '../types';
import { TextNodeControl } from '../controls/TextNodeControl';
import { TriggerOnClickControl, TriggerOnToggleControl, TriggerOnPulseControl, CyclePulseControl, CycleToggleControl } from '../controls/TriggerControls';
import { hasFactoryInspectorControls, getNodeInspectorControls } from '../../../nodes/factory/NodeFactory';

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
    // First check if this node was created with the NodeFactory
    if (hasFactoryInspectorControls(node.type)) {
      const FactoryControlsComponent = getNodeInspectorControls(node.type);
      if (FactoryControlsComponent) {
        return (
          <FactoryControlsComponent
            node={node}
            updateNodeData={updateNodeData}
            onLogError={onLogError}
            inspectorState={inspectorState}
          />
        );
      }
    }

    // Fall back to legacy switch statement for manually registered nodes
    const baseProps = { node, updateNodeData };

    switch (node.type) {
      case 'createText':
        return <TextNodeControl {...baseProps} />;
      
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
      
      case 'cyclePulse':
        return <CyclePulseControl {...baseProps} />;
      
      case 'cycleToggle':
        return <CycleToggleControl {...baseProps} />;
      
      // Add more cases as needed for other node types:
      // case 'turnToUppercase':
      // case 'turnToText':
      // case 'turnToBoolean':
      // case 'testInput':
      // case 'editObject':
      // case 'editArray':
      // case 'countInput':
      // case 'delayInput':
      
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