import React from 'react';
import { BaseControlProps } from '../types';
import { BaseControl, StatusBadge, ActionButton } from './BaseControl';

export const TriggerOnClickControl: React.FC<BaseControlProps> = ({ node, updateNodeData }) => {
  return (
    <BaseControl>
      <div className="flex items-center gap-2">
        <span className="text-xs">Status:</span>
        <StatusBadge 
          status={!!node.data.triggered}
          trueLabel="Triggered"
          falseLabel="Ready"
        />
      </div>
      <ActionButton
        onClick={() => updateNodeData(node.id, { triggered: !node.data.triggered })}
      >
        {node.data.triggered ? 'Reset' : 'Trigger'}
      </ActionButton>
    </BaseControl>
  );
};

export const TriggerOnToggleControl: React.FC<BaseControlProps> = ({ node, updateNodeData }) => {
  return (
    <BaseControl>
      <div className="flex items-center gap-2">
        <span className="text-xs">Status:</span>
        <StatusBadge 
          status={!!node.data.triggered}
          trueLabel="ON"
          falseLabel="OFF"
        />
      </div>
      <ActionButton
        onClick={() => updateNodeData(node.id, { triggered: !node.data.triggered })}
      >
        Toggle
      </ActionButton>
    </BaseControl>
  );
};

interface TriggerOnPulseControlProps extends BaseControlProps {
  durationInput: string;
  setDurationInput: (value: string) => void;
}

export const TriggerOnPulseControl: React.FC<TriggerOnPulseControlProps> = ({ 
  node, 
  updateNodeData, 
  durationInput, 
  setDurationInput 
}) => {
  const handleDurationInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '');
    setDurationInput(digits);
  };

  const commitDurationInput = () => {
    let value = Number(durationInput);
    if (isNaN(value) || value < 50) value = 50;
    updateNodeData(node.id, { duration: value });
    setDurationInput(value.toString());
  };

  const handleDurationInputBlur = () => {
    commitDurationInput();
  };

  const handleDurationInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') commitDurationInput();
  };

  return (
    <BaseControl>
      <label className="block text-xs">
        <div className="flex flex-row gap-2 items-center">
          <span className="py-1">Pulse Duration:</span>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            className="w-16 rounded border px-1 py-1 text-xs"
            value={durationInput}
            onChange={handleDurationInputChange}
            onBlur={handleDurationInputBlur}
            onKeyDown={handleDurationInputKeyDown}
          />
          <span className="text-xs">ms</span>
        </div>
      </label>
    </BaseControl>
  );
}; 