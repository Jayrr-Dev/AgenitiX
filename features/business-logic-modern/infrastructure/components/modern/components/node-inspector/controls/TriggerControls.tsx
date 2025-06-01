import React from 'react';
import { BaseControlProps } from '../types';
import { BaseControl, StatusBadge, ActionButton } from './BaseControl';
import { useFlowStore } from '../../../stores/flowStore';

export const TriggerOnClickControl: React.FC<BaseControlProps> = ({ node }) => {
  const updateNodeData = useFlowStore(state => state.updateNodeData);
  
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

export const TriggerOnToggleControl: React.FC<BaseControlProps> = ({ node }) => {
  const updateNodeData = useFlowStore(state => state.updateNodeData);
  
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
  durationInput, 
  setDurationInput 
}) => {
  const updateNodeData = useFlowStore(state => state.updateNodeData);
  
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

export const CyclePulseControl: React.FC<BaseControlProps> = ({ node }) => {
  const updateNodeData = useFlowStore(state => state.updateNodeData);
  
  const [cycleDurationInput, setCycleDurationInput] = React.useState(
    (typeof node.data.cycleDuration === 'number' ? node.data.cycleDuration : 2000).toString()
  );
  const [pulseDurationInput, setPulseDurationInput] = React.useState(
    (typeof node.data.pulseDuration === 'number' ? node.data.pulseDuration : 500).toString()
  );
  const [maxCyclesInput, setMaxCyclesInput] = React.useState(
    (typeof node.data.maxCycles === 'number' ? node.data.maxCycles : 1).toString()
  );

  const infinite = typeof node.data.infinite === 'boolean' ? node.data.infinite : true;
  const isRunning = !!node.data.isRunning;

  // Sync local state with node data changes
  React.useEffect(() => {
    const cycleDuration = typeof node.data.cycleDuration === 'number' ? node.data.cycleDuration : 2000;
    setCycleDurationInput(cycleDuration.toString());
  }, [node.data.cycleDuration]);

  React.useEffect(() => {
    const pulseDuration = typeof node.data.pulseDuration === 'number' ? node.data.pulseDuration : 500;
    setPulseDurationInput(pulseDuration.toString());
  }, [node.data.pulseDuration]);

  React.useEffect(() => {
    const maxCycles = typeof node.data.maxCycles === 'number' ? node.data.maxCycles : 1;
    setMaxCyclesInput(maxCycles.toString());
  }, [node.data.maxCycles]);

  // Handlers for cycle duration
  const handleCycleDurationInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '');
    setCycleDurationInput(digits);
  };

  const commitCycleDurationInput = () => {
    let value = Number(cycleDurationInput);
    if (isNaN(value) || value < 100) value = 100;
    updateNodeData(node.id, { cycleDuration: value });
    setCycleDurationInput(value.toString());
  };

  // Handlers for pulse duration
  const handlePulseDurationInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '');
    setPulseDurationInput(digits);
  };

  const commitPulseDurationInput = () => {
    let value = Number(pulseDurationInput);
    if (isNaN(value) || value < 10) value = 10;
    updateNodeData(node.id, { pulseDuration: value });
    setPulseDurationInput(value.toString());
  };

  // Handlers for max cycles
  const handleMaxCyclesInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '');
    setMaxCyclesInput(digits);
  };

  const commitMaxCyclesInput = () => {
    let value = Number(maxCyclesInput);
    if (isNaN(value) || value < 1) value = 1;
    updateNodeData(node.id, { maxCycles: value });
    setMaxCyclesInput(value.toString());
  };

  return (
    <BaseControl>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs">Status:</span>
          <StatusBadge 
            status={isRunning}
            trueLabel={node.data.pulsing ? "Pulsing" : "Cycling"}
            falseLabel="Stopped"
          />
        </div>
        
        {/* Progress display when running */}
        {isRunning && (
          <div className="flex items-center gap-2">
            <span className="text-xs">Progress:</span>
            <span className="text-xs font-mono text-blue-600 dark:text-blue-400">
              {Math.round((typeof node.data.progress === 'number' ? node.data.progress : 0) * 100)}%
            </span>
          </div>
        )}
        
        <label className="block text-xs">
          <div className="flex flex-row gap-2 items-center">
            <span className="py-1">Cycle Duration:</span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              className="w-20 rounded border px-1 py-1 text-xs"
              value={cycleDurationInput}
              onChange={handleCycleDurationInputChange}
              onBlur={commitCycleDurationInput}
              onKeyDown={(e) => e.key === 'Enter' && commitCycleDurationInput()}
            />
            <span className="text-xs">ms</span>
          </div>
        </label>
        
        <label className="block text-xs">
          <div className="flex flex-row gap-2 items-center">
            <span className="py-1">Pulse Duration:</span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              className="w-20 rounded border px-1 py-1 text-xs"
              value={pulseDurationInput}
              onChange={handlePulseDurationInputChange}
              onBlur={commitPulseDurationInput}
              onKeyDown={(e) => e.key === 'Enter' && commitPulseDurationInput()}
            />
            <span className="text-xs">ms</span>
          </div>
        </label>
        
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={infinite}
            onChange={(e) => updateNodeData(node.id, { infinite: e.target.checked })}
          />
          <span>Infinite cycles</span>
        </label>

        {!infinite && (
          <label className="block text-xs">
            <div className="flex flex-row gap-2 items-center">
              <span className="py-1">Max Cycles:</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className="w-16 rounded border px-1 py-1 text-xs"
                value={maxCyclesInput}
                onChange={handleMaxCyclesInputChange}
                onBlur={commitMaxCyclesInput}
                onKeyDown={(e) => e.key === 'Enter' && commitMaxCyclesInput()}
              />
            </div>
          </label>
        )}
        
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={typeof node.data.initialState === 'boolean' ? node.data.initialState : false}
            onChange={(e) => updateNodeData(node.id, { initialState: e.target.checked })}
          />
          <span>Start ON</span>
        </label>

        <ActionButton
          onClick={() => updateNodeData(node.id, { isRunning: !isRunning })}
          variant={isRunning ? 'danger' : 'primary'}
        >
          {isRunning ? 'Stop Cycle' : 'Start Cycle'}
        </ActionButton>
      </div>
    </BaseControl>
  );
};

