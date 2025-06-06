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
}

/**
 * Default configuration
 */
export const DEFAULT_REGISTRY_CONFIG: RegistryConfig = {
  generation: {
    outputDir: "./generated",
    sourceDir: "./domain",
    metaGlob: "**/meta.yml",
    categoriesFile: "./meta/categories.yml",
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
