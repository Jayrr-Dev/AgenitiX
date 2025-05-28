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

export const STORAGE_PREFIX = 'sidebar-stencil-order';

// ============================================================================
// AVAILABLE NODES MAPPING
// ============================================================================
// Key-value mapping of all available nodes by filename for better readability

export const AVAILABLE_NODES = {
  // Main folder nodes
  'OutputNode': { nodeType: 'outputnode', folder: 'main', label: 'Output Node', description: 'Display the final result of your flow. Connect any node to see its output value in a clean, readable format.' },
  'LogicAnd': { nodeType: 'logicAnd', folder: 'main', label: 'AND (⋀)', description: 'Only outputs TRUE when ALL connected inputs are true. Like saying "I need this AND that AND the other thing to proceed."' },
  'LogicOr': { nodeType: 'logicOr', folder: 'main', label: 'OR (⋁)', description: 'Outputs TRUE when ANY connected input is true. Like saying "I need this OR that OR any of these options to proceed."' },
  'LogicNot': { nodeType: 'logicNot', folder: 'main', label: 'NOT (¬)', description: 'Flips the input - turns TRUE into FALSE and FALSE into TRUE. Perfect for creating opposite conditions.' },
  'LogicXor': { nodeType: 'logicXor', folder: 'main', label: 'XOR (⊕)', description: 'Only TRUE when exactly one input is true. Like an "either/or" choice - you can have one thing OR another, but not both.' },
  'LogicXnor': { nodeType: 'logicXnor', folder: 'main', label: 'XNOR (⊙)', description: 'TRUE when all inputs match (all true OR all false). Perfect for checking if things are "in sync" with each other.' },
  'InputTesterNode': { nodeType: 'inputTesterNode', folder: 'main', label: 'Input Tester', description: 'Create test values to experiment with your flow. Type in any value and see how it affects connected nodes.' },
  'ObjectEditorNode': { nodeType: 'objectEditorNode', folder: 'main', label: 'Object Editor', description: 'Create and edit complex data objects with multiple properties. Perfect for structured data like user profiles or settings.' },
  'ArrayEditorNode': { nodeType: 'arrayEditorNode', folder: 'main', label: 'Array Editor', description: 'Create and edit lists of items. Great for managing collections like shopping lists, user groups, or data sets.' },
  
  // Media folder nodes
  'TextNode': { nodeType: 'textNode', folder: 'media', label: 'Text', description: 'Create and edit text content. Use the textarea to type your message, then connect to other nodes to pass the text along.' },
  'TextUppercaseNode': { nodeType: 'uppercaseNode', folder: 'media', label: 'Uppercase', description: 'Takes any text input and converts it to ALL CAPITAL LETTERS. Perfect for making text stand out or formatting headers.' },
  'TextConverterNode': { nodeType: 'textConverterNode', folder: 'media', label: 'Text Converter', description: 'Converts any input (numbers, objects, etc.) into readable text. Great for displaying complex data as simple text.' },
  
  // Automation folder nodes
  'TriggerOnClick': { nodeType: 'triggerOnClick', folder: 'automation', label: 'Trigger', description: 'Acts like a gate - click the button to allow data to flow through. Great for controlling when things happen in your flow.' },
  'TriggerOnPulse': { nodeType: 'triggerOnPulse', folder: 'automation', label: 'Pulse Trigger', description: 'Sends a quick "pulse" signal when clicked. Like pressing a doorbell - one click sends one signal to connected nodes.' },
  'TriggerOnToggle': { nodeType: 'triggerOnToggle', folder: 'automation', label: 'Toggle Trigger', description: 'A simple ON/OFF switch. Click to toggle between true and false states. Perfect for enabling/disabling parts of your flow.' },
  'TriggerOnPulseCycle': { nodeType: 'triggerOnPulseCycle', folder: 'automation', label: 'Pulse Cycle', description: 'Automatically sends repeated pulses at timed intervals. Set how often and how many times to create automated sequences.' },
  'TriggerOnToggleCycle': { nodeType: 'triggerOnToggleCycle', folder: 'automation', label: 'Toggle Cycle', description: 'Automatically switches between ON and OFF states. Set custom durations for each state to create blinking or cycling patterns.' },
  'BooleanConverterNode': { nodeType: 'booleanConverterNode', folder: 'automation', label: 'Boolean Converter', description: 'Converts any input into TRUE or FALSE. Numbers become false if zero, text becomes false if empty, etc.' },
  'CounterNode': { nodeType: 'counterNode', folder: 'automation', label: 'Counter', description: 'Counts up or down automatically. Set the starting number and step size. Counts each time it receives an input signal.' },
  'DelayNode': { nodeType: 'delayNode', folder: 'automation', label: 'Delay', description: 'Adds a time delay to your flow. Data goes in, waits for the specified time, then comes out. Perfect for creating timed sequences.' },
  
  // Integrations folder nodes (empty for now)
  // Add new integration nodes here as they're created
  
  // Misc folder nodes (empty for now)
  // Add new misc nodes here as they're created
} as const;

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
    'TextNode', 
    'OutputNode', 
    'InputTesterNode', 
    'TextUppercaseNode', 
    'TextConverterNode', 
    'BooleanConverterNode',
    'LogicAnd', 
    'LogicOr', 
    'LogicNot', 
    'LogicXor', 
    'LogicXnor',
    'ObjectEditorNode', 
    'ArrayEditorNode',
    'TriggerOnClick', 
    'TriggerOnPulse', 
    'TriggerOnToggle',
    'TriggerOnPulseCycle', 
    'TriggerOnToggleCycle',
    'CounterNode',
    'DelayNode'
  ], 'core'),
  logic: [
    // Logic nodes moved to core for testing
  ],
  stores: [
    // Store nodes moved to core for testing
  ],
  testing: [
    // Testing and debugging nodes will go here
  ],
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
  cyclers: createStencils(['TriggerOnPulseCycle', 'TriggerOnToggleCycle'], 'cyclers'),
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
  math: createStencils(['CounterNode'], 'math'),
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