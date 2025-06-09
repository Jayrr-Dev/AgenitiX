/**
 * REGISTRY CONFIGURATION
 *
 * Central configuration for the unified registry system
 * Controls code generation, validation, caching, and performance
 */

export interface RegistryConfig {
  // Code Generation
  generation: {
    outputDir: string;
    sourceDir: string;
    metaGlob: string;
    categoriesFile: string;
    watch: boolean;
    verbose: boolean;
    validateOnGenerate: boolean;
  };

  // Validation
  validation: {
    strictMode: boolean;
    allowExperimentalNodes: boolean;
    requireInspectorComponents: boolean;
    validateComponentPaths: boolean;
    maxNodeNameLength: number;
    reservedNodeTypes: string[];
  };

  // Performance
  performance: {
    enableCaching: boolean;
    cacheSize: number;
    cacheTTL: number;
    enableLazyLoading: boolean;
    bundleAnalysis: boolean;
    memoryLimit: string;
  };

  // Development
  development: {
    enableHotReload: boolean;
    enableDebugLogging: boolean;
    enablePerformanceLogging: boolean;
    showRegistryStats: boolean;
    enableMockData: boolean;
  };

  // Production
  production: {
    minifyOutput: boolean;
    stripComments: boolean;
    enableSourceMaps: boolean;
    treeshakeUnusedNodes: boolean;
    compressionLevel: number;
  };

  // Domain directories to scan for YAML files
  domains: string[];

  // Specific node types to include (if empty, includes all found nodes)
  includeNodes: string[];

  // Node types to exclude
  excludeNodes: string[];

  // Output configuration
  output: {
    registryFile: string;
    typesFile: string;
    componentsDir: string;
  };

  // Build configuration
  build: {
    validateYaml: boolean;
    generateTypes: boolean;
    generateComponents: boolean;
    hotReload: boolean;
  };

  // Migration configuration
  migration: {
    legacyNodeDomain: string;
    backupOriginals: boolean;
  };
}

/**
 * Default configuration
 */
export const DEFAULT_REGISTRY_CONFIG: RegistryConfig = {
  generation: {
    outputDir: "./generated",
    sourceDir: "./domain",
    metaGlob: "**/meta.json",
    categoriesFile: "./meta/categories.json",
    watch: false,
    verbose: false,
    validateOnGenerate: true,
  },

  validation: {
    strictMode: true,
    allowExperimentalNodes: process.env.NODE_ENV === "development",
    requireInspectorComponents: false,
    validateComponentPaths: true,
    maxNodeNameLength: 50,
    reservedNodeTypes: ["node", "edge", "group", "selection"],
  },

  performance: {
    enableCaching: true,
    cacheSize: 100,
    cacheTTL: 3600,
    enableLazyLoading: true,
    bundleAnalysis: false,
    memoryLimit: "256MB",
  },

  development: {
    enableHotReload: process.env.NODE_ENV === "development",
    enableDebugLogging: process.env.NODE_ENV === "development",
    enablePerformanceLogging: false,
    showRegistryStats: true,
    enableMockData: process.env.NODE_ENV === "test",
  },

  production: {
    minifyOutput: process.env.NODE_ENV === "production",
    stripComments: process.env.NODE_ENV === "production",
    enableSourceMaps: process.env.NODE_ENV !== "production",
    treeshakeUnusedNodes: process.env.NODE_ENV === "production",
    compressionLevel: 9,
  },

  // Scan these domain directories for node configurations
  domains: [
    "create",
    "view",
    "trigger",
    "test",
    "data",
    "media",
    "control",
    "utility",
  ],

  // Include specific nodes (migrated from node-domain)
  includeNodes: [
    // Migrated nodes from /node-domain
    "createText", // from /node-domain/create/CreateText.tsx
    "viewOutput", // from /node-domain/view/ViewOutput.tsx
    "triggerOnToggle", // from /node-domain/trigger/TriggerOnToggle.tsx
    "testError", // from /node-domain/test/TestError.tsx

    // Existing nodes in /domain
    "dataTable",
    "imageTransform",
  ],

  // Exclude any problematic nodes
  excludeNodes: [
    // Add any nodes that shouldn't be included
  ],

  // Output paths
  output: {
    registryFile: "./generated/nodeRegistry.ts",
    typesFile: "./generated/nodeTypes.ts",
    componentsDir: "./generated/components",
  },

  // Build settings
  build: {
    validateYaml: true,
    generateTypes: true,
    generateComponents: true,
    hotReload: process.env.NODE_ENV === "development",
  },

  // Migration settings for consolidating node-domain
  migration: {
    legacyNodeDomain: "../../../node-domain",
    backupOriginals: true,
  },
};

