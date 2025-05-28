import { NodeType, NodeTypeConfig } from './types';

export const NODE_TYPE_CONFIG: Record<NodeType, NodeTypeConfig> = {
  textNode: {
    hasOutput: true,
    hasControls: true,
    displayName: 'Text Node'
  },
  uppercaseNode: {
    hasOutput: true,
    hasControls: false,
    displayName: 'Uppercase Node'
  },
  outputnode: {
    hasOutput: true,
    hasControls: true,
    displayName: 'Output Node'
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
  triggerOnPulseCycle: {
    hasOutput: false,
    hasControls: true,
    displayName: 'Trigger On Pulse Cycle'
  },
  triggerOnToggle: {
    hasOutput: false,
    hasControls: true,
    displayName: 'Trigger On Toggle'
  },
  triggerOnToggleCycle: {
    hasOutput: false,
    hasControls: true,
    displayName: 'Trigger On Toggle Cycle'
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
  textConverterNode: {
    hasOutput: false,
    hasControls: true,
    displayName: 'Text Converter'
  },
  booleanConverterNode: {
    hasOutput: false,
    hasControls: true,
    displayName: 'Boolean Converter'
  },
  inputTesterNode: {
    hasOutput: false,
    hasControls: true,
    displayName: 'Input Tester'
  },
  objectEditorNode: {
    hasOutput: false,
    hasControls: true,
    displayName: 'Object Editor'
  },
  arrayEditorNode: {
    hasOutput: false,
    hasControls: true,
    displayName: 'Array Editor'
  },
  counterNode: {
    hasOutput: true,
    hasControls: true,
    displayName: 'Counter Node'
  },
  delayNode: {
    hasOutput: true,
    hasControls: true,
    displayName: 'Delay Node'
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