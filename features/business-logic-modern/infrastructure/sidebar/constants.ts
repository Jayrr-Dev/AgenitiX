import {
  NodeStencil,
  TAB_CONFIG_A,
  TAB_CONFIG_B,
  TAB_CONFIG_C,
  TAB_CONFIG_D,
  TAB_CONFIG_E,
  TabKeyA,
  TabKeyB,
  TabKeyC,
  TabKeyD,
  TabKeyE,
  VariantConfig,
} from "./types";

// CENTRALIZED NODE REGISTRY
import {
  autoGenerateStencils,
  getAvailableNodes,
  getTestingNodes,
} from "../../node-domain/nodeRegistry";

export const STORAGE_PREFIX = "sidebar-stencil-order";

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
export const getNodeType = (filename: keyof typeof AVAILABLE_NODES) =>
  AVAILABLE_NODES[filename].nodeType;

// Auto-generate stencil from filename with custom prefix
export const createStencil = (
  filename: keyof typeof AVAILABLE_NODES,
  prefix: string,
  index: number = 1
): NodeStencil => {
  const node = AVAILABLE_NODES[filename];
  return {
    id: `${prefix}-${filename.toLowerCase()}-${index}`,
    nodeType: node.nodeType,
    label: node.label,
    description: node.description,
  };
};

// Batch create stencils from array of filenames
export const createStencils = (
  filenames: (keyof typeof AVAILABLE_NODES)[],
  prefix: string
): NodeStencil[] => {
  return filenames.map((filename, index) =>
    createStencil(filename, prefix, index + 1)
  );
};

// ============================================================================
// STENCIL DEFINITIONS - AUTO-GENERATED WHERE POSSIBLE
// ============================================================================

// Variant A: Core, Logic, Stores, Testing, Time
export const DEFAULT_STENCILS_A: Record<TabKeyA, NodeStencil[]> = {
  // Core: Main folder nodes (production-ready)
  core: autoGenerateStencils({ folder: "main" }, "core"),

  // Logic: Already in core, keep empty for now
  logic: [],

  // Stores: Keep empty for now
  stores: [],

  // Testing: Auto-generated from testing folder
  testing: getTestingNodes(),

  // Time: Keep empty for now
  time: [],
};

// Variant B: Images, Audio, Text, Interface, Transform
export const DEFAULT_STENCILS_B: Record<TabKeyB, NodeStencil[]> = {
  images: [],
  audio: [],
  // Text: Media folder nodes
  text: autoGenerateStencils({ folder: "media" }, "text"),
  interface: [],
  transform: [],
};

// Variant C: API, Web, Email, Files, Crypto
export const DEFAULT_STENCILS_C: Record<TabKeyC, NodeStencil[]> = {
  api: [],
  web: [],
  email: [],
  files: [],
  crypto: [],
};

// Variant D: Triggers, Flow, Cyclers, Smart, Tools
export const DEFAULT_STENCILS_D: Record<TabKeyD, NodeStencil[]> = {
  // Triggers: Automation folder trigger nodes
  triggers: autoGenerateStencils(
    { folder: "automation", category: "trigger" },
    "triggers"
  ),
  flow: [],
  // Cyclers: Automation folder cycle nodes
  cyclers: autoGenerateStencils(
    { folder: "automation", category: "cycle" },
    "cyclers"
  ),
  smart: [],
  tools: [],
};

// Variant E: Special, Math, Stuff, Filler, Custom
export const DEFAULT_STENCILS_E: Record<TabKeyE, NodeStencil[]> = {
  special: [],
  // Math: Count/number related nodes
  math: autoGenerateStencils({ category: "count" }, "math"),
  stuff: [],
  filler: [],
  custom: [], // Always empty - populated by user
};

export const VARIANT_CONFIG = {
  a: { tabs: TAB_CONFIG_A, defaults: DEFAULT_STENCILS_A } as VariantConfig<"a">,
  b: { tabs: TAB_CONFIG_B, defaults: DEFAULT_STENCILS_B } as VariantConfig<"b">,
  c: { tabs: TAB_CONFIG_C, defaults: DEFAULT_STENCILS_C } as VariantConfig<"c">,
  d: { tabs: TAB_CONFIG_D, defaults: DEFAULT_STENCILS_D } as VariantConfig<"d">,
  e: { tabs: TAB_CONFIG_E, defaults: DEFAULT_STENCILS_E } as VariantConfig<"e">,
} as const;
