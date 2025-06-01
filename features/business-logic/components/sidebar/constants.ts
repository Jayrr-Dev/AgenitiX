import { 
  NodeStencil, 
  TabKeyA, 
  TabKeyB, 
  TabKeyC, 
  TabKeyD,
  TabKeyE,
  TAB_CONFIG_A, 
  TAB_CONFIG_B, 
  TAB_CONFIG_C,
  TAB_CONFIG_D,
  TAB_CONFIG_E,
  VariantConfig,
  SidebarVariant
} from './types';

// CENTRALIZED NODE REGISTRY
import { getAvailableNodes, getTestingNodes } from '../../nodes/nodeRegistry';

export const STORAGE_PREFIX = 'sidebar-stencil-order';

// ============================================================================
// AVAILABLE NODES MAPPING (AUTO-GENERATED)
// ============================================================================
// Auto-generated from centralized node registry for better maintainability

export const AVAILABLE_NODES = getAvailableNodes();

// ============================================================================
// AVAILABLE NODES MAPPING
// ============================================================================
// Key-value mapping of all available nodes by filename for better readability

// Helper functions
export const getNodeType = (filename: keyof typeof AVAILABLE_NODES) => AVAILABLE_NODES[filename].nodeType;

// Auto-generate stencil from filename with custom prefix
export const createStencil = (filename: keyof typeof AVAILABLE_NODES, prefix: string, index: number = 1): NodeStencil => {
  const node = AVAILABLE_NODES[filename];
  return {
    id: `${prefix}-${filename.toLowerCase()}-${index}`,
    nodeType: node.nodeType,
    label: node.label,
    description: node.description
  };
};

// Batch create stencils from array of filenames
export const createStencils = (filenames: (keyof typeof AVAILABLE_NODES)[], prefix: string): NodeStencil[] => {
  return filenames.map((filename, index) => createStencil(filename, prefix, index + 1));
};

// ============================================================================
// STENCIL DEFINITIONS
// ============================================================================

// Variant A: Core, Logic, Stores, Testing, Time
export const DEFAULT_STENCILS_A: Record<TabKeyA, NodeStencil[]> = {
  core: createStencils([
    'CreateText', 
    'ViewOutput', 
    'TestInput', 
    'TurnToUppercase', 
    'TurnToText', 
    'TurnToBoolean',
    'LogicAnd', 
    'LogicOr', 
    'LogicNot', 
    'LogicXor', 
    'LogicXnor',
    'EditObject', 
    'EditArray',
    'TriggerOnClick', 
    'TriggerOnPulse', 
    'TriggerOnToggle',
    'CyclePulse', 
    'CycleToggle',
    'CountInput',
    'DelayInput'
  ], 'core'),
  logic: [
    // Logic nodes moved to core for testing
  ],
  stores: [
    // Store nodes moved to core for testing
  ],
  testing: getTestingNodes(), // Auto-generated from registry
  time: [
    // Time nodes moved to core for testing
  ],
};

// Variant B: Images, Audio, Text, Interface, Transform
export const DEFAULT_STENCILS_B: Record<TabKeyB, NodeStencil[]> = {
  images: [
    // Image processing nodes
  ],
  audio: [
    // Audio processing nodes
  ],
  text: [
    // Text processing nodes
  ],
  interface: [
    // Interface nodes will go here
  ],
  transform: [
    // Data transformation nodes
  ],
};

// Variant C: API, Web, Email, Files, Crypto
export const DEFAULT_STENCILS_C: Record<TabKeyC, NodeStencil[]> = {
  api: [
    // API integration nodes
  ],
  web: [
    // Web-related nodes
  ],
  email: [
    // Email integration nodes
  ],
  files: [
    // File-related nodes
  ],
  crypto: [
    // Cryptocurrency/blockchain nodes
  ],
};

// Variant D: Triggers, Flow, Cyclers, Smart, Tools
export const DEFAULT_STENCILS_D: Record<TabKeyD, NodeStencil[]> = {
  triggers: createStencils(['TriggerOnClick', 'TriggerOnPulse', 'TriggerOnToggle'], 'triggers'),
  flow: [
    // Flow control nodes
  ],
  cyclers: createStencils(['CyclePulse', 'CycleToggle'], 'cyclers'),
  smart: [
    // Smart automation nodes
  ],
  tools: [
    // Utility tool nodes
  ],
};

// Variant E: Special, Math, Stuff, Filler, Custom
export const DEFAULT_STENCILS_E: Record<TabKeyE, NodeStencil[]> = {
  special: [
    // Special purpose nodes
  ],
  math: createStencils(['CountInput'], 'math'),
  stuff: [
    // General stuff nodes
  ],
  filler: [
    // Placeholder nodes
  ],
  custom: [
    // Custom user-created nodes
  ],
};

export const VARIANT_CONFIG = {
  a: { tabs: TAB_CONFIG_A, defaults: DEFAULT_STENCILS_A } as VariantConfig<'a'>,
  b: { tabs: TAB_CONFIG_B, defaults: DEFAULT_STENCILS_B } as VariantConfig<'b'>,
  c: { tabs: TAB_CONFIG_C, defaults: DEFAULT_STENCILS_C } as VariantConfig<'c'>,
  d: { tabs: TAB_CONFIG_D, defaults: DEFAULT_STENCILS_D } as VariantConfig<'d'>,
  e: { tabs: TAB_CONFIG_E, defaults: DEFAULT_STENCILS_E } as VariantConfig<'e'>,
} as const; 