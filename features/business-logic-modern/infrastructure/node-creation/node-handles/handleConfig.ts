/**
 * HANDLE CONFIGURATION SYSTEM - Environment-specific behavior
 *
 * • Production vs Development validation levels
 * • Feature flags for experimental compatibility rules
 * • Performance monitoring thresholds
 * • Error reporting configuration
 */

export interface HandleConfig {
  // Validation strictness
  validation: {
    strictTypeChecking: boolean;
    allowExperimentalTypes: boolean;
    validateRuntimeData: boolean;
    logIncompatibleConnections: boolean;
  };

  // Performance settings
  performance: {
    enablePerformanceMonitoring: boolean;
    maxRegistryAccessTime: number; // milliseconds
    maxCompatibilityCheckTime: number;
    cacheValidationResults: boolean;
  };

  // Error handling
  errorHandling: {
    logLevel: "silent" | "error" | "warn" | "info" | "debug";
    throwOnInvalidConfig: boolean;
    enableErrorReporting: boolean;
    fallbackToAnyType: boolean;
  };

  // Experimental features
  experimental: {
    enhancedCompatibilityRules: boolean;
    unionTypeSupport: boolean;
    customValidationFunctions: boolean;
    dynamicTypeInference: boolean;
  };
}

// Environment-specific configurations
const configs: Record<string, HandleConfig> = {
  production: {
    validation: {
      strictTypeChecking: true,
      allowExperimentalTypes: false,
      validateRuntimeData: false, // Disabled for performance
      logIncompatibleConnections: false,
    },
    performance: {
      enablePerformanceMonitoring: false,
      maxRegistryAccessTime: 10,
      maxCompatibilityCheckTime: 1,
      cacheValidationResults: true,
    },
    errorHandling: {
      logLevel: "error",
      throwOnInvalidConfig: false,
      enableErrorReporting: true,
      fallbackToAnyType: true,
    },
    experimental: {
      enhancedCompatibilityRules: true,
      unionTypeSupport: true,
      customValidationFunctions: false,
      dynamicTypeInference: false,
    },
  },

  development: {
    validation: {
      strictTypeChecking: true,
      allowExperimentalTypes: true,
      validateRuntimeData: true,
      logIncompatibleConnections: true,
    },
    performance: {
      enablePerformanceMonitoring: true,
      maxRegistryAccessTime: 50,
      maxCompatibilityCheckTime: 10,
      cacheValidationResults: false,
    },
    errorHandling: {
      logLevel: "debug",
      throwOnInvalidConfig: true,
      enableErrorReporting: false,
      fallbackToAnyType: false,
    },
    experimental: {
      enhancedCompatibilityRules: true,
      unionTypeSupport: true,
      customValidationFunctions: true,
      dynamicTypeInference: true,
    },
  },

  testing: {
    validation: {
      strictTypeChecking: true,
      allowExperimentalTypes: true,
      validateRuntimeData: true,
      logIncompatibleConnections: false,
    },
    performance: {
      enablePerformanceMonitoring: true,
      maxRegistryAccessTime: 100,
      maxCompatibilityCheckTime: 50,
      cacheValidationResults: false,
    },
    errorHandling: {
      logLevel: "silent",
      throwOnInvalidConfig: true,
      enableErrorReporting: false,
      fallbackToAnyType: false,
    },
    experimental: {
      enhancedCompatibilityRules: true,
      unionTypeSupport: true,
      customValidationFunctions: true,
      dynamicTypeInference: true,
    },
  },
};

/**
 * Get current environment configuration
 */
export function getHandleConfig(): HandleConfig {
  const env = process.env.NODE_ENV || "development";
  return configs[env] || configs.development;
}

/**
 * Override configuration for specific use cases
 */
export function createCustomConfig(
  overrides: Partial<HandleConfig>
): HandleConfig {
  const baseConfig = getHandleConfig();

  return {
    validation: { ...baseConfig.validation, ...overrides.validation },
    performance: { ...baseConfig.performance, ...overrides.performance },
    errorHandling: { ...baseConfig.errorHandling, ...overrides.errorHandling },
    experimental: { ...baseConfig.experimental, ...overrides.experimental },
  };
}
