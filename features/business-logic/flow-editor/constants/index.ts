import { Position } from '@xyflow/react';
import type { AgenNode, AgenEdge, TypeMap, NodeTypeConfigMap } from '../types';

// ============================================================================
// TYPE LEGEND & COLORS (sync with CustomHandle)
// ============================================================================

export const TYPE_MAP: TypeMap = {
  s: { label: 's', color: '#3b82f6' },      // string - blue
  n: { label: 'n', color: '#f59e42' },      // number - orange
  b: { label: 'b', color: '#10b981' },      // boolean - green
  j: { label: 'j', color: '#6366f1' },      // JSON - indigo
  a: { label: 'a', color: '#f472b6' },      // array - pink
  N: { label: 'N', color: '#a21caf' },      // Bigint - purple
  f: { label: 'f', color: '#fbbf24' },      // float - yellow
  x: { label: 'x', color: '#6b7280' },      // any - gray
  u: { label: 'u', color: '#d1d5db' },      // undefined - light gray
  S: { label: 'S', color: '#eab308' },      // symbol - gold
  '∅': { label: '∅', color: '#ef4444' },    // null - red
};

// ============================================================================
// NODE TYPE CONFIGURATIONS
// ============================================================================

export const NODE_TYPE_CONFIG: NodeTypeConfigMap = {
  createText: {
    defaultData: { text: '', heldText: '', isActive: false },
    hasControls: true,
    displayName: 'Create Text'
  },
  turnToUppercase: {
    defaultData: { text: '', isActive: false },
    displayName: 'Turn To Uppercase'
  },
  viewOutput: {
    defaultData: { label: 'Result', isActive: false },
    hasTargetPosition: true,
    targetPosition: Position.Top,
    hasOutput: true,
    hasControls: true,
    displayName: 'View Output'
  },
  triggerOnClick: {
    defaultData: { triggered: false, isActive: false },
    hasControls: true,
    displayName: 'Trigger On Click'
  },
  triggerOnPulse: {
    defaultData: { triggered: false, duration: 500, isActive: false },
    hasControls: true,
    displayName: 'Trigger On Pulse'
  },
  cyclePulse: {
    defaultData: {
      triggered: false,
      isRunning: false,
      initialState: false,
      cycleDuration: 2000,
      pulseDuration: 500,
      infinite: true,
      maxCycles: 1,
      isActive: false
    },
    hasControls: true,
    displayName: 'Cycle Pulse'
  },
  triggerOnToggle: {
    defaultData: { triggered: false, isActive: false },
    hasControls: true,
    displayName: 'Trigger On Toggle'
  },
  cycleToggle: {
    defaultData: {
      triggered: false,
      isRunning: false,
      initialState: false,
      onDuration: 4000,
      offDuration: 4000,
      infinite: true,
      maxCycles: 1,
      isActive: false
    },
    hasControls: true,
    displayName: 'Cycle Toggle'
  },
  logicAnd: {
    defaultData: { value: false, inputCount: 2, isActive: false },
    displayName: 'Logic AND'
  },
  logicOr: {
    defaultData: { value: false, inputCount: 2, isActive: false },
    displayName: 'Logic OR'
  },
  logicNot: {
    defaultData: { value: false, isActive: false },
    displayName: 'Logic NOT'
  },
  logicXor: {
    defaultData: { value: false, isActive: false },
    displayName: 'Logic XOR'
  },
  logicXnor: {
    defaultData: { value: false, isActive: false },
    displayName: 'Logic XNOR'
  },
  turnToText: {
    defaultData: { text: '', originalValue: undefined, isActive: false },
    displayName: 'Turn To Text'
  },
  turnToBoolean: {
    defaultData: { value: '', triggered: false, isActive: false },
    displayName: 'Turn To Boolean'
  },
  testInput: {
    defaultData: { value: undefined, isActive: false },
    displayName: 'Test Input'
  },
  editObject: {
    defaultData: { value: {}, isActive: false },
    displayName: 'Edit Object'
  },
  editArray: {
    defaultData: { value: [], isActive: false },
    displayName: 'Edit Array'
  },
  countInput: {
    defaultData: { count: 0, multiplier: 1, isActive: false },
    displayName: 'Count Input'
  },
  delayInput: {
    defaultData: { delay: 1000, isProcessing: false, isActive: false },
    displayName: 'Delay Input'
  },
  testError: {
    defaultData: { 
      errorMessage: 'Custom error message',
      errorType: 'error',
      triggerMode: 'trigger_on',
      isGeneratingError: false,
      text: '',
      json: '',
      isActive: false
    },
    hasControls: true,
    displayName: 'Error Generator'
  },
  testJson: {
    defaultData: { 
      jsonText: '{"example": "value"}',
      parsedJson: null,
      parseError: null,
      json: null,
      isActive: false
    },
    hasControls: true,
    displayName: 'Test JSON'
  }
};