export const CycleToggleControl: React.FC<BaseControlProps> = ({ node }) => {
  const updateNodeData = useFlowStore(state => state.updateNodeData);
  
  const [onDurationInput, setOnDurationInput] = React.useState(
    (typeof node.data.onDuration === 'number' ? node.data.onDuration : 4000).toString()
  );
  const [offDurationInput, setOffDurationInput] = React.useState(
    (typeof node.data.offDuration === 'number' ? node.data.offDuration : 4000).toString()
  );
  const [maxCyclesInput, setMaxCyclesInput] = React.useState(
    (typeof node.data.maxCycles === 'number' ? node.data.maxCycles : 1).toString()
  );

  const infinite = typeof node.data.infinite === 'boolean' ? node.data.infinite : true;
  const isRunning = !!node.data.isRunning;

  // Sync local state with node data changes
  React.useEffect(() => {
    const onDuration = typeof node.data.onDuration === 'number' ? node.data.onDuration : 4000;
    setOnDurationInput(onDuration.toString());
  }, [node.data.onDuration]);

  React.useEffect(() => {
    const offDuration = typeof node.data.offDuration === 'number' ? node.data.offDuration : 4000;
    setOffDurationInput(offDuration.toString());
  }, [node.data.offDuration]);

  React.useEffect(() => {
    const maxCycles = typeof node.data.maxCycles === 'number' ? node.data.maxCycles : 1;
    setMaxCyclesInput(maxCycles.toString());
  }, [node.data.maxCycles]);

  // Handlers for ON duration
  const handleOnDurationInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '');
    setOnDurationInput(digits);
  };

  const commitOnDurationInput = () => {
    let value = Number(onDurationInput);
    if (isNaN(value) || value < 100) value = 100;
    updateNodeData(node.id, { onDuration: value });
    setOnDurationInput(value.toString());
  };

  // Handlers for OFF duration
  const handleOffDurationInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '');
    setOffDurationInput(digits);
  };

  const commitOffDurationInput = () => {
    let value = Number(offDurationInput);
    if (isNaN(value) || value < 100) value = 100;
    updateNodeData(node.id, { offDuration: value });
    setOffDurationInput(value.toString());
  };

  // Handlers for max cycles
  const handleMaxCyclesInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '');
    setMaxCyclesInput(digits);
  };

  const commitMaxCyclesInput = () => {
    let value = Number(maxCyclesInput);
    if (isNaN(value) || value < 1) value = 1;
    updateNodeData(node.id, { maxCycles: value });
    setMaxCyclesInput(value.toString());
  };

  return (
    <BaseControl>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs">Status:</span>
          <StatusBadge 
            status={isRunning}
            trueLabel={node.data.pulsing ? "Pulsing" : "Cycling"}
            falseLabel="Stopped"
          />
        </div>
        
        <label className="block text-xs">
          <div className="flex flex-row gap-2 items-center">
            <span className="py-1">ON Duration:</span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              className="w-20 rounded border px-1 py-1 text-xs"
              value={onDurationInput}
              onChange={handleOnDurationInputChange}
              onBlur={commitOnDurationInput}
              onKeyDown={(e) => e.key === 'Enter' && commitOnDurationInput()}
            />
            <span className="text-xs">ms</span>
          </div>
        </label>
        
        <label className="block text-xs">
          <div className="flex flex-row gap-2 items-center">
            <span className="py-1">OFF Duration:</span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              className="w-20 rounded border px-1 py-1 text-xs"
              value={offDurationInput}
              onChange={handleOffDurationInputChange}
              onBlur={commitOffDurationInput}
              onKeyDown={(e) => e.key === 'Enter' && commitOffDurationInput()}
            />
            <span className="text-xs">ms</span>
          </div>
        </label>
        
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={infinite}
            onChange={(e) => updateNodeData(node.id, { infinite: e.target.checked })}
          />
          <span>Infinite cycles</span>
        </label>

        {!infinite && (
          <label className="block text-xs">
            <div className="flex flex-row gap-2 items-center">
              <span className="py-1">Max Cycles:</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className="w-16 rounded border px-1 py-1 text-xs"
                value={maxCyclesInput}
                onChange={handleMaxCyclesInputChange}
                onBlur={commitMaxCyclesInput}
                onKeyDown={(e) => e.key === 'Enter' && commitMaxCyclesInput()}
              />
            </div>
          </label>
        )}
        
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={typeof node.data.initialState === 'boolean' ? node.data.initialState : false}
            onChange={(e) => updateNodeData(node.id, { initialState: e.target.checked })}
          />
          <span>Start ON</span>
        </label>

        <ActionButton
          onClick={() => updateNodeData(node.id, { isRunning: !isRunning })}
          variant={isRunning ? 'danger' : 'primary'}
        >
          {isRunning ? 'Stop Cycling' : 'Start Cycle'}
        </ActionButton>
      </div>
    </BaseControl>
  );
}; 