/**
 * Environment-specific configurations
 */
export const ENVIRONMENT_CONFIGS = {
  development: {
    ...DEFAULT_REGISTRY_CONFIG,
    generation: {
      ...DEFAULT_REGISTRY_CONFIG.generation,
      verbose: true,
      watch: true,
    },
    validation: {
      ...DEFAULT_REGISTRY_CONFIG.validation,
      strictMode: false,
      allowExperimentalNodes: true,
    },
    development: {
      ...DEFAULT_REGISTRY_CONFIG.development,
      enableHotReload: true,
      enableDebugLogging: true,
      enablePerformanceLogging: true,
    },
  },

  test: {
    ...DEFAULT_REGISTRY_CONFIG,
    generation: {
      ...DEFAULT_REGISTRY_CONFIG.generation,
      outputDir: "./test-generated",
      validateOnGenerate: true,
    },
    validation: {
      ...DEFAULT_REGISTRY_CONFIG.validation,
      strictMode: true,
      requireInspectorComponents: false,
    },
    development: {
      ...DEFAULT_REGISTRY_CONFIG.development,
      enableMockData: true,
      enableDebugLogging: false,
    },
  },

  production: {
    ...DEFAULT_REGISTRY_CONFIG,
    generation: {
      ...DEFAULT_REGISTRY_CONFIG.generation,
      verbose: false,
      watch: false,
    },
    validation: {
      ...DEFAULT_REGISTRY_CONFIG.validation,
      strictMode: true,
      allowExperimentalNodes: false,
    },
    performance: {
      ...DEFAULT_REGISTRY_CONFIG.performance,
      bundleAnalysis: true,
    },
    development: {
      ...DEFAULT_REGISTRY_CONFIG.development,
      enableHotReload: false,
      enableDebugLogging: false,
      enablePerformanceLogging: false,
      showRegistryStats: false,
    },
  },
};

/**
 * Get configuration for current environment
 */
export function getRegistryConfig(): RegistryConfig {
  const env = process.env.NODE_ENV || "development";
  return (
    ENVIRONMENT_CONFIGS[env as keyof typeof ENVIRONMENT_CONFIGS] ||
    DEFAULT_REGISTRY_CONFIG
  );
}

/**
 * Merge user config with defaults
 */
export function mergeRegistryConfig(
  userConfig: Partial<RegistryConfig>
): RegistryConfig {
  const baseConfig = getRegistryConfig();

  return {
    generation: { ...baseConfig.generation, ...userConfig.generation },
    validation: { ...baseConfig.validation, ...userConfig.validation },
    performance: { ...baseConfig.performance, ...userConfig.performance },
    development: { ...baseConfig.development, ...userConfig.development },
    production: { ...baseConfig.production, ...userConfig.production },
    domains: [...baseConfig.domains, ...(userConfig.domains || [])],
    includeNodes: [
      ...baseConfig.includeNodes,
      ...(userConfig.includeNodes || []),
    ],
    excludeNodes: [
      ...baseConfig.excludeNodes,
      ...(userConfig.excludeNodes || []),
    ],
    output: { ...baseConfig.output, ...userConfig.output },
    build: { ...baseConfig.build, ...userConfig.build },
    migration: { ...baseConfig.migration, ...userConfig.migration },
  };
}

/**
 * Validate configuration
 */
export function validateRegistryConfig(config: RegistryConfig): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate paths
  if (!config.generation.outputDir || !config.generation.sourceDir) {
    errors.push("Output and source directories are required");
  }

  // Validate cache settings
  if (config.performance.cacheSize < 1) {
    errors.push("Cache size must be at least 1");
  }

  if (config.performance.cacheTTL < 0) {
    errors.push("Cache TTL must be non-negative");
  }

  // Validate node name length
  if (config.validation.maxNodeNameLength < 1) {
    errors.push("Max node name length must be at least 1");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export default getRegistryConfig;
