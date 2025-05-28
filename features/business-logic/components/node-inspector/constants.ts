import { NodeType, NodeTypeConfig } from './types';

export const NODE_TYPE_CONFIG: Record<NodeType, NodeTypeConfig> = {
  createText: {
    hasOutput: true,
    hasControls: true,
    displayName: 'Create Text'
  },
  turnToUppercase: {
    hasOutput: true,
    hasControls: false,
    displayName: 'Turn To Uppercase'
  },
  viewOutput: {
    hasOutput: true,
    hasControls: true,
    displayName: 'View Output'
  },
  triggerOnClick: {
    hasOutput: false,
    hasControls: true,
    displayName: 'Trigger On Click'
  },
  triggerOnPulse: {
    hasOutput: false,
    hasControls: true,
    displayName: 'Trigger On Pulse'
  },
  cyclePulse: {
    hasOutput: false,
    hasControls: true,
    displayName: 'Cycle Pulse'
  },
  triggerOnToggle: {
    hasOutput: false,
    hasControls: true,
    displayName: 'Trigger On Toggle'
  },
  cycleToggle: {
    hasOutput: false,
    hasControls: true,
    displayName: 'Cycle Toggle'
  },
  logicAnd: {
    hasOutput: false,
    hasControls: true,
    displayName: 'Logic AND'
  },
  logicOr: {
    hasOutput: false,
    hasControls: true,
    displayName: 'Logic OR'
  },
  logicNot: {
    hasOutput: false,
    hasControls: true,
    displayName: 'Logic NOT'
  },
  logicXor: {
    hasOutput: false,
    hasControls: true,
    displayName: 'Logic XOR'
  },
  logicXnor: {
    hasOutput: false,
    hasControls: true,
    displayName: 'Logic XNOR'
  },
  turnToText: {
    hasOutput: false,
    hasControls: true,
    displayName: 'Turn To Text'
  },
  turnToBoolean: {
    hasOutput: false,
    hasControls: true,
    displayName: 'Turn To Boolean'
  },
  testInput: {
    hasOutput: false,
    hasControls: true,
    displayName: 'Test Input'
  },
  editObject: {
    hasOutput: false,
    hasControls: true,
    displayName: 'Edit Object'
  },
  editArray: {
    hasOutput: false,
    hasControls: true,
    displayName: 'Edit Array'
  },
  countInput: {
    hasOutput: true,
    hasControls: true,
    displayName: 'Count Input'
  },
  delayInput: {
    hasOutput: true,
    hasControls: true,
    displayName: 'Delay Input'
  }
};

export const DEFAULT_VALUES = {
  DURATION: '500',
  COUNT: '0',
  MULTIPLIER: '1',
  DELAY: '1000',
  COUNT_SPEED: 1000,
  CYCLE_DURATION: 2000,
  PULSE_DURATION: 500,
  ON_DURATION: 4000,
  OFF_DURATION: 4000,
  TOTAL_CYCLES: 1
} as const;

export const VALIDATION = {
  MIN_DURATION: 50,
  MIN_DELAY: 0,
  MIN_CYCLES: 1,
  MAX_CYCLES: 1000,
  MIN_COUNT_SPEED: 100
} as const; 