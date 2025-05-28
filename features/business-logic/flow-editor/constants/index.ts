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
  textNode: {
    defaultData: { text: '', heldText: '', defaultText: '' }
  },
  uppercaseNode: {
    defaultData: { text: '' }
  },
  output: {
    defaultData: { label: 'Result' },
    hasTargetPosition: true,
    targetPosition: Position.Top
  },
  triggerOnClick: {
    defaultData: { triggered: false }
  },
  triggerOnPulse: {
    defaultData: { triggered: false, duration: 500 }
  },
  triggerOnPulseCycle: {
    defaultData: {
      triggered: false,
      initialState: false,
      cycleDuration: 2000,
      pulseDuration: 500,
      infinite: true
    }
  },
  triggerOnToggle: {
    defaultData: { triggered: false }
  },
  triggerOnToggleCycle: {
    defaultData: {
      triggered: false,
      initialState: false,
      onDuration: 4000,
      offDuration: 4000,
      infinite: true
    }
  },
  logicAnd: {
    defaultData: { value: false, inputCount: 2 }
  },
  logicOr: {
    defaultData: { value: false, inputCount: 2 }
  },
  logicNot: {
    defaultData: { value: false }
  },
  logicXor: {
    defaultData: { value: false }
  },
  logicXnor: {
    defaultData: { value: false }
  },
  textConverterNode: {
    defaultData: { value: '' }
  },
  booleanConverterNode: {
    defaultData: { value: '', triggered: false }
  },
  inputTesterNode: {
    defaultData: { value: undefined }
  },
  objectEditorNode: {
    defaultData: { value: {} }
  },
  arrayEditorNode: {
    defaultData: { value: [] }
  },
  counterNode: {
    defaultData: { count: 0, multiplier: 1 }
  },
  delayNode: {
    defaultData: { delay: 1000, isProcessing: false }
  }
};

// ============================================================================
// INITIAL DEMO GRAPH
// ============================================================================

export const INITIAL_NODES: AgenNode[] = [
  {
    id: '1',
    type: 'textNode',
    position: { x: -100, y: -50 },
    data: { text: 'hello', heldText: 'hello', defaultText: 'hello' }
  },
  {
    id: '2',
    type: 'textNode',
    position: { x: 0, y: 100 },
    data: { text: 'world', heldText: 'world', defaultText: 'world' }
  },
  {
    id: '3',
    type: 'uppercaseNode',
    position: { x: 100, y: -100 },
    data: { text: '' }
  },
  {
    id: '4',
    type: 'output',
    position: { x: 300, y: -75 },
    targetPosition: Position.Top,
    data: { label: 'Result' }
  }
];

export const INITIAL_EDGES: AgenEdge[] = [
  {
    id: 'e1-3',
    source: '1',
    target: '3',
    type: 'default',
    style: { stroke: TYPE_MAP['s'].color, strokeWidth: 2 }
  },
  {
    id: 'e3-4',
    source: '3',
    target: '4',
    type: 'default',
    style: { stroke: TYPE_MAP['s'].color, strokeWidth: 2 }
  },
  {
    id: 'e2-4',
    source: '2',
    target: '4',
    type: 'default',
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
  TOGGLE_HISTORY: 'h'
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