// ============================================================================
// INITIAL DEMO GRAPH
// ============================================================================

export const INITIAL_NODES: AgenNode[] = [
  {
    id: '1',
    type: 'createText',
    position: { x: -100, y: -50 },
    deletable: true,
    data: { text: 'hello', heldText: 'hello', defaultText: 'hello', isActive: true }
  },
  {
    id: '2',
    type: 'createText',
    position: { x: 0, y: 100 },
    deletable: true,
    data: { text: 'world', heldText: 'world', defaultText: 'world', isActive: true }
  },
  {
    id: '3',
    type: 'turnToUppercase',
    position: { x: 100, y: -100 },
    deletable: true,
    data: { text: 'HELLO', isActive: true }
  },
  {
    id: '4',
    type: 'viewOutput',
    position: { x: 300, y: -75 },
    targetPosition: Position.Top,
    deletable: true,
    data: { label: 'Result', isActive: true }
  }
];

export const INITIAL_EDGES: AgenEdge[] = [
  {
    id: 'e1-3',
    source: '1',
    target: '3',
    sourceHandle: 's',
    targetHandle: 's',
    type: 'default',
    deletable: true,
    focusable: true,
    style: { stroke: TYPE_MAP['s'].color, strokeWidth: 2 }
  },
  {
    id: 'e3-4',
    source: '3',
    target: '4',
    sourceHandle: 's',
    targetHandle: 'x',
    type: 'default',
    deletable: true,
    focusable: true,
    style: { stroke: TYPE_MAP['s'].color, strokeWidth: 2 }
  },
  {
    id: 'e2-4',
    source: '2',
    target: '4',
    sourceHandle: 's',
    targetHandle: 'x',
    type: 'default',
    deletable: true,
    focusable: true,
    style: { stroke: TYPE_MAP['s'].color, strokeWidth: 2 }
  }
];

// ============================================================================
// CONFIGURATION CONSTANTS
// ============================================================================

export const COPY_PASTE_OFFSET = 40;
export const MAX_ERRORS_PER_NODE = 10;
export const NODE_ID_PREFIX = 'node-';
export const EDGE_ID_PREFIX = 'edge-';

// ============================================================================
// KEYBOARD SHORTCUTS
// ============================================================================

export const KEYBOARD_SHORTCUTS = {
  COPY: 'c',
  PASTE: 'v',
  TOGGLE_HISTORY: 'h',
  SELECT_ALL: 'a',          // Ctrl+A
  // Alt-based shortcuts
  DELETE_NODES: 'q',        // Alt+Q
  TOGGLE_INSPECTOR: 'a',    // Alt+A  
  DUPLICATE_NODE: 'w',      // Alt+W
  TOGGLE_SIDEBAR: 's'       // Alt+S
} as const;

// ============================================================================
// VALIDATION CONSTANTS
// ============================================================================

export const VALIDATION = {
  MIN_PULSE_DURATION: 50,
  MIN_DELAY: 0,
  MIN_CYCLE_DURATION: 100,
  MIN_INPUT_COUNT: 1,
  MAX_INPUT_COUNT: 10
} as const